import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const createSchema = z.object({
  assignment_id: z.string().uuid(),
  writing_mode: z.enum(["practice", "timed", "exam"]).default("practice"),
  timer_duration_min: z.number().int().positive().optional(),
  ai_assistant_enabled: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const input = createSchema.parse(body);

    // Get student profile
    const { data: student } = await supabase
      .from("student_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!student) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

    const { data: draft, error } = await supabase
      .from("essay_drafts")
      .insert({
        assignment_id: input.assignment_id,
        student_id: student.id,
        writing_mode: input.writing_mode,
        timer_duration_min: input.timer_duration_min,
        ai_assistant_enabled: input.ai_assistant_enabled,
        content: "",
        plain_text: "",
        word_count: 0,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Create initial version
    await supabase.from("draft_versions").insert({
      draft_id: draft.id,
      content: "",
      word_count: 0,
      version_number: 1,
      auto_saved: true,
    });

    return NextResponse.json(draft, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.errors }, { status: 422 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: student } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!student) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

  const assignmentId = req.nextUrl.searchParams.get("assignment_id");
  let query = supabase
    .from("essay_drafts")
    .select("*")
    .eq("student_id", student.id)
    .order("updated_at", { ascending: false });

  if (assignmentId) query = query.eq("assignment_id", assignmentId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
