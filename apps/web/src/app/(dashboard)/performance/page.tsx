import { redirect } from 'next/navigation';
import { FileText, Award, Flame, TrendingUp } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ScoreTrend } from '@/components/charts/score-trend';
import { BandProgression } from '@/components/charts/band-progression';
import { DimensionRadar } from '@/components/charts/dimension-radar';
import { ErrorCategories } from '@/components/charts/error-categories';
import { SubmissionFrequency } from '@/components/charts/submission-frequency';
import { StreakCalendar } from '@/components/charts/streak-calendar';
import { SummaryCard } from '@/components/dashboard/summary-card';
import Link from 'next/link';

export default async function PerformancePage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Get student profile and display name from users table (source of truth for settings)
  const [profileResult, userResult] = await Promise.all([
    supabase
      .from('student_profiles')
      .select('id, display_name')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('users')
      .select('display_name')
      .eq('id', user.id)
      .single(),
  ]);

  const profile = profileResult.data;
  if (!profile) redirect('/assignments');

  const displayName = userResult.data?.display_name || profile.display_name || '';

  // Fetch all data in parallel
  const [scoreTrendResult, weaknessResult, streakResult, submissionsResult] =
    await Promise.all([
      // student_score_trend view already joins evaluations → submissions → assignments
      // and includes dimension_scores
      supabase
        .from('student_score_trend')
        .select('*')
        .eq('student_id', profile.id)
        .order('evaluated_at', { ascending: true }),
      // Query via submissions → evaluations (with !inner to skip submissions without evals)
      supabase
        .from('submissions')
        .select('evaluations!inner(dimension_scores, weaknesses), assignments!inner(student_id)')
        .eq('assignments.student_id', profile.id),
      supabase
        .from('student_streaks')
        .select('current_streak, longest_streak')
        .eq('student_id', profile.id)
        .single(),
      supabase
        .from('submissions')
        .select('created_at, assignments!inner(student_id)')
        .eq('assignments.student_id', profile.id)
        .order('created_at', { ascending: true }),
    ]);

  const scoreTrendData = scoreTrendResult.data ?? [];
  const evaluationRows = weaknessResult.data ?? [];
  const streak = streakResult.data;
  const submissions = submissionsResult.data ?? [];

  // Empty state
  if (scoreTrendData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <TrendingUp className="h-16 w-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold mb-2">No Performance Data Yet</h1>
        <p className="text-gray-500 mb-6 max-w-md">
          Complete your first assignment to start tracking your writing performance.
        </p>
        <Link
          href="/assignments"
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          View Assignments
        </Link>
      </div>
    );
  }

  // Transform data for charts
  const scoreTrendChart = scoreTrendData.map((row) => ({
    date: row.evaluated_at,
    score: row.total_score,
    band: row.band,
  }));

  const bandProgressionChart = scoreTrendData.map((row) => ({
    date: row.evaluated_at,
    band: row.band,
  }));

  // evaluationRows: each row has evaluations (array with one eval) containing dimension_scores & weaknesses
  // Flatten to a single list of evaluations
  type DimScore = { name: string; score: number; maxScore: number };
  type Weakness = { text: string; quote: string; suggestion?: string };
  type EvalData = { dimension_scores: DimScore[]; weaknesses: Weakness[] };

  const allEvals: EvalData[] = [];
  for (const row of evaluationRows) {
    const evals = row.evaluations as EvalData | EvalData[];
    if (Array.isArray(evals)) {
      allEvals.push(...evals);
    } else if (evals) {
      allEvals.push(evals);
    }
  }

  // Aggregate dimension_scores across all evaluations for radar chart
  const dimensionMap: Record<string, { total: number; maxScore: number; count: number }> = {};
  for (const ev of allEvals) {
    if (!Array.isArray(ev.dimension_scores)) continue;
    for (const dim of ev.dimension_scores) {
      const entry = (dimensionMap[dim.name] ??= { total: 0, maxScore: 0, count: 0 });
      entry.total += dim.score;
      entry.maxScore = dim.maxScore;
      entry.count++;
    }
  }
  const dimensionRadarChart = Object.entries(dimensionMap).map(([name, d]) => ({
    dimension: name,
    score: Math.round((d.total / d.count) * 10) / 10,
    maxScore: d.maxScore,
  }));

  // Extract weakness text and count occurrences for error categories chart
  const weaknessMap: Record<string, number> = {};
  for (const ev of allEvals) {
    if (!Array.isArray(ev.weaknesses)) continue;
    for (const w of ev.weaknesses) {
      const category = w.text.length > 60 ? w.text.slice(0, 57) + '...' : w.text;
      weaknessMap[category] = (weaknessMap[category] ?? 0) + 1;
    }
  }
  const errorCategoriesChart = Object.entries(weaknessMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Group submissions by ISO week for frequency chart
  const weekCounts: Record<string, number> = {};
  for (const row of scoreTrendChart) {
    const d = new Date(row.date);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(
      ((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7,
    );
    const weekKey = `W${weekNum}`;
    weekCounts[weekKey] = (weekCounts[weekKey] ?? 0) + 1;
  }
  const submissionFrequencyChart = Object.entries(weekCounts).map(([week, count]) => ({
    week,
    count,
  }));

  const submissionDates = submissions.map((s) => s.created_at);

  // Summary stats
  const totalSubmissions = scoreTrendData.length;
  const avgScore =
    Math.round(
      (scoreTrendData.reduce((sum, r) => sum + (r.total_score ?? 0), 0) / totalSubmissions) * 10,
    ) / 10;
  const latestBand = scoreTrendData[scoreTrendData.length - 1]?.band ?? '-';
  const currentStreak = streak?.current_streak ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold md:text-3xl">My Performance</h1>
      <p className="text-gray-500 mt-1">{displayName}</p>

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard icon={FileText} label="Total Submissions" value={totalSubmissions} />
        <SummaryCard icon={TrendingUp} label="Avg Score" value={`${avgScore}/30`} />
        <SummaryCard icon={Award} label="Current Band" value={`Band ${latestBand}`} />
        <SummaryCard icon={Flame} label="Day Streak" value={`${currentStreak} days`} />
      </div>

      {/* Charts grid 2x2 */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <ScoreTrend data={scoreTrendChart} />
        </div>
        <div className="rounded-lg border bg-white p-6">
          <BandProgression data={bandProgressionChart} />
        </div>
        <div className="rounded-lg border bg-white p-6">
          <DimensionRadar data={dimensionRadarChart} />
        </div>
        <div className="rounded-lg border bg-white p-6">
          <ErrorCategories data={errorCategoriesChart} />
        </div>
      </div>

      {/* Activity row */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <SubmissionFrequency data={submissionFrequencyChart} />
        </div>
        <div className="rounded-lg border bg-white p-6">
          <StreakCalendar submissionDates={submissionDates} />
        </div>
      </div>
    </div>
  );
}
