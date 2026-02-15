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

  // Get student profile
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('id, display_name')
    .eq('user_id', user.id)
    .single();

  if (!profile) redirect('/assignments');

  // Fetch all data in parallel
  const [scoreTrendResult, errorCategoriesResult, streakResult, submissionsResult] =
    await Promise.all([
      supabase
        .from('student_score_trend')
        .select('*')
        .eq('student_id', profile.id)
        .order('evaluated_at', { ascending: true }),
      supabase
        .from('student_error_categories')
        .select('*')
        .eq('student_id', profile.id),
      supabase
        .from('student_streaks')
        .select('current_streak, longest_streak')
        .eq('student_id', profile.id)
        .single(),
      supabase
        .from('submissions')
        .select('created_at')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: true }),
    ]);

  const scoreTrendData = scoreTrendResult.data ?? [];
  const errorCategoriesData = errorCategoriesResult.data ?? [];
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

  const dimensionRadarChart = errorCategoriesData.map((row) => ({
    dimension: row.dimension_name,
    score: row.avg_score,
    maxScore: row.max_score,
  }));

  const errorCategoriesChart = errorCategoriesData.map((row) => ({
    category: row.dimension_name,
    count: row.total_evaluations ?? Math.round(row.avg_score),
  }));

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
      <p className="text-gray-500 mt-1">{profile.display_name}</p>

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
