import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sanitizeEssayContent, sanitizeInput } from "@/lib/middleware/sanitize";
import { z } from "zod";

const updateSchema = z.object({
  content: z.string().optional(),
  plain_text: z.string().optional(),
  word_count: z.number().int().optional(),
  outline: z.any().optional(),
  writing_mode: z.enum(["practice", "timed", "exam"]).optional(),
  ai_assistant_enabled: z.boolean().optional(),
  status: z.enum(["writing", "paused"]).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("essay_drafts")
    .select("*")
    .eq("id", draftId)
    .single();

  if (error || !data) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const input = updateSchema.parse(body);

    // Sanitize content
    if (input.content) input.content = sanitizeEssayContent(input.content);
    if (input.plain_text) input.plain_text = sanitizeInput(input.plain_text);

    // Update draft
    const { data: draft, error } = await supabase
      .from("essay_drafts")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", draftId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Create new version if content changed
    if (input.content !== undefined) {
      const { data: latestVersion } = await supabase
        .from("draft_versions")
        .select("version_number")
        .eq("draft_id", draftId)
        .order("version_number", { ascending: false })
        .limit(1)
        .single();

      const nextVersion = (latestVersion?.version_number ?? 0) + 1;

      await supabase.from("draft_versions").insert({
        draft_id: draftId,
        content: input.content,
        word_count: input.word_count ?? 0,
        version_number: nextVersion,
        auto_saved: true,
      });

      return NextResponse.json({ ...draft, version_number: nextVersion });
    }

    return NextResponse.json(draft);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.errors }, { status: 422 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
