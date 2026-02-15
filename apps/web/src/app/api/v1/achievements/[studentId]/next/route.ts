import { NextRequest, NextResponse } from "next/server";
import { requireParentOrStudent, isAuthError } from "@/lib/middleware/rbac";

export async function GET(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const auth = await requireParentOrStudent(req, studentId);
  if (isAuthError(auth)) return auth;

  const { data: unlocked } = await auth.supabase
    .from("student_achievements")
    .select("achievement_id")
    .eq("student_id", studentId);

  const unlockedIds = (unlocked ?? []).map((a) => a.achievement_id);

  let query = auth.supabase.from("achievements").select("*").order("sort_order");
  if (unlockedIds.length > 0) {
    query = query.not("id", "in", `(${unlockedIds.join(",")})`);
  }

  const { data: nextAchievements } = await query.limit(3);
  return NextResponse.json({ next: nextAchievements ?? [] });
}
