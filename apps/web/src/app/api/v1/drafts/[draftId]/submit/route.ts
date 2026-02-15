import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get draft
  const { data: draft, error: draftErr } = await supabase
    .from("essay_drafts")
    .select("*")
    .eq("id", draftId)
    .single();

  if (draftErr || !draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  if (draft.status === "submitted") return NextResponse.json({ error: "Already submitted" }, { status: 400 });

  // Mark draft as submitted
  await supabase
    .from("essay_drafts")
    .update({ status: "submitted", updated_at: new Date().toISOString() })
    .eq("id", draftId);

  // Create submission record (admin client to bypass RLS — auth verified above)
  const admin = createAdminSupabaseClient();
  const { data: submission, error: subErr } = await admin
    .from("submissions")
    .insert({
      assignment_id: draft.assignment_id,
      ocr_text: draft.plain_text,
      word_count: draft.word_count,
      status: "ocr_complete",
    })
    .select()
    .single();

  if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 });

  return NextResponse.json({ submission_id: submission.id, status: "submitted" });
}
