import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // This endpoint is for parents — verify parent access
  const { data: draft } = await supabase
    .from("essay_drafts")
    .select("student_id")
    .eq("id", draftId)
    .single();

  if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

  // Check if user is parent of student or the student themselves
  const { data: studentProfile } = await supabase
    .from("student_profiles")
    .select("user_id")
    .eq("id", draft.student_id)
    .single();

  const isStudent = studentProfile?.user_id === user.id;

  const { count: parentLink } = await supabase
    .from("parent_student_links")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", user.id)
    .eq("student_id", draft.student_id);

  if (!isStudent && !parentLink) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase
    .from("ai_interactions")
    .select("*")
    .eq("draft_id", draftId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
