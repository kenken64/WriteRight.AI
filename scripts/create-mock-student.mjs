/**
 * Creates a mock student with enough data to trigger ALL achievement rules.
 * Prints the login credentials so you can log in and verify visually.
 *
 * Usage:  node scripts/create-mock-student.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envText = readFileSync(resolve(__dirname, '..', 'apps', 'web', '.env.local'), 'utf-8');
const env = (k) => { const m = envText.match(new RegExp(`^${k}="?([^"\\n]+)"?`, 'm')); return m?.[1]; };

const SUPABASE_URL = env('NEXT_PUBLIC_SUPABASE_URL');
const KEY = env('SUPABASE_SERVICE_ROLE_KEY');
const REST = `${SUPABASE_URL}/rest/v1`;
const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const uid = () => crypto.randomUUID();

async function rpc(table, body, { method = 'POST', prefer, query = '' } = {}) {
  const headers = { ...HEADERS };
  if (prefer) headers['Prefer'] = prefer;
  const res = await fetch(`${REST}/${table}${query}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${table} ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}
const insert = (table, rows) => rpc(table, rows, { prefer: 'return=representation' });

function daysAgo(n) { return new Date(Date.now() - n * 86400000).toISOString(); }

// ── Achievement rules (for running the check after data creation) ───
const RULES = [
  { code: 'first_steps', check: (c) => c.totalSubmissions >= 1, progress: (c) => ({ current: Math.min(c.totalSubmissions, 1), target: 1 }) },
  { code: 'getting_started', check: (c) => c.totalSubmissions >= 5, progress: (c) => ({ current: Math.min(c.totalSubmissions, 5), target: 5 }) },
  { code: 'dedicated_writer', check: (c) => c.totalSubmissions >= 20, progress: (c) => ({ current: Math.min(c.totalSubmissions, 20), target: 20 }) },
  { code: 'writing_machine', check: (c) => c.totalSubmissions >= 50, progress: (c) => ({ current: Math.min(c.totalSubmissions, 50), target: 50 }) },
  { code: 'century_club', check: (c) => c.totalSubmissions >= 100, progress: (c) => ({ current: Math.min(c.totalSubmissions, 100), target: 100 }) },
  { code: 'levelling_up', check: (c) => c.improvementCount >= 1, progress: (c) => ({ current: Math.min(c.improvementCount, 1), target: 1 }) },
  { code: 'band_breaker', check: (c) => c.improvementCount >= 1, progress: (c) => ({ current: Math.min(c.improvementCount, 1), target: 1 }) },
  { code: 'band_3_unlocked', check: (c) => c.highestBand >= 3, progress: (c) => ({ current: Math.min(c.highestBand, 3), target: 3 }) },
  { code: 'band_4_unlocked', check: (c) => c.highestBand >= 4, progress: (c) => ({ current: Math.min(c.highestBand, 4), target: 4 }) },
  { code: 'band_5_unlocked', check: (c) => c.highestBand >= 5, progress: (c) => ({ current: Math.min(c.highestBand, 5), target: 5 }) },
  { code: 'streak_3', check: (c) => c.longestStreak >= 3, progress: (c) => ({ current: Math.min(c.currentStreak, 3), target: 3 }) },
  { code: 'streak_7', check: (c) => c.longestStreak >= 7, progress: (c) => ({ current: Math.min(c.currentStreak, 7), target: 7 }) },
  { code: 'streak_30', check: (c) => c.longestStreak >= 30, progress: (c) => ({ current: Math.min(c.currentStreak, 30), target: 30 }) },
  { code: 'comeback_kid', check: (c) => (c.daysSinceLastSubmission ?? 0) >= 14, progress: () => ({ current: 0, target: 1 }) },
  { code: 'topic_explorer', check: (c) => c.categoriesAttempted.size >= 5, progress: (c) => ({ current: Math.min(c.categoriesAttempted.size, 5), target: 5 }) },
  { code: 'all_rounder', check: (c) => c.essayTypesAttempted.size >= 2, progress: (c) => ({ current: Math.min(c.essayTypesAttempted.size, 2), target: 2 }) },
];

async function main() {
  const MOCK_EMAIL = 'achievement-tester@writeright.test';
  const MOCK_PASSWORD = 'WriteRight2026!';
  const MOCK_USER_ID = uid();
  const MOCK_STUDENT_ID = uid();

  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  Creating Mock Student — All Achievements       ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // ── 0. Clean up any previous mock data ──────────────────────
  console.log('0. Cleaning up previous mock data (if any)...');
  // Find the existing public.users record by email to get the user id
  const oldUsers = await rpc('users', null, { method: 'GET', query: `?email=eq.${encodeURIComponent(MOCK_EMAIL)}&select=id` }).catch(() => []);
  const oldUserId = oldUsers?.[0]?.id;
  if (oldUserId) {
    // Delete topics created by old user first (FK constraint blocks user deletion)
    await rpc('topics', null, { method: 'DELETE', query: `?created_by=eq.${oldUserId}` }).catch(() => {});
    // Now delete the public.users record (cascades to student_profiles, etc.)
    await rpc('users', null, { method: 'DELETE', query: `?id=eq.${oldUserId}` }).catch((e) => console.log(`   (users cleanup: ${e.message})`));
    console.log(`   Deleted old public.users record ${oldUserId}`);
  }
  // Delete auth user if exists
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=500`, { headers: HEADERS });
  const listData = await listRes.json();
  const existing = listData.users?.find((u) => u.email === MOCK_EMAIL);
  if (existing) {
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${existing.id}`, { method: 'DELETE', headers: HEADERS });
    console.log(`   Deleted old auth user ${existing.id}`);
  }
  console.log('   Cleanup done');

  // ── 1. Create auth user ───────────────────────────────────────
  console.log('1. Creating auth user...');
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      id: MOCK_USER_ID,
      email: MOCK_EMAIL,
      password: MOCK_PASSWORD,
      email_confirm: true,
      user_metadata: { role: 'student', display_name: 'Achievement Tester' },
    }),
  });
  if (!authRes.ok) {
    throw new Error(`Auth create failed: ${authRes.status} ${await authRes.text()}`);
  }
  console.log(`   Auth user ID: ${MOCK_USER_ID}`);

  // ── 2. Create public.users record ────────────────────────────
  console.log('2. Creating public.users record...');
  await insert('users', {
    id: MOCK_USER_ID,
    role: 'student',
    email: MOCK_EMAIL,
    display_name: 'Achievement Tester',
    status: 'active',
    onboarded: true,
  });
  console.log('   Done');

  // ── 3. Create student_profiles ────────────────────────────────
  console.log('3. Creating student profile...');
  await insert('student_profiles', {
    id: MOCK_STUDENT_ID,
    user_id: MOCK_USER_ID,
    display_name: 'Achievement Tester',
    level: 'sec4',
  });
  console.log(`   Student ID: ${MOCK_STUDENT_ID}`);

  // ── 3b. Create invite code ─────────────────────────────────────
  const INVITE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let inviteCode = '';
  for (let i = 0; i < 6; i++) inviteCode += INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)];
  await insert('invite_codes', { code: inviteCode, student_id: MOCK_STUDENT_ID, is_active: true });
  console.log(`   Invite code: ${inviteCode}`);

  // ── 4. Create topics across 5 categories ──────────────────────
  const categories = ['environment', 'technology', 'social_issues', 'education', 'health'];
  console.log(`4. Creating topics (${categories.length} categories + 1 continuous)...`);
  const topicIds = [];
  for (const cat of categories) {
    const id = uid();
    topicIds.push(id);
    await insert('topics', { id, source: 'manual', essay_type: 'situational', category: cat, created_by: MOCK_USER_ID });
  }
  const contTopicId = uid();
  topicIds.push(contTopicId);
  await insert('topics', { id: contTopicId, source: 'manual', essay_type: 'continuous', category: 'education', created_by: MOCK_USER_ID });
  console.log(`   Created ${topicIds.length} topics`);

  // ── 5. Create assignments ─────────────────────────────────────
  console.log('5. Creating assignments...');
  const assignmentIds = [];
  for (let i = 0; i < 5; i++) {
    const id = uid();
    assignmentIds.push(id);
    await insert('assignments', {
      id, student_id: MOCK_STUDENT_ID, topic_id: topicIds[i],
      essay_type: 'situational',
      prompt: `Write a formal letter to your school principal about ${categories[i]} concerns. Include specific details and suggestions for improvement.`,
      word_count_min: 150, word_count_max: 300, status: 'completed',
    });
  }
  const contAssignId = uid();
  assignmentIds.push(contAssignId);
  await insert('assignments', {
    id: contAssignId, student_id: MOCK_STUDENT_ID, topic_id: contTopicId,
    essay_type: 'continuous',
    prompt: 'Write about a time when you learned an important life lesson from an unexpected experience.',
    word_count_min: 200, word_count_max: 500, status: 'completed',
  });
  console.log(`   Created ${assignmentIds.length} assignments`);

  // ── 6. Create 102 evaluated submissions ───────────────────────
  //   First 50: days 60..11 ago (spread out)
  //   Gap of ~15 days (triggers comeback_kid)
  //   Last 52: days 5..0 ago (clustered)
  console.log('6. Creating 102 evaluated submissions...');
  const submissionIds = [];
  const submissions = [];
  for (let i = 0; i < 102; i++) {
    const id = uid();
    submissionIds.push(id);
    const assignIdx = i % assignmentIds.length;
    let createdAt;
    if (i < 50) {
      createdAt = daysAgo(60 - i);  // days 60..11
    } else {
      createdAt = daysAgo(Math.max(0, 5 - (i - 50))); // days 5..0
    }
    submissions.push({
      id, assignment_id: assignmentIds[assignIdx], status: 'evaluated',
      image_refs: ['mock/test.jpg'], ocr_text: 'This is a mock essay written for achievement testing purposes. The student demonstrates strong vocabulary and clear structure.',
      created_at: createdAt,
    });
  }
  for (let i = 0; i < submissions.length; i += 50) {
    await insert('submissions', submissions.slice(i, i + 50));
  }
  console.log(`   Created ${submissionIds.length} submissions`);

  // ── 7. Create evaluations with band progression ───────────────
  //   Bands climb: 1,1,2,2,3,3,4,4,5,5,5,5,...
  console.log('7. Creating evaluations with band progression...');
  const evals = [];
  for (let i = 0; i < submissionIds.length; i++) {
    const id = uid();
    let band;
    if (i < 10) band = Math.min(5, Math.floor(i / 2) + 1);
    else band = 5;
    const essayType = i % assignmentIds.length === assignmentIds.length - 1 ? 'continuous' : 'situational';
    evals.push({
      id, submission_id: submissionIds[i], essay_type: essayType,
      rubric_version: '1184-sw-v1', model_id: 'gpt-4o', prompt_version: 'v1',
      dimension_scores: essayType === 'continuous'
        ? [
            { name: 'Content & Development', score: band * 2, maxScore: 10, band, justification: 'Mock data' },
            { name: 'Language & Expression', score: band * 2, maxScore: 10, band, justification: 'Mock data' },
            { name: 'Organisation & Structure', score: band * 2, maxScore: 10, band, justification: 'Mock data' },
          ]
        : [
            { name: 'Task Fulfilment', score: band * 2, maxScore: 10, band, justification: 'Mock data' },
            { name: 'Language & Style', score: band * 2, maxScore: 10, band, justification: 'Mock data' },
            { name: 'Organisation & Coherence', score: band * 2, maxScore: 10, band, justification: 'Mock data' },
          ],
      total_score: band * 6, band,
      strengths: ['Clear structure', 'Good vocabulary range'],
      weaknesses: [{ dimension: 'Language', text: 'Minor grammatical errors in complex sentences' }],
      next_steps: ['Practice using varied sentence structures'],
      confidence: 0.85, review_recommended: false,
      created_at: submissions[i].created_at,
    });
  }
  for (let i = 0; i < evals.length; i += 50) {
    await insert('evaluations', evals.slice(i, i + 50));
  }
  console.log(`   Created ${evals.length} evaluations`);

  // ── 8. Create streak record ───────────────────────────────────
  console.log('8. Creating streak record (35-day streak)...');
  await insert('student_streaks', {
    student_id: MOCK_STUDENT_ID, current_streak: 35, longest_streak: 35,
    last_submission_date: new Date().toISOString().slice(0, 10),
  });

  // ── 9. Award ALL achievements ─────────────────────────────────
  console.log('9. Running achievement rules and awarding...\n');
  const achievements = await rpc('achievements', null, { method: 'GET', query: '?select=id,code,name&order=sort_order.asc' });
  const byCode = new Map(achievements.map((a) => [a.code, a]));

  const ctx = {
    totalSubmissions: 102,
    totalEvaluations: 102,
    currentStreak: 35,
    longestStreak: 35,
    highestBand: 5,
    improvementCount: 4, // bands: 1→1→2→2→3→3→4→4→5  = 4 improvements
    essayTypesAttempted: new Set(['situational', 'continuous']),
    categoriesAttempted: new Set(categories),
    daysSinceLastSubmission: 15, // gap between day 11 and day 5
  };

  let unlocked = 0;
  for (const rule of RULES) {
    const ach = byCode.get(rule.code);
    if (!ach) continue;
    const prog = rule.progress(ctx);

    // Upsert progress
    await rpc('achievement_progress', {
      student_id: MOCK_STUDENT_ID, achievement_id: ach.id,
      current_value: prog.current, target_value: prog.target,
    }, { prefer: 'resolution=merge-duplicates' });

    // Unlock
    if (rule.check(ctx)) {
      await rpc('student_achievements', {
        student_id: MOCK_STUDENT_ID, achievement_id: ach.id,
        unlocked_at: new Date().toISOString(),
      }, { prefer: 'resolution=merge-duplicates' });
      console.log(`   ✅ ${ach.name.padEnd(20)} UNLOCKED`);
      unlocked++;
    } else {
      console.log(`   ⬜ ${ach.name.padEnd(20)} (${prog.current}/${prog.target})`);
    }
  }

  // ── 10. Print summary ─────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  MOCK STUDENT CREATED SUCCESSFULLY              ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  Achievements unlocked: ${String(unlocked).padEnd(2)} / ${RULES.length}                 ║`);
  console.log(`║  Submissions:           102                     ║`);
  console.log(`║  Evaluations:           102                     ║`);
  console.log(`║  Streak:                35 days                 ║`);
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║                                                  ║');
  console.log(`║  Email:    ${MOCK_EMAIL}    ║`);
  console.log(`║  Password: ${MOCK_PASSWORD}               ║`);
  console.log('║                                                  ║');
  console.log('╚══════════════════════════════════════════════════╝');
}

main().catch((err) => { console.error('\nFATAL:', err.message); process.exit(1); });
