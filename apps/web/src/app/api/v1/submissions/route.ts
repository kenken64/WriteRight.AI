import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const assignmentId = searchParams.get("assignmentId");
  const status = searchParams.get("status");

  let query = supabase.from("submissions").select("*, assignment:assignments(*)").order("created_at", { ascending: false });
  if (assignmentId) query = query.eq("assignment_id", assignmentId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ submissions: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify assignment belongs to this user
  const body = await req.json();
  const { data: assignment } = await supabase
    .from("assignments")
    .select("id")
    .eq("id", body.assignmentId)
    .single();

  if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  // Use admin client for insert to bypass RLS (auth already verified above)
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from("submissions").insert({
    assignment_id: body.assignmentId,
    image_refs: body.imageRefs ?? [],
    status: "draft",
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ submission: data }, { status: 201 });
}
