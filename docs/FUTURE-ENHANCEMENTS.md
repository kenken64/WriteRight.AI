# WriteRight.AI — Future Enhancements

> Generated 2026-02-18 from a full codebase audit. Organised by priority tier.

---

## Tier 1 — Critical Fixes & Quick Wins

### 1.1 Complete the 9 Missing Achievement Rules

**Problem:** The database seeds 23 achievements but `packages/ai/src/achievements/rules.ts` only implements 14 check functions. Nine achievements exist in the DB but can never be awarded automatically.

| Achievement Code | Missing Logic |
|---|---|
| `band_3_unlocked` | Award when a student first reaches Band 3 |
| `consistency_king` | Weekly submission streak for 4 consecutive weeks |
| `grammar_hero` | Grammar error count reduction between consecutive evaluations |
| `vocab_explorer` | Vocabulary sophistication score improvement across submissions |
| `comeback_kid` | Return submission after 14+ days of inactivity |
| `self_corrector` | Student manually corrects OCR text before evaluation |
| `reflective_writer` | Student views rewrite feedback before submitting next essay |
| `topic_explorer` | Submit essays across 5+ topic categories |
| `all_rounder` | Achieve Band 4+ in both situational and continuous writing |

**Effort:** ~2 days. Most rules need a simple DB query in the achievement context.

---

### 1.2 Unify the Rubric Model (3 Competing Structures)

**Problem:** Three different rubric structures coexist:

| Location | Structure |
|---|---|
| `marking/rubrics/*.ts` + prompts | 3 dimensions x 10 pts = 30 |
| PRD + `live-scorer.ts` prompt | 2 dimensions (Task 10 + Language 20 = 30) |
| Supabase edge function fallback | 5 dimensions x 6 pts = 30 |

The live scorer returns a different dimension breakdown than the full evaluation. Students see inconsistent dimension names between the editor panel and the feedback page.

**Recommendation:** Standardise on the 3-dimension model (which is the primary evaluation path) and update the live scorer prompt to return the same 3 dimensions. Remove the 5-dimension fallback from the edge function.

**Effort:** ~1 day.

---

### 1.3 Backport the `pdf-parse` Import Fix

**Problem:** Documented in `docs/drift-report.md` — the `pdf-parse` library tries to read a test PDF at import time, which fails in serverless/edge environments. The international fork has a workaround that needs backporting to `packages/ai/src/ocr/pdf-extractor.ts`.

**Effort:** ~30 minutes.

---

### 1.4 Fix Analytics Multi-Student Scope for Parents

**Problem:** `apps/web/src/app/(dashboard)/analytics/page.tsx` queries `student_score_trend` without filtering by a specific `student_id`. For parents with multiple linked students, this may return mixed data or only one student's data.

**Recommendation:** Add a student selector dropdown for parent users. Query `parent_student_links` to get linked student IDs, let the parent toggle between them.

**Effort:** ~half day.

---

### 1.5 Remove Dead Stripe Webhook Stubs

**Problem:** `lib/stripe/webhooks.ts` contains 4 handler stubs (`handleSubscriptionCreated`, etc.) that are `console.log` + TODO. The real webhook handling is in `/api/v1/webhooks/stripe/route.ts`. The stubs are dead code.

**Recommendation:** Delete `lib/stripe/webhooks.ts` to avoid confusion.

**Effort:** ~15 minutes.

---

## Tier 2 — High-Impact Features

### 2.1 Free-Tier Enforcement (Billing Gating)

**Problem:** The billing system creates Stripe Checkout sessions and handles webhooks, but **no middleware enforces the free-tier limits**:

- 3 submissions/month (free)
- 2 topic generations/month (free)
- Rewrite copy/export locked on free tier

The `/api/v1/billing/usage` endpoint exists but nothing checks it before allowing operations.

**Recommendation:** Add a `checkUsageQuota(userId, operation)` middleware that:
1. Queries `api_usage_logs` or a dedicated `user_quotas` table for the current billing period
2. Checks the user's `subscriptions.plan` (free vs plus)
3. Returns 402 with a clear upgrade prompt if quota exceeded

Apply it to: `POST /submissions`, `POST /topics/generate`, `POST /submissions/{id}/rewrite`.

**Effort:** ~2 days.

---

### 2.2 Push Notifications

**Problem:** Multiple features reference notifications but none are implemented beyond audit log entries:

- Redemption nudge (`POST /redemptions/{id}/nudge`) — logs to audit but doesn't notify
- Achievement unlock — no notification
- Feedback ready — no notification
- Weekly digest — mentioned in user notification_prefs but not sent

**Recommendation — phased approach:**

1. **Phase A (email):** Use Resend (already integrated for password reset) to send:
   - "Feedback Ready" email when evaluation completes
   - "Achievement Unlocked" email with badge emoji
   - Weekly digest summarising submissions + scores
2. **Phase B (web push):** Add service worker + Web Push API for in-browser notifications
3. **Phase C (WhatsApp):** Integrate Twilio/WhatsApp Business API for parent notifications (noted as Phase 2 in PRD)

**Effort:** Phase A: ~2 days. Phase B: ~3 days. Phase C: ~3 days.

---

### 2.3 Distributed Rate Limiting

**Problem:** The current rate limiter in `middleware.ts` uses an in-memory `Map`. On Railway, each deployment restarts the counter. If the app is scaled horizontally, each instance has its own counter.

**Recommendation:** Replace with **Upstash Redis** rate limiting:
- `@upstash/ratelimit` library (serverless-friendly, single HTTP call per check)
- Sliding window algorithm (already the current approach)
- Shared state across all instances
- Free tier: 10k commands/day (sufficient for current scale)

**Effort:** ~half day.

---

### 2.4 Peer Comparison & Class Analytics

**Problem:** Students and parents only see individual progress. Teachers (newly added `school_teacher` / `tuition_teacher` roles) have no class-level view.

**Recommendation:**
- Add `class_groups` table (teacher_id, name, level)
- Add `class_group_members` (class_group_id, student_id)
- Build teacher dashboard: class average band, score distribution histogram, top improving students, common weaknesses across the class
- Optional: anonymised peer comparison for students ("You scored higher than 70% of students at your level")

**Effort:** ~5 days.

---

### 2.5 Spaced Repetition for Weaknesses

**Problem:** Students get feedback on weaknesses but there's no mechanism to revisit and practice specific areas.

**Recommendation:**
- Extract weakness patterns from evaluations (e.g., "weak transitions", "limited vocabulary range")
- Generate targeted micro-exercises (sentence completion, paragraph rewrite drills) using GPT-4o-mini
- Schedule reviews using SM-2 spaced repetition algorithm
- Track mastery per weakness category
- Surface in the dashboard as "Practice Queue" with streak integration

**Effort:** ~5 days.

---

### 2.6 Essay Version Comparison

**Problem:** The `draft_versions` table stores multiple versions of an essay, but there's no UI to compare versions side by side to see improvement over time.

**Recommendation:**
- Add a "Version History" tab on the essay editor page
- Show a timeline of saved versions with word count and live score at each save
- Allow selecting any two versions for side-by-side diff comparison
- Highlight the band/score progression across versions

**Effort:** ~2 days (reuse existing `DiffView` component).

---

## Tier 3 — Strategic Enhancements

### 3.1 Real News Scraping for Topic Generation

**Problem:** `packages/ai/src/topics/from-trending.ts` generates SG-context topics using GPT without actual news data. Topics may feel generic rather than timely.

**Recommendation:**
- Scrape RSS feeds from CNA, Straits Times, TODAY (Singapore press)
- Extract article summaries and themes
- Feed real article context into the existing topic generation prompt
- Cache trending articles daily via a cron job (Railway or Supabase edge function)
- Show the source article alongside the generated prompt for context

**Effort:** ~3 days.

---

### 3.2 Error Tracking & Observability (Sentry)

**Problem:** No error tracking beyond `console.error`. Production errors are invisible unless users report them. The `api_usage_logs` table tracks AI calls but not application errors.

**Recommendation:**
- Integrate Sentry (Next.js SDK) for:
  - Automatic error capture with source maps
  - Performance monitoring (API route latency)
  - Session replay for debugging UI issues
- Add custom Sentry breadcrumbs for the AI pipeline (OCR start → OCR complete → evaluate start → etc.)
- Set up alerts for: evaluation failures, OCR confidence < 0.5, Stripe webhook failures

**Effort:** ~1 day for basic setup. ~2 days for custom breadcrumbs + alerts.

---

### 3.3 E2E Test Suite (Playwright)

**Problem:** 77 unit tests exist but zero E2E tests. Critical user flows (upload → OCR → evaluate → view feedback → rewrite) are untested end-to-end.

**Recommended coverage:**
1. Student onboarding flow
2. Upload submission → poll for completion → view feedback
3. Request rewrite → view annotated rewrite with target band selection
4. Essay editor: type → live score updates → grammar highlights → save draft
5. Parent: link via invite code → view child's analytics → manage wishlist
6. Billing: free tier quota → upgrade flow → Stripe checkout redirect

**Effort:** ~5 days for the core 6 flows.

---

### 3.4 Internationalisation Architecture

**Problem:** The drift report documents a parallel "Sharpener" international fork (Cambridge/IELTS curriculum) with 329 shared files. Currently, curriculum-specific strings are hardcoded throughout.

**Recommendation:**
- Extract curriculum config into `packages/curriculum/` with:
  - `sg.ts` — MOE 1184 rubric, band descriptors, vocabulary level expectations
  - `cambridge.ts` — IGCSE/IELTS rubric, band descriptors
  - `ib.ts` — (future) IB English rubric
- Make the AI prompts, rubric files, and achievement criteria load from the curriculum config
- Use env var `CURRICULUM=sg` to select at build time
- This eliminates the need for a separate fork and reduces merge drift

**Effort:** ~5 days for the abstraction layer. Ongoing savings from single codebase.

---

### 3.5 Collaborative Review (Teacher Markup)

**Problem:** Teachers can view student submissions but cannot add their own annotations or override AI scores.

**Recommendation:**
- Add `teacher_annotations` table (evaluation_id, teacher_id, paragraph_index, comment, override_score)
- Build a teacher markup UI: overlay on the evaluated essay, click-to-annotate paragraphs
- Allow teachers to override individual dimension scores with justification
- Show both AI and teacher feedback side-by-side for the student
- Track AI vs teacher agreement rate for calibration insights

**Effort:** ~5 days.

---

### 3.6 Audio Feedback (TTS Enhancement)

**Problem:** The TTS engine (`packages/ai/src/tts/`) is fully implemented with voice profiles and chunking, but it's only exposed via a single `/api/v1/tts` endpoint. No UI integration exists for listening to feedback.

**Recommendation:**
- Add "Listen to feedback" button on the feedback page
- Generate audio for: overall summary, per-dimension feedback, next steps
- Use the "coach" voice profile (slower, warmer) for feedback delivery
- Cache generated audio in Supabase Storage to avoid re-synthesis
- Consider: audio walkthrough of the rewrite annotations ("In paragraph 1, notice how...")

**Effort:** ~2 days for basic integration. ~3 days for the rewrite audio walkthrough.

---

### 3.7 Offline/PWA Support

**Problem:** Students in Singapore schools may have intermittent connectivity. The essay editor requires constant connection for auto-save and AI features.

**Recommendation:**
- Add PWA manifest + service worker (Next.js `next-pwa` or manual)
- Cache the editor page shell for offline access
- Queue draft saves in IndexedDB when offline, sync when reconnected
- Disable AI features gracefully when offline (show "AI features available when online")
- Show offline indicator in the status bar

**Effort:** ~3 days.

---

### 3.8 Parent Dashboard Enhancements

**Problem:** Parents see basic analytics but lack actionable insights and engagement tools.

**Recommendation:**
- **Weekly email summary:** Auto-generated from `student_score_trend` view — band progression, submissions count, strengths emerging, areas still weak
- **Goal setting:** Parent + student set a target band + deadline, tracked on the dashboard with a progress bar
- **Conversation starters:** Based on the latest evaluation, suggest specific questions parents can ask ("Ask about how they structured their argument in the last essay")
- **Comparative context:** Show where the student sits relative to the band distribution for their level (anonymised)

**Effort:** ~4 days.

---

## Tier 4 — Long-Term Vision

### 4.1 Multi-Language Support
Extend beyond English to Mother Tongue papers (Chinese, Malay, Tamil) — significant rubric and prompt work needed. GPT-4o supports these languages.

### 4.2 Handwriting Style Analysis
Use the OCR image data to detect and coach on handwriting legibility — a real exam scoring factor.

### 4.3 Exam Simulation Mode
Full timed exam simulation with topic selection, countdown timer, auto-submit, immediate AI marking — simulating the O-Level exam experience.

### 4.4 Student Portfolio & Export
Generate a downloadable PDF portfolio of the student's best work with score progression, suitable for school teacher sharing or MOE DSA applications.

### 4.5 API for Third-Party Integration
Expose a public API for tuition centres to integrate WriteRight scoring into their own platforms. Monetise via API usage billing.

---

## Architecture Debt Summary

| Item | Severity | Effort |
|---|---|---|
| 9 missing achievement rules | Medium | 2 days |
| 3 competing rubric models | High | 1 day |
| `pdf-parse` import bug | High | 30 min |
| Dead Stripe webhook stubs | Low | 15 min |
| In-memory rate limiting | Medium | 0.5 day |
| No free-tier enforcement | High | 2 days |
| No push notifications | Medium | 2–8 days |
| Analytics multi-student bug | Medium | 0.5 day |
| No E2E tests | Medium | 5 days |
| Edge function / API route duplication | Low | 1 day |
