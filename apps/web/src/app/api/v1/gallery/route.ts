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

  // If filtering by category, find submissions via topic chain OR direct gallery_category
  let assignmentFilter: string[] | null = null;
  let directCategoryIds: string[] | null = null;
  if (category) {
    // Find submissions whose topic matches the category
    const { data: topics } = await supabase
      .from("topics")
      .select("id")
      .eq("category", category);
    const topicIds = topics?.map((t) => t.id) ?? [];

    if (topicIds.length > 0) {
      const { data: assignments } = await supabase
        .from("assignments")
        .select("id")
        .in("topic_id", topicIds);
      assignmentFilter = assignments?.map((a) => a.id) ?? [];
    }

    // Also find submissions with a direct gallery_category override
    const { data: directSubs } = await supabase
      .from("submissions")
      .select("id")
      .eq("gallery_category", category);
    directCategoryIds = directSubs?.map((s) => s.id) ?? [];

    // If neither path found results, return empty
    if ((!assignmentFilter || assignmentFilter.length === 0) && directCategoryIds.length === 0) {
      return NextResponse.json({ submissions: [], total: 0 });
    }
  }

  let query = supabase
    .from("submissions")
    .select(
      "id, status, image_refs, gallery_pdf_ref, gallery_category, created_at, assignment:assignments(id, prompt, essay_type, topic_id, student_id, topic:topics(id, source_text, category, generated_prompts), student:student_profiles(display_name))",
      { count: "exact" }
    )
    .in("status", ["evaluated", "ocr_complete"])
    .not("image_refs", "is", null)
    .neq("image_refs", "{}")
    .order("created_at", { ascending: false });

  if (category) {
    // Combine both filters: assignment-based OR direct gallery_category
    const allAssignmentIds = assignmentFilter ?? [];
    const allDirectIds = directCategoryIds ?? [];

    if (allAssignmentIds.length > 0 && allDirectIds.length > 0) {
      query = query.or(`assignment_id.in.(${allAssignmentIds.join(",")}),id.in.(${allDirectIds.join(",")})`);
    } else if (allAssignmentIds.length > 0) {
      query = query.in("assignment_id", allAssignmentIds);
    } else {
      query = query.in("id", allDirectIds);
    }
  }

  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ submissions: data, total: count ?? 0 });
}
