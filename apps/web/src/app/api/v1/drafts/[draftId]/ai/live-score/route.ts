import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({ text: z.string().min(1) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { text } = schema.parse(body);

    const { data: draft } = await supabase
      .from("essay_drafts")
      .select("*, assignments:assignment_id(prompt, essay_type)")
      .eq("id", draftId)
      .single();

    if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

    const { scoreLive } = await import("@writeright/ai/writing-assistant/live-scorer");
    const assignment = (draft as any).assignments;

    const result = await scoreLive({
      text,
      essayType: assignment?.essay_type ?? "continuous",
      assignmentPrompt: assignment?.prompt ?? "",
    });

    // Store score
    await supabase.from("live_scores").insert({
      draft_id: draftId,
      student_id: draft.student_id,
      paragraph_count: result.paragraphCount,
      total_score: result.totalScore,
      band: result.band,
      dimension_scores: result.dimensions,
      next_band_tips: result.nextBandTips,
      rubric_version: result.rubricVersion,
      model_id: result.modelId,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "Validation failed" }, { status: 422 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
