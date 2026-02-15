import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PromiseScoreDonut } from '@/components/charts/promise-score-donut';
import Link from 'next/link';

export default async function PromiseScorePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: stats } = await supabase
    .from('parent_promise_stats')
    .select('*')
    .eq('parent_id', user?.id ?? '')
    .single();

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link href="/rewards" className="text-sm text-muted-foreground hover:underline">
        ← Back to Rewards
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Promise Score</h1>

      {stats && (
        <div className="mt-8">
          <PromiseScoreDonut
            fulfilled={stats.fulfilled_on_time ?? 0}
            pending={(stats.total_claims ?? 0) - (stats.fulfilled_on_time ?? 0) - (stats.overdue ?? 0)}
            overdue={stats.overdue ?? 0}
          />

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-lg border bg-white p-4 text-center">
              <p className="text-2xl font-bold text-green-500">{stats.fulfilled}</p>
              <p className="text-sm text-muted-foreground">Fulfilled</p>
            </div>
            <div className="rounded-lg border bg-white p-4 text-center">
              <p className="text-2xl font-bold text-orange-500">{stats.overdue}</p>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </div>
          </div>

          {stats.promise_score < 70 && (
            <div className="mt-6 rounded-lg border-l-4 border-orange-400 bg-orange-50 p-4 text-sm">
              💡 Tip: Smaller, frequent rewards work better than big rare ones.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
