import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import { evaluateEssay } from "@writeright/ai/marking/engine";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();

  const { data: submission } = await admin
    .from("submissions")
    .select("*, assignment:assignments(*)")
    .eq("id", id)
    .single();

  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!submission.ocr_text) {
    return NextResponse.json({ error: "OCR not complete" }, { status: 400 });
  }

  // Update status to evaluating
  await admin.from("submissions").update({ status: "evaluating", updated_at: new Date().toISOString() }).eq("id", id);

  try {
    const result = await evaluateEssay({
      essayText: submission.ocr_text,
      essayType: submission.assignment?.essay_type ?? "continuous",
      essaySubType: submission.assignment?.essay_sub_type ?? undefined,
      prompt: submission.assignment?.prompt ?? "",
      guidingPoints: submission.assignment?.guiding_points ?? undefined,
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

    const { data: evalData, error } = await admin.from("evaluations").insert(evaluation).select().single();

    if (error) {
      await admin.from("submissions").update({ status: "failed", failure_reason: error.message, updated_at: new Date().toISOString() }).eq("id", id);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await admin.from("submissions").update({ status: "evaluated", updated_at: new Date().toISOString() }).eq("id", id);

    return NextResponse.json({ evaluation: evalData }, { status: 201 });
  } catch (err: any) {
    await admin.from("submissions").update({ status: "failed", failure_reason: err.message, updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ error: err.message ?? "Evaluation failed" }, { status: 500 });
  }
}
