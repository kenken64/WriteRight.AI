import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  text: z.string(),
  currentParagraph: z.string(),
  cursorParagraphIndex: z.number().int().min(0),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const input = schema.parse(body);

    const { data: draft } = await supabase
      .from("essay_drafts")
      .select("*, assignments:assignment_id(prompt, essay_type, word_min, word_max)")
      .eq("id", draftId)
      .single();

    if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    if (!draft.ai_assistant_enabled) return NextResponse.json({ error: "AI disabled" }, { status: 403 });

    // Check suggestion limit
    const { count } = await supabase
      .from("ai_interactions")
      .select("id", { count: "exact", head: true })
      .eq("draft_id", draftId)
      .eq("interaction_type", "suggestion");

    if ((count ?? 0) >= 10) return NextResponse.json({ error: "Suggestion limit reached" }, { status: 429 });

    const { getSuggestion } = await import("@writeright/ai/writing-assistant/suggester");
    const assignment = (draft as any).assignments;

    const suggestion = await getSuggestion({
      text: input.text,
      currentParagraph: input.currentParagraph,
      cursorParagraphIndex: input.cursorParagraphIndex,
      essayType: assignment?.essay_type ?? "continuous",
      assignmentPrompt: assignment?.prompt ?? "",
      wordTarget: assignment?.word_min ? { min: assignment.word_min, max: assignment.word_max } : undefined,
    });

    await supabase.from("ai_interactions").insert({
      draft_id: draftId,
      student_id: draft.student_id,
      interaction_type: "suggestion",
      trigger: "pause",
      content: JSON.stringify(suggestion),
      student_text_context: input.currentParagraph.slice(0, 500),
    });

    return NextResponse.json(suggestion);
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "Validation failed" }, { status: 422 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
