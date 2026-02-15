import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import { createAssignmentSchema } from "@/lib/validators/schemas";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const admin = createAdminSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  let query = admin.from("assignments").select("*, topic:topics(*)").order("created_at", { ascending: false });
  if (studentId) query = query.eq("student_id", studentId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ assignments: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const admin = createAdminSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = createAssignmentSchema.parse(body);

    // Resolve student_profile.id from auth user if not provided
    let studentId = parsed.student_id;
    if (!studentId) {
      const { data: profile } = await admin.from("student_profiles").select("id").eq("user_id", user.id).single();
      if (!profile) return NextResponse.json({ error: "Student profile not found. Please complete onboarding." }, { status: 400 });
      studentId = profile.id;
    }

    const { data, error } = await admin.from("assignments").insert({
      ...parsed,
      student_id: studentId,
      language: "en",
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message, details: error, debug: { userId: user.id, parsed } }, { status: 500 });
    }
    return NextResponse.json({ assignment: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
