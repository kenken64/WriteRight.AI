import { createServerSupabaseClient } from '@/lib/supabase/server';
import { BadgeWall } from '@/components/achievements/badge-wall';
import { StreakCounter } from '@/components/achievements/streak-counter';

export default async function AchievementsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: achievements } = await supabase
    .from('achievements')
    .select('*, student_achievements(unlocked_at), achievement_progress(current_value, target_value)')
    .order('sort_order');

  const { data: streak } = await supabase.from('student_streaks').select('*').single();

  return (
    <div>
      <h1 className="text-2xl font-bold md:text-3xl">🏆 Achievements</h1>

      {streak && (
        <div className="mt-6">
          <StreakCounter
            currentStreak={streak.current_streak}
            longestStreak={streak.longest_streak}
            lastSubmissionDate={streak.last_submission_date}
          />
        </div>
      )}

      <div className="mt-8">
        {achievements && achievements.length > 0 ? (
          <BadgeWall achievements={achievements} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border bg-white py-20 px-6 text-center animate-fade-in">
            <span className="text-6xl">🏆</span>
            <h3 className="mt-6 text-xl font-bold text-gray-900">Your badges will appear here</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Keep writing and submitting essays to unlock achievements and earn badges!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
