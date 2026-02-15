import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { data: draft } = await supabase
      .from("essay_drafts")
      .select("*, assignments:assignment_id(prompt, essay_type, word_min, word_max)")
      .eq("id", draftId)
      .single();

    if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

    const { analyzeEssay } = await import("@writeright/ai/writing-assistant/analyzer");
    const assignment = (draft as any).assignments;

    const result = await analyzeEssay({
      text: draft.plain_text ?? "",
      essayType: assignment?.essay_type ?? "continuous",
      assignmentPrompt: assignment?.prompt ?? "",
      wordTarget: assignment?.word_min ? { min: assignment.word_min, max: assignment.word_max } : undefined,
    });

    // Log interaction
    await supabase.from("ai_interactions").insert({
      draft_id: draftId,
      student_id: draft.student_id,
      interaction_type: "structure_hint",
      trigger: "manual_analyze",
      content: JSON.stringify(result),
      student_text_context: draft.plain_text?.slice(0, 500),
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
