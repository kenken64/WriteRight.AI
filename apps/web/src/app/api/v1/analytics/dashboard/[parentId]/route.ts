import { NextRequest, NextResponse } from "next/server";
import { requireRole, isAuthError } from "@/lib/middleware/rbac";

export async function GET(req: NextRequest, { params }: { params: Promise<{ parentId: string }> }) {
  const { parentId } = await params;
  const auth = await requireRole(req, 'parent');
  if (isAuthError(auth)) return auth;

  // Ensure parent can only see their own dashboard
  if (auth.user.id !== parentId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: students } = await auth.supabase
    .from("student_profiles")
    .select("id, display_name, level")
    .eq("user_id", parentId);

  const studentIds = (students ?? []).map((s) => s.id);
  if (!studentIds.length) return NextResponse.json({ students: [], summary: {} });

  const { count: totalSubmissions } = await auth.supabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .in("assignment_id", studentIds);

  const { data: recentEvals } = await auth.supabase
    .from("evaluations")
    .select("total_score, band, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  const avgScore = recentEvals?.length
    ? recentEvals.reduce((sum, e) => sum + e.total_score, 0) / recentEvals.length
    : 0;

  return NextResponse.json({
    students,
    summary: {
      totalSubmissions: totalSubmissions ?? 0,
      averageScore: Math.round(avgScore * 10) / 10,
      recentEvaluations: recentEvals ?? [],
    },
  });
}
