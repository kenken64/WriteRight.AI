import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PromiseTracker } from '@/components/rewards/promise-tracker';
import Link from 'next/link';

export default async function RewardsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: redemptions } = await supabase
    .from('redemptions')
    .select('*, wishlist_item:wishlist_items(*), achievement:achievements(*)')
    .eq('parent_id', user?.id ?? '')
    .order('created_at', { ascending: false });

  const { data: promiseStats } = await supabase
    .from('parent_promise_stats')
    .select('*')
    .eq('parent_id', user?.id ?? '')
    .single();

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold md:text-3xl">🎁 Rewards</h1>
        <Link
          href="/rewards/promise-score"
          className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
        >
          Promise Score
        </Link>
      </div>

      {promiseStats && (
        <div className="mt-6 rounded-lg border bg-white p-6">
          <h2 className="font-medium">Your Promise Score</h2>
          <p className="mt-2 text-3xl font-bold text-primary">{promiseStats.promise_score}%</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {promiseStats.fulfilled_on_time} of {promiseStats.total_claims} fulfilled on time
          </p>
        </div>
      )}

      <h2 className="mt-8 text-lg font-semibold">Pending Rewards</h2>
      <div className="mt-4 space-y-4">
        {redemptions
          ?.filter((r: any) => !['completed', 'withdrawn'].includes(r.status))
          .map((r: any) => (
            <PromiseTracker key={r.id} redemption={r} viewAs="parent" />
          ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold">Reward History</h2>
      <div className="mt-4 space-y-4">
        {redemptions
          ?.filter((r: any) => ['completed', 'withdrawn'].includes(r.status))
          .map((r: any) => (
            <PromiseTracker key={r.id} redemption={r} viewAs="parent" />
          ))}
      </div>
    </div>
  );
}
