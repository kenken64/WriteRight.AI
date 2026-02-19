import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import { sanitizeInput } from "@/lib/middleware/sanitize";
import { evaluateEssay } from "@writeright/ai/marking/engine";
import { runPreEvaluationChecks } from "@writeright/ai/marking/pre-checks";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("submissions")
    .select("id, ocr_text, ocr_confidence, status")
    .eq("id", id)
    .single();

  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ocrText: data.ocr_text, confidence: data.ocr_confidence, status: data.status });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const body = await req.json();
  const sanitizedText = sanitizeInput(body.ocrText);

  // Save edited text and reset status
  const { data, error } = await supabase
    .from("submissions")
    .update({
      ocr_text: sanitizedText,
      ocr_confidence: body.confidence ?? null,
      status: "ocr_complete",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*, assignment:assignments(*)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Delete stale rewrites — they were generated from the old text
  await admin.from("rewrites").delete().eq("submission_id", id);

  // Auto re-evaluate in background with the edited text
  after(async () => {
    console.log(`[ocr-text:bg] Re-evaluating submission ${id} after OCR text edit`);
    try {
      // Pre-evaluation validation
      console.log(`[ocr-text:bg] Running pre-evaluation checks...`);
      const preCheck = await runPreEvaluationChecks({
        essayText: sanitizedText,
        prompt: data.assignment?.prompt ?? "",
        essayType: data.assignment?.essay_type ?? "continuous",
        guidingPoints: data.assignment?.guiding_points ?? undefined,
        submissionId: id,
      });

      if (!preCheck.passed) {
        console.error(`[ocr-text:bg] Pre-check failed: ${preCheck.issues.join(", ")}`);
        await admin.from("submissions").update({
          status: "failed",
          failure_reason: preCheck.issues.join(". "),
          updated_at: new Date().toISOString(),
        }).eq("id", id);
        return;
      }
      console.log(`[ocr-text:bg] Pre-checks passed — language: ${preCheck.language}, topic: ${preCheck.topicAlignmentScore.toFixed(2)}`);

      await admin.from("submissions").update({ status: "evaluating", updated_at: new Date().toISOString() }).eq("id", id);

      const result = await evaluateEssay({
        essayText: sanitizedText,
        essayType: data.assignment?.essay_type ?? "continuous",
        essaySubType: data.assignment?.essay_sub_type ?? undefined,
        prompt: data.assignment?.prompt ?? "",
        guidingPoints: data.assignment?.guiding_points ?? undefined,
        level: "sec4",
      });

      const evaluation = {
        submission_id: id,
        essay_type: result.essayType,
        rubric_version: result.rubricVersion,
        model_id: result.modelId,
        prompt_version: result.promptVersion,
        dimension_scores: result.dimensionScores,
        total_score: result.totalScore,
        band: result.band,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        next_steps: result.nextSteps,
        confidence: result.confidence,
        review_recommended: result.reviewRecommended,
      };

      const { error: evalErr } = await admin.from("evaluations").insert(evaluation).select().single();

      if (evalErr) {
        console.error(`[ocr-text:bg] Evaluation insert failed:`, evalErr.message);
        await admin.from("submissions").update({ status: "failed", failure_reason: evalErr.message, updated_at: new Date().toISOString() }).eq("id", id);
        return;
      }

      await admin.from("submissions").update({ status: "evaluated", updated_at: new Date().toISOString() }).eq("id", id);
      console.log(`[ocr-text:bg] Re-evaluation complete for ${id} — score: ${result.totalScore}, band: ${result.band}`);

      // Check achievements (fire-and-forget)
      try {
        const studentId = data.assignment?.student_id;
        if (studentId) {
          await admin.functions.invoke('check-achievements', {
            body: { studentId },
          });
          console.log(`[ocr-text:bg] Achievement check completed for ${studentId}`);
        }
      } catch (achErr: any) {
        console.error(`[ocr-text:bg] Achievement check failed:`, achErr.message);
      }
    } catch (err: any) {
      console.error(`[ocr-text:bg] Re-evaluation error:`, err.message);
      await admin.from("submissions").update({ status: "failed", failure_reason: err.message, updated_at: new Date().toISOString() }).eq("id", id);
    }
  });

  return NextResponse.json({ submission: data, reEvaluating: true });
}
