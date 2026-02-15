import { NextRequest, NextResponse } from "next/server";
import { requireParentOf, isAuthError } from "@/lib/middleware/rbac";

export async function GET(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const auth = await requireParentOf(req, studentId);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "90");
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data: evals } = await auth.supabase
    .from("evaluations")
    .select("total_score, band, dimension_scores, essay_type, created_at, submission:submissions!inner(assignment:assignments!inner(student_id))")
    .gte("created_at", since)
    .order("created_at");

  const studentEvals = (evals ?? []).filter(
    (e: any) => e.submission?.assignment?.student_id === studentId
  );

  const scoreTrend = studentEvals.map((e) => ({
    date: e.created_at,
    score: e.total_score,
    band: e.band,
  }));

  const dimTotals: Record<string, { sum: number; count: number }> = {};
  studentEvals.forEach((e) => {
    (e.dimension_scores as any[])?.forEach((d) => {
      if (!dimTotals[d.name]) dimTotals[d.name] = { sum: 0, count: 0 };
      dimTotals[d.name].sum += d.score;
      dimTotals[d.name].count += 1;
    });
  });

  const dimensionAverages = Object.entries(dimTotals).map(([name, { sum, count }]) => ({
    name,
    average: Math.round((sum / count) * 10) / 10,
  }));

  const { data: streak } = await auth.supabase
    .from("student_streaks")
    .select("*")
    .eq("student_id", studentId)
    .single();

  return NextResponse.json({
    scoreTrend,
    dimensionAverages,
    totalEvaluations: studentEvals.length,
    streak: streak ?? { current_streak: 0, longest_streak: 0 },
  });
}
