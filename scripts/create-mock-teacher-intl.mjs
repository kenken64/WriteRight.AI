/**
 * Creates a mock international teacher account with a class code and 3 linked students.
 * This is the Sharpener (international) variant of create-mock-teacher.mjs.
 *
 * Usage:  node scripts/create-mock-teacher-intl.mjs
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

const INVITE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genCode(len = 6) {
  let code = '';
  for (let i = 0; i < len; i++) code += INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)];
  return code;
}

// ── Config ───────────────────────────────────────────────────────
const TEACHER_EMAIL = 'teacher-tester@sharpener.test';
const TEACHER_PASSWORD = 'Sharpener2026!';

const STUDENTS = [
  { email: 'student-emma@sharpener.test',   name: 'Emma Richardson', level: 'sec3' },  // Year 9
  { email: 'student-james@sharpener.test',  name: 'James Okonkwo',  level: 'sec3' },  // Year 9
  { email: 'student-sarah@sharpener.test',  name: 'Sarah Martinez', level: 'sec4' },  // Year 10
];

async function main() {
  const TEACHER_USER_ID = uid();
  const CLASS_CODE = genCode();

  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  Creating Mock Teacher + 3 Students (Intl)       ║');
  console.log('║  Sharpener variant                               ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // ── 0. Clean up previous mock data ─────────────────────────────
  console.log('0. Cleaning up previous mock data (if any)...');

  async function cleanupUser(email) {
    const users = await rpc('users', null, { method: 'GET', query: `?email=eq.${encodeURIComponent(email)}&select=id` }).catch(() => []);
    const userId = users?.[0]?.id;
    if (userId) {
      const profs = await rpc('student_profiles', null, { method: 'GET', query: `?user_id=eq.${userId}&select=id` }).catch(() => []);
      const studentId = profs?.[0]?.id;
      if (studentId) {
        const assigns = await rpc('assignments', null, { method: 'GET', query: `?student_id=eq.${studentId}&select=id` }).catch(() => []);
        for (const a of assigns) {
          await rpc('submissions', null, { method: 'DELETE', query: `?assignment_id=eq.${a.id}` }).catch(() => {});
        }
        await rpc('assignments', null, { method: 'DELETE', query: `?student_id=eq.${studentId}` }).catch(() => {});
        await rpc('student_achievements', null, { method: 'DELETE', query: `?student_id=eq.${studentId}` }).catch(() => {});
        await rpc('achievement_progress', null, { method: 'DELETE', query: `?student_id=eq.${studentId}` }).catch(() => {});
        await rpc('student_streaks', null, { method: 'DELETE', query: `?student_id=eq.${studentId}` }).catch(() => {});
      }
      await rpc('topics', null, { method: 'DELETE', query: `?created_by=eq.${userId}` }).catch(() => {});
      await rpc('class_codes', null, { method: 'DELETE', query: `?teacher_id=eq.${userId}` }).catch(() => {});
      await rpc('parent_student_links', null, { method: 'DELETE', query: `?parent_id=eq.${userId}` }).catch(() => {});
      await rpc('users', null, { method: 'DELETE', query: `?id=eq.${userId}` }).catch((e) => console.log(`   (${email} cleanup: ${e.message})`));
      console.log(`   Deleted public.users ${email}`);
    }
  }

  const allEmails = [TEACHER_EMAIL, ...STUDENTS.map(s => s.email)];
  for (const email of allEmails) {
    await cleanupUser(email);
  }

  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=500`, { headers: HEADERS });
  const listData = await listRes.json();
  for (const email of allEmails) {
    const existing = listData.users?.find((u) => u.email === email);
    if (existing) {
      await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${existing.id}`, { method: 'DELETE', headers: HEADERS });
      console.log(`   Deleted auth user ${email}`);
    }
  }
  console.log('   Cleanup done\n');

  // ── 1. Create teacher auth user ────────────────────────────────
  console.log('1. Creating teacher auth user...');
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      id: TEACHER_USER_ID,
      email: TEACHER_EMAIL,
      password: TEACHER_PASSWORD,
      email_confirm: true,
      user_metadata: { role: 'parent', display_name: 'Ms. Thompson' },
    }),
  });
  if (!authRes.ok) throw new Error(`Auth create failed: ${authRes.status} ${await authRes.text()}`);
  console.log(`   Auth user ID: ${TEACHER_USER_ID}`);

  // ── 2. Create teacher public.users record ──────────────────────
  console.log('2. Creating teacher public.users record...');
  await insert('users', {
    id: TEACHER_USER_ID,
    role: 'parent',
    email: TEACHER_EMAIL,
    display_name: 'Ms. Thompson',
    status: 'active',
    onboarded: true,
    parent_type: 'school_teacher',
  });
  console.log('   Done');

  // ── 3. Create class code ───────────────────────────────────────
  console.log('3. Creating class code...');
  await insert('class_codes', {
    teacher_id: TEACHER_USER_ID,
    code: CLASS_CODE,
    class_name: '10A English',
    is_active: true,
  });
  console.log(`   Class code: ${CLASS_CODE}`);

  // ── 4. Create students ─────────────────────────────────────────
  const studentProfiles = [];
  for (let i = 0; i < STUDENTS.length; i++) {
    const s = STUDENTS[i];
    const userId = uid();
    const studentId = uid();

    console.log(`\n4.${i + 1}. Creating student: ${s.name} (${s.email})...`);

    const sAuthRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        id: userId,
        email: s.email,
        password: TEACHER_PASSWORD,
        email_confirm: true,
        user_metadata: { role: 'student', display_name: s.name },
      }),
    });
    if (!sAuthRes.ok) throw new Error(`Student auth create failed: ${sAuthRes.status} ${await sAuthRes.text()}`);

    await insert('users', {
      id: userId,
      role: 'student',
      email: s.email,
      display_name: s.name,
      status: 'active',
      onboarded: true,
    });

    await insert('student_profiles', {
      id: studentId,
      user_id: userId,
      display_name: s.name,
      level: s.level,
    });

    const invCode = genCode();
    await insert('invite_codes', { code: invCode, student_id: studentId, is_active: true });

    await insert('parent_student_links', {
      parent_id: TEACHER_USER_ID,
      student_id: studentId,
    });

    studentProfiles.push({ userId, studentId, ...s });
    console.log(`   Student ID: ${studentId}, Invite: ${invCode}, Linked to teacher`);
  }

  // ── 5. Create topics (international prompts) ─────────────────
  console.log('\n5. Creating topics...');
  const topicIds = [];
  const topicPrompts = [
    { cat: 'environment', type: 'situational', prompt: 'Write a formal letter to the editor of a national newspaper arguing for stronger government action on climate change.' },
    { cat: 'technology', type: 'situational', prompt: 'Write a report for your school magazine on how social media affects the mental health of young people.' },
    { cat: 'education', type: 'continuous', prompt: 'Write about a moment when a stranger\'s kindness changed your perspective on life.' },
  ];
  for (const tp of topicPrompts) {
    const id = uid();
    topicIds.push({ id, ...tp });
    await insert('topics', {
      id,
      source: 'manual',
      essay_type: tp.type,
      category: tp.cat,
      created_by: TEACHER_USER_ID,
    });
  }
  console.log(`   Created ${topicIds.length} topics`);

  // ── 6. Create assignments and submissions for each student ─────
  console.log('\n6. Creating assignments & submissions...');
  for (const student of studentProfiles) {
    console.log(`\n   ${student.name}:`);
    for (let t = 0; t < topicIds.length; t++) {
      const tp = topicIds[t];
      const assignId = uid();
      await insert('assignments', {
        id: assignId,
        student_id: student.studentId,
        topic_id: tp.id,
        essay_type: tp.type,
        prompt: tp.prompt,
        word_count_min: 150,
        word_count_max: 400,
        status: t < 2 ? 'completed' : 'assigned',
      });

      if (t < 2) {
        const subId = uid();
        await insert('submissions', {
          id: subId,
          assignment_id: assignId,
          status: 'evaluated',
          image_refs: ['mock/test.jpg'],
          ocr_text: `Mock essay by ${student.name} on ${tp.cat}. The student presents a well-structured argument with clear reasoning.`,
          created_at: daysAgo(5 - t),
        });

        const band = Math.min(5, 2 + t + studentProfiles.indexOf(student));
        const evalId = uid();
        await insert('evaluations', {
          id: evalId,
          submission_id: subId,
          essay_type: tp.type,
          rubric_version: 'intl-igcse-v1',
          model_id: 'gpt-4o',
          prompt_version: 'v1',
          dimension_scores: tp.type === 'continuous'
            ? [
                { name: 'Content & Development', score: band * 2, maxScore: 10, band, justification: 'Mock' },
                { name: 'Language & Expression', score: band * 2, maxScore: 10, band, justification: 'Mock' },
                { name: 'Organisation & Structure', score: band * 2, maxScore: 10, band, justification: 'Mock' },
              ]
            : [
                { name: 'Task Fulfilment', score: band * 2, maxScore: 10, band, justification: 'Mock' },
                { name: 'Language & Style', score: band * 2, maxScore: 10, band, justification: 'Mock' },
                { name: 'Organisation & Coherence', score: band * 2, maxScore: 10, band, justification: 'Mock' },
              ],
          total_score: band * 6,
          band,
          strengths: ['Clear structure'],
          weaknesses: [{ dimension: 'Language', text: 'Minor errors' }],
          next_steps: ['Practise varied sentence structures'],
          confidence: 0.85,
          review_recommended: false,
          created_at: daysAgo(5 - t),
        });

        console.log(`   ✅ ${tp.cat} (${tp.type}) — evaluated, band ${band}`);
      } else {
        console.log(`   📝 ${tp.cat} (${tp.type}) — open, awaiting submission`);
      }
    }
  }

  // ── Summary ────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  MOCK TEACHER DATA CREATED (International)          ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Class code:  ${CLASS_CODE}                              ║`);
  console.log(`║  Class name:  10A English                           ║`);
  console.log(`║  Students:    ${STUDENTS.length}                                ║`);
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  TEACHER LOGIN                                      ║');
  console.log(`║  Email:    ${TEACHER_EMAIL}    ║`);
  console.log(`║  Password: ${TEACHER_PASSWORD}                   ║`);
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  STUDENT LOGINS (all same password)                 ║');
  for (const s of STUDENTS) {
    console.log(`║  ${s.name.padEnd(18)} ${s.email.padEnd(35)}║`);
  }
  console.log(`║  Password: ${TEACHER_PASSWORD}                   ║`);
  console.log('╚══════════════════════════════════════════════════════╝');
}

main().catch((err) => { console.error('\nFATAL:', err.message); process.exit(1); });
