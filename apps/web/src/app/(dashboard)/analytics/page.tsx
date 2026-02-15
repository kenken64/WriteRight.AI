import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ScoreTrend } from '@/components/charts/score-trend';
import { ErrorCategories } from '@/components/charts/error-categories';
import { BandProgression } from '@/components/charts/band-progression';
import { SubmissionFrequency } from '@/components/charts/submission-frequency';

export default async function AnalyticsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: scoreTrend } = await supabase
    .from('student_score_trend')
    .select('*')
    .order('evaluated_at', { ascending: true });

  const { data: errorCategories } = await supabase
    .from('student_error_categories')
    .select('*');

  return (
    <div>
      <h1 className="text-2xl font-bold md:text-3xl">📊 Analytics</h1>

      {(!scoreTrend || scoreTrend.length === 0) && (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border bg-white py-20 px-6 text-center animate-fade-in">
          <span className="text-6xl">📊</span>
          <h3 className="mt-6 text-xl font-bold text-gray-900">Submit your first essay to see analytics</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Your score trends, error patterns, and progress charts will appear here after your first submission.
          </p>
        </div>
      )}

      <div className={`mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 ${(!scoreTrend || scoreTrend.length === 0) ? 'hidden' : ''}`}>
        <div className="rounded-lg border bg-white p-6">
          <h2 className="font-medium">Score Trend</h2>
          <div className="mt-4">
            <ScoreTrend data={scoreTrend ?? []} />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="font-medium">Band Progression</h2>
          <div className="mt-4">
            <BandProgression data={scoreTrend ?? []} />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="font-medium">Error Categories</h2>
          <div className="mt-4">
            <ErrorCategories data={errorCategories ?? []} />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="font-medium">Submission Frequency</h2>
          <div className="mt-4">
            <SubmissionFrequency data={scoreTrend ?? []} />
          </div>
        </div>
      </div>
    </div>
  );
}
