import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import { extractTextFromFiles } from "@writeright/ai/ocr/vision-client";
import { evaluateEssay } from "@writeright/ai/marking/engine";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Use admin client for DB mutations (RLS already verified via auth above)
  const admin = createAdminSupabaseClient();

  const { data: submission } = await admin
    .from("submissions")
    .select("*, assignment:assignments(*)")
    .eq("id", id)
    .single();

  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!submission.image_refs?.length) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }

  // Transition to processing
  const { data: updated, error: updateErr } = await admin
    .from("submissions")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "draft")
    .select()
    .single();

  if (updateErr || !updated) {
    return NextResponse.json({ error: "Cannot finalize - submission may not be in draft state" }, { status: 409 });
  }

  try {
    // Step 1: OCR / text extraction if not already done
    let ocrText = submission.ocr_text;
    if (!ocrText) {
      // Build public URLs for the uploaded files
      const fileUrls = submission.image_refs.map((ref: string) => {
        const { data } = admin.storage.from("submissions").getPublicUrl(ref);
        return data.publicUrl;
      });

      // Detect file type from the first file's extension
      const firstRef: string = submission.image_refs[0];
      const ext = firstRef.split(".").pop()?.toLowerCase() ?? "";
      const mimeByExt: Record<string, string> = {
        pdf: "application/pdf",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        doc: "application/msword",
      };
      const detectedType = mimeByExt[ext] ?? "image/*";

      const ocrResult = await extractTextFromFiles(fileUrls, detectedType);
      ocrText = ocrResult.text;

      await admin.from("submissions").update({
        ocr_text: ocrResult.text,
        ocr_confidence: ocrResult.confidence,
        status: "ocr_complete",
        updated_at: new Date().toISOString(),
      }).eq("id", id);
    }

    // Step 2: Auto-evaluate
    await admin.from("submissions").update({ status: "evaluating", updated_at: new Date().toISOString() }).eq("id", id);

    const result = await evaluateEssay({
      essayText: ocrText,
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

    const { data: evalData, error: evalErr } = await admin.from("evaluations").insert(evaluation).select().single();

    if (evalErr) {
      await admin.from("submissions").update({ status: "failed", failure_reason: evalErr.message, updated_at: new Date().toISOString() }).eq("id", id);
      return NextResponse.json({ error: evalErr.message }, { status: 500 });
    }

    await admin.from("submissions").update({ status: "evaluated", updated_at: new Date().toISOString() }).eq("id", id);

    return NextResponse.json({ submission: { ...updated, ocr_text: ocrText, status: "evaluated" }, evaluation: evalData }, { status: 201 });
  } catch (err: any) {
    await admin.from("submissions").update({ status: "failed", failure_reason: err.message, updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ error: err.message ?? "Finalize failed" }, { status: 500 });
  }
}
