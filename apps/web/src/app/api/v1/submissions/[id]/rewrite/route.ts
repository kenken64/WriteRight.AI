import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import { rewriteEssay } from "@writeright/ai/rewrite/engine";
import type { EvaluationResult } from "@writeright/ai/shared/types";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const body = await req.json();
  const mode = body.mode ?? "exam_optimised";
  const requestedTargetBand = body.targetBand ? Number(body.targetBand) : undefined;

  const { data: submission } = await admin
    .from("submissions")
    .select("*, assignment:assignments(*), evaluations(*)")
    .eq("id", id)
    .single();

  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!submission.ocr_text) return NextResponse.json({ error: "No text to rewrite" }, { status: 400 });

  const latestEval = submission.evaluations?.sort((a: any, b: any) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )?.[0];

  if (!latestEval) return NextResponse.json({ error: "No evaluation found — evaluate first" }, { status: 400 });

  try {
    const evalForAI: EvaluationResult = {
      essayType: latestEval.essay_type,
      rubricVersion: latestEval.rubric_version,
      modelId: latestEval.model_id,
      promptVersion: latestEval.prompt_version,
      dimensionScores: latestEval.dimension_scores,
      totalScore: latestEval.total_score,
      band: latestEval.band,
      strengths: latestEval.strengths,
      weaknesses: latestEval.weaknesses,
      nextSteps: latestEval.next_steps,
      confidence: latestEval.confidence,
      reviewRecommended: latestEval.review_recommended,
    };

    const result = await rewriteEssay({
      essayText: submission.ocr_text,
      mode,
      evaluation: evalForAI,
      essayType: submission.assignment?.essay_type ?? "continuous",
      prompt: submission.assignment?.prompt ?? "",
      targetBand: requestedTargetBand,
    });

    const rewrite = {
      submission_id: id,
      mode: result.mode,
      model_id: process.env.OPENAI_MODEL_PRIMARY ?? "gpt-4o",
      prompt_version: "rewrite-v1",
      rewritten_text: result.rewrittenText,
      diff_payload: result.diffPayload,
      rationale: result.rationale,
      band_justification: result.bandJustification,
      paragraph_annotations: result.paragraphAnnotations,
      target_band: result.targetBand,
    };

    const { data, error } = await admin.from("rewrites").insert(rewrite).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ rewrite: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Rewrite failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data } = await admin.from("rewrites").select("*").eq("submission_id", id).order("created_at", { ascending: false });
  return NextResponse.json({ rewrites: data ?? [] });
}
