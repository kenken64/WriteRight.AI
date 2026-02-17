import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PromiseTracker } from '@/components/rewards/promise-tracker';
import { PendingWishApprovals } from '@/components/rewards/pending-wish-approvals';
import type { PendingItem, AchievementOption } from '@/components/rewards/pending-wish-approvals';
import Link from 'next/link';
import { parsePaginationParams, toSupabaseRange, computeTotalPages } from '@/lib/utils/pagination';
import { Pagination } from '@/components/ui/pagination';

export default async function RewardsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { page, pageSize } = parsePaginationParams(params);
  const { from, to } = toSupabaseRange({ page, pageSize });

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: redemptions, count } = await supabase
    .from('redemptions')
    .select('*, wishlist_item:wishlist_items(*), achievement:achievements(*)', { count: 'exact' })
    .eq('parent_id', user?.id ?? '')
    .order('created_at', { ascending: false })
    .range(from, to);

  const totalPages = computeTotalPages(count ?? 0, pageSize);

  const { data: promiseStats } = await supabase
    .from('parent_promise_stats')
    .select('*')
    .eq('parent_id', user?.id ?? '')
    .single();

  // Fetch pending wishlist items for linked children
  const { data: links } = await supabase
    .from('parent_student_links')
    .select('student_id')
    .eq('parent_id', user?.id ?? '');

  const linkedStudentIds = (links ?? []).map((l: any) => l.student_id);

  let pendingItems: PendingItem[] = [];
  let achievementOptions: AchievementOption[] = [];

  if (linkedStudentIds.length > 0) {
    const { data: wishlistRows } = await supabase
      .from('wishlist_items')
      .select('id, title, description, reward_type, student_id, created_at')
      .eq('status', 'pending_parent')
      .in('student_id', linkedStudentIds)
      .order('created_at', { ascending: false });

    // Build student name map
    const { data: studentProfiles } = await supabase
      .from('student_profiles')
      .select('id, display_name')
      .in('id', linkedStudentIds);

    const nameMap: Record<string, string> = {};
    for (const p of studentProfiles ?? []) {
      nameMap[p.id] = p.display_name ?? 'Your child';
    }

    pendingItems = (wishlistRows ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      reward_type: row.reward_type,
      student_name: nameMap[row.student_id] ?? 'Your child',
      created_at: row.created_at,
    }));

    // Find achievements already linked to active wishlist items (locked/claimable/claimed/fulfilled)
    const { data: usedItems } = await supabase
      .from('wishlist_items')
      .select('required_achievement_id')
      .in('student_id', linkedStudentIds)
      .in('status', ['locked', 'claimable', 'claimed', 'fulfilled'])
      .not('required_achievement_id', 'is', null);

    const usedAchievementIds = new Set(
      (usedItems ?? []).map((i: any) => i.required_achievement_id),
    );

    // Fetch achievements for dropdown, excluding already-used ones
    const { data: achievements } = await supabase
      .from('achievements')
      .select('id, name, description, badge_emoji')
      .order('sort_order', { ascending: true });

    achievementOptions = (achievements ?? [])
      .filter((a: any) => !usedAchievementIds.has(a.id))
      .map((a: any) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        badge_emoji: a.badge_emoji,
      }));
  }

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

      <PendingWishApprovals items={pendingItems} achievements={achievementOptions} />

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

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath="/rewards"
      />
    </div>
  );
}
