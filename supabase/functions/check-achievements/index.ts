import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface RequestBody {
  studentId: string;
  submissionId?: string;
  evaluationId?: string;
}

interface AchievementRule {
  code: string;
  check: (ctx: AchievementContext) => boolean;
  progress: (ctx: AchievementContext) => { current: number; target: number };
}

interface AchievementContext {
  totalSubmissions: number;
  totalEvaluations: number;
  currentStreak: number;
  longestStreak: number;
  highestBand: number;
  averageBand: number;
  bandHistory: number[];
  improvementCount: number;
  essayTypesAttempted: Set<string>;
  categoriesAttempted: Set<string>;
  submissionHour?: number;
  daysSinceLastSubmission: number | null;
}

// Codes must match the achievements.code column in the database exactly
const RULES: AchievementRule[] = [
  // Practice: submission counts
  { code: 'first_steps', check: (c) => c.totalSubmissions >= 1, progress: (c) => ({ current: Math.min(c.totalSubmissions, 1), target: 1 }) },
  { code: 'getting_started', check: (c) => c.totalSubmissions >= 5, progress: (c) => ({ current: Math.min(c.totalSubmissions, 5), target: 5 }) },
  { code: 'dedicated_writer', check: (c) => c.totalSubmissions >= 20, progress: (c) => ({ current: Math.min(c.totalSubmissions, 20), target: 20 }) },
  { code: 'writing_machine', check: (c) => c.totalSubmissions >= 50, progress: (c) => ({ current: Math.min(c.totalSubmissions, 50), target: 50 }) },
  { code: 'century_club', check: (c) => c.totalSubmissions >= 100, progress: (c) => ({ current: Math.min(c.totalSubmissions, 100), target: 100 }) },

  // Improvement
  { code: 'levelling_up', check: (c) => c.improvementCount >= 1, progress: (c) => ({ current: Math.min(c.improvementCount, 1), target: 1 }) },
  { code: 'band_breaker', check: (c) => c.improvementCount >= 1, progress: (c) => ({ current: Math.min(c.improvementCount, 1), target: 1 }) },

  // Mastery: band thresholds
  { code: 'band_3_unlocked', check: (c) => c.highestBand >= 3, progress: (c) => ({ current: Math.min(c.highestBand, 3), target: 3 }) },
  { code: 'band_4_unlocked', check: (c) => c.highestBand >= 4, progress: (c) => ({ current: Math.min(c.highestBand, 4), target: 4 }) },
  { code: 'band_5_unlocked', check: (c) => c.highestBand >= 5, progress: (c) => ({ current: Math.min(c.highestBand, 5), target: 5 }) },

  // Streaks
  { code: 'streak_3', check: (c) => c.longestStreak >= 3, progress: (c) => ({ current: Math.min(c.currentStreak, 3), target: 3 }) },
  { code: 'streak_7', check: (c) => c.longestStreak >= 7, progress: (c) => ({ current: Math.min(c.currentStreak, 7), target: 7 }) },
  { code: 'streak_30', check: (c) => c.longestStreak >= 30, progress: (c) => ({ current: Math.min(c.currentStreak, 30), target: 30 }) },
  { code: 'comeback_kid', check: (c) => (c.daysSinceLastSubmission ?? 0) >= 14, progress: () => ({ current: 0, target: 1 }) },

  // Special
  { code: 'topic_explorer', check: (c) => c.categoriesAttempted.size >= 5, progress: (c) => ({ current: Math.min(c.categoriesAttempted.size, 5), target: 5 }) },
  { code: 'all_rounder', check: (c) => c.essayTypesAttempted.size >= 2, progress: (c) => ({ current: Math.min(c.essayTypesAttempted.size, 2), target: 2 }) },
];

serve(async (req: Request) => {
  try {
    const { studentId } = (await req.json()) as RequestBody;
    if (!studentId) return new Response(JSON.stringify({ error: 'studentId required' }), { status: 400 });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Gather student data
    const [submissionsRes, evaluationsRes, streakRes, existingRes] = await Promise.all([
      supabase
        .from('submissions')
        .select('id, created_at, assignment:assignments!inner(essay_type, student_id, topic:topics(category))')
        .eq('assignments.student_id', studentId)
        .eq('status', 'evaluated')
        .order('created_at', { ascending: true }),
      supabase
        .from('evaluations')
        .select('band, total_score, submission_id, created_at')
        .order('created_at', { ascending: true }),
      supabase.from('student_streaks').select('*').eq('student_id', studentId).single(),
      supabase.from('student_achievements').select('achievement_id, achievements(code)').eq('student_id', studentId),
    ]);

    const submissions = submissionsRes.data ?? [];
    const submissionIds = new Set(submissions.map((s: any) => s.id));
    // Filter evaluations to only those belonging to this student's submissions
    const evaluations = (evaluationsRes.data ?? []).filter((e: any) => submissionIds.has(e.submission_id));
    const streak = streakRes.data;
    const existingCodes = new Set((existingRes.data ?? []).map((sa: any) => sa.achievements?.code).filter(Boolean));

    const bands = evaluations.map((e: any) => e.band as number);
    const essayTypes = new Set(submissions.map((s: any) => (s.assignment as any)?.essay_type).filter(Boolean));
    const categories = new Set(
      submissions.map((s: any) => (s.assignment as any)?.topic?.category).filter(Boolean),
    );

    // Count band improvements (consecutive evaluations where band increased)
    let improvementCount = 0;
    for (let i = 1; i < bands.length; i++) {
      if (bands[i] > bands[i - 1]) improvementCount++;
    }

    // Calculate gap since previous submission (for comeback_kid)
    let daysSinceLastSubmission: number | null = null;
    if (submissions.length >= 2) {
      const sorted = submissions
        .map((s: any) => new Date(s.created_at).getTime())
        .sort((a: number, b: number) => a - b);
      // Check the gap before the most recent submission
      const lastGap = sorted[sorted.length - 1] - sorted[sorted.length - 2];
      daysSinceLastSubmission = Math.floor(lastGap / (1000 * 60 * 60 * 24));
    }

    const lastSubmission = submissions.length > 0 ? new Date(submissions[submissions.length - 1].created_at) : null;

    const ctx: AchievementContext = {
      totalSubmissions: submissions.length,
      totalEvaluations: evaluations.length,
      currentStreak: streak?.current_streak ?? 0,
      longestStreak: streak?.longest_streak ?? 0,
      highestBand: bands.length > 0 ? Math.max(...bands) : 0,
      averageBand: bands.length > 0 ? bands.reduce((a: number, b: number) => a + b, 0) / bands.length : 0,
      bandHistory: bands,
      improvementCount,
      essayTypesAttempted: essayTypes,
      categoriesAttempted: categories,
      submissionHour: lastSubmission?.getHours(),
      daysSinceLastSubmission,
    };

    // Check rules and unlock new achievements
    const allAchievements = await supabase.from('achievements').select('*');
    const achievementsByCode = new Map((allAchievements.data ?? []).map((a: any) => [a.code, a]));

    const newlyUnlocked: string[] = [];
    const progressUpdates: Array<{ achievement_id: string; current: number; target: number }> = [];

    for (const rule of RULES) {
      const achievement = achievementsByCode.get(rule.code);
      if (!achievement) continue;

      const prog = rule.progress(ctx);
      progressUpdates.push({ achievement_id: achievement.id, current: prog.current, target: prog.target });

      if (!existingCodes.has(rule.code) && rule.check(ctx)) {
        newlyUnlocked.push(rule.code);
        await supabase.from('student_achievements').insert({
          student_id: studentId,
          achievement_id: achievement.id,
          unlocked_at: new Date().toISOString(),
        });
      }
    }

    // Update progress records
    for (const pu of progressUpdates) {
      await supabase.from('achievement_progress').upsert({
        student_id: studentId,
        achievement_id: pu.achievement_id,
        current_value: pu.current,
        target_value: pu.target,
      }, { onConflict: 'student_id,achievement_id' });
    }

    // Update streak (use Singapore timezone so dates match student's local day)
    const sgNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' }));
    const today = sgNow.getFullYear() + '-' +
      String(sgNow.getMonth() + 1).padStart(2, '0') + '-' +
      String(sgNow.getDate()).padStart(2, '0');
    const lastDate = streak?.last_submission_date;
    let newStreak = streak?.current_streak ?? 0;
    let longest = streak?.longest_streak ?? 0;

    if (lastDate !== today) {
      const sgYesterday = new Date(sgNow);
      sgYesterday.setDate(sgYesterday.getDate() - 1);
      const yesterday = sgYesterday.getFullYear() + '-' +
        String(sgYesterday.getMonth() + 1).padStart(2, '0') + '-' +
        String(sgYesterday.getDate()).padStart(2, '0');
      newStreak = lastDate === yesterday ? newStreak + 1 : 1;
      longest = Math.max(longest, newStreak);

      await supabase.from('student_streaks').upsert({
        student_id: studentId,
        current_streak: newStreak,
        longest_streak: longest,
        last_submission_date: today,
      }, { onConflict: 'student_id' });
    }

    // Check wishlist claimability for newly unlocked achievements
    if (newlyUnlocked.length > 0) {
      const unlockedIds = newlyUnlocked.map((code) => achievementsByCode.get(code)?.id).filter(Boolean);
      if (unlockedIds.length > 0) {
        await supabase.from('wishlist_items')
          .update({ status: 'claimable' })
          .in('required_achievement_id', unlockedIds)
          .eq('student_id', studentId)
          .eq('status', 'locked');
      }

      // Log for notifications
      await supabase.from('audit_logs').insert(
        newlyUnlocked.map((code) => ({
          user_id: studentId,
          action: 'achievement_unlocked',
          details: { code, name: achievementsByCode.get(code)?.name },
        })),
      );
    }

    return new Response(JSON.stringify({
      success: true,
      newlyUnlocked,
      currentStreak: newStreak,
      longestStreak: longest,
    }), { status: 200 });

  } catch (err) {
    console.error('check-achievements error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
