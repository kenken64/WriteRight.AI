import { NextRequest, NextResponse } from "next/server";
import { requireParentOrStudent, isAuthError } from "@/lib/middleware/rbac";

export async function GET(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const auth = await requireParentOrStudent(req, studentId);
  if (isAuthError(auth)) return auth;

  const { data, error } = await auth.supabase
    .from("student_achievements")
    .select("*, achievement:achievements(*)")
    .eq("student_id", studentId)
    .order("unlocked_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ achievements: data });
}
