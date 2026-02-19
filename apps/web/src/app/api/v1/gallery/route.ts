import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { parsePaginationParams, toSupabaseRange } from "@/lib/utils/pagination";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const { page, pageSize } = parsePaginationParams(searchParams);
  const { from, to } = toSupabaseRange({ page, pageSize });

  // If filtering by category, first find matching topic IDs, then filter assignments
  let assignmentFilter: string[] | null = null;
  if (category) {
    const { data: topics } = await supabase
      .from("topics")
      .select("id")
      .eq("category", category);
    if (!topics || topics.length === 0) {
      return NextResponse.json({ submissions: [], total: 0 });
    }
    const topicIds = topics.map((t) => t.id);

    const { data: assignments } = await supabase
      .from("assignments")
      .select("id")
      .in("topic_id", topicIds);
    if (!assignments || assignments.length === 0) {
      return NextResponse.json({ submissions: [], total: 0 });
    }
    assignmentFilter = assignments.map((a) => a.id);
  }

  let query = supabase
    .from("submissions")
    .select(
      "id, status, image_refs, gallery_pdf_ref, created_at, assignment:assignments(id, prompt, essay_type, topic_id, student_id, topic:topics(id, source_text, category, generated_prompts), student:student_profiles(display_name))",
      { count: "exact" }
    )
    .in("status", ["evaluated", "ocr_complete"])
    .order("created_at", { ascending: false });

  if (assignmentFilter) {
    query = query.in("assignment_id", assignmentFilter);
  }

  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ submissions: data, total: count ?? 0 });
}
