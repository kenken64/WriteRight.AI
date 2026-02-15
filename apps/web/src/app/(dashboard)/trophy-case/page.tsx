import { createServerSupabaseClient } from '@/lib/supabase/server';
import { TrophyCard } from '@/components/rewards/trophy-card';

export default async function TrophyCasePage() {
  const supabase = await createServerSupabaseClient();
  const { data: trophies } = await supabase
    .from('redemptions')
    .select('*, wishlist_item:wishlist_items(*), achievement:achievements(*)')
    .eq('status', 'completed')
    .eq('kid_confirmed', true)
    .order('fulfilled_at', { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold md:text-3xl">🏆 Trophy Case</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        All your earned and received rewards!
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {trophies && trophies.length > 0 ? (
          trophies.map((trophy: any) => (
            <TrophyCard
              key={trophy.id}
              trophy={{
                id: trophy.id,
                reward_title: trophy.wishlist_item?.title ?? 'Reward',
                reward_type: trophy.wishlist_item?.reward_type ?? 'custom',
                achievement_name: trophy.achievement?.name ?? '',
                achievement_emoji: trophy.achievement?.badge_emoji ?? '🎁',
                fulfilled_at: trophy.fulfilled_at,
                parent_photo_url: trophy.fulfilment_photo_url,
              }}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border bg-white py-20 px-6 text-center animate-fade-in">
            <span className="text-6xl">🏅</span>
            <h3 className="mt-6 text-xl font-bold text-gray-900">Your trophy case is empty</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Keep earning achievements and claiming rewards — they&apos;ll all be displayed here!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
