import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sanitizeInput } from "@/lib/middleware/sanitize";
import { z } from "zod";

const schema = z.object({
  message: z.string().min(1).max(1000),
  history: z.array(z.object({ role: z.enum(["student", "coach"]), content: z.string() })).default([]),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const input = schema.parse(body);
    input.message = sanitizeInput(input.message);

    const { data: draft } = await supabase
      .from("essay_drafts")
      .select("*, assignments:assignment_id(prompt, essay_type)")
      .eq("id", draftId)
      .single();

    if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    if (!draft.ai_assistant_enabled) return NextResponse.json({ error: "AI disabled" }, { status: 403 });

    const { chatWithCoach } = await import("@writeright/ai/writing-assistant/coach");
    const assignment = (draft as any).assignments;

    const result = await chatWithCoach({
      question: input.message,
      essayText: draft.plain_text ?? "",
      essayType: assignment?.essay_type ?? "continuous",
      assignmentPrompt: assignment?.prompt ?? "",
      history: input.history,
    });

    // Log both messages
    await supabase.from("ai_interactions").insert([
      {
        draft_id: draftId,
        student_id: draft.student_id,
        interaction_type: "student_question",
        trigger: "student_ask",
        content: input.message,
      },
      {
        draft_id: draftId,
        student_id: draft.student_id,
        interaction_type: "coach_response",
        trigger: "student_ask",
        content: result.response,
        student_text_context: draft.plain_text?.slice(0, 500),
      },
    ]);

    return NextResponse.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "Validation failed" }, { status: 422 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
