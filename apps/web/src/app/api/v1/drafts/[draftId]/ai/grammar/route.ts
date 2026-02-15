import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({ text: z.string().min(10) });

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
      .select("student_id, ai_assistant_enabled")
      .eq("id", draftId)
      .single();

    if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    if (!draft.ai_assistant_enabled) return NextResponse.json({ error: "AI disabled" }, { status: 403 });

    const { checkGrammar } = await import("@writeright/ai/writing-assistant/grammar-checker");
    const result = await checkGrammar({ text });

    // Clear old annotations and insert new
    await supabase.from("grammar_annotations").delete().eq("draft_id", draftId);

    if (result.annotations.length > 0) {
      await supabase.from("grammar_annotations").insert(
        result.annotations.map((a) => ({
          draft_id: draftId,
          offset_start: a.offsetStart,
          offset_end: a.offsetEnd,
          category: a.category,
          original_text: a.originalText,
          suggestion: a.suggestion,
          explanation: a.explanation,
        }))
      );
    }

    return NextResponse.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "Validation failed" }, { status: 422 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
