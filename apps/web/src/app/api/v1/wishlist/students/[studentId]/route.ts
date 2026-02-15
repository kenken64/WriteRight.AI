import { NextRequest, NextResponse } from "next/server";
import { requireParentOrStudent, isAuthError } from "@/lib/middleware/rbac";
import { sanitizeInput } from "@/lib/middleware/sanitize";

export async function GET(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const auth = await requireParentOrStudent(req, studentId);
  if (isAuthError(auth)) return auth;

  const { data, error } = await auth.supabase
    .from("wishlist_items")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const auth = await requireParentOrStudent(req, studentId);
  if (isAuthError(auth)) return auth;

  const body = await req.json();
  const { data, error } = await auth.supabase.from("wishlist_items").insert({
    student_id: studentId,
    created_by: body.createdBy ?? "student",
    title: sanitizeInput(body.title),
    description: body.description ? sanitizeInput(body.description) : null,
    image_url: body.imageUrl ?? null,
    reward_type: body.rewardType ?? "custom",
    required_achievement_id: body.requiredAchievementId ?? null,
    is_surprise: body.isSurprise ?? false,
    status: body.createdBy === "parent" ? "locked" : "pending_parent",
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data }, { status: 201 });
}
