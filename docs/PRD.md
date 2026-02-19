# WriteRight SG - Product Requirements Document (v3 — Enhanced)

## 1. Product Scope Decision (MVP Lock)

### 1.1 MVP Role Scope (Phase 1)
- Included: Parent, Student
- Excluded to Phase 2+: Tutor/Tuition Centre, School Teacher (kept in architecture, not in UI)

### 1.2 MVP Platforms
- Included: Web app (mobile-responsive), mobile web upload flow
- Deferred: Native iOS/Android apps

### 1.3 MVP Languages
- Included: English UI + English essay workflows
- Limited pilot: Chinese OCR/marking behind feature flag for selected accounts
- Deferred: full bilingual parity

### 1.4 MVP Essay Types
- **Situational Writing** (Paper 1 Section B) — letter, email, report, speech, proposal
- **Continuous Writing** (Paper 1 Section C) — narrative, expository, argumentative, descriptive
- Each type has its own rubric mapping and prompt format
- Essay type must be selected before submission to ensure correct rubric is applied

### 1.5 Competitive Landscape
| Competitor | Weakness | WriteRight Edge |
|---|---|---|
| Generic AI (ChatGPT/Grammarly) | No SG curriculum alignment, no rubric scoring | MOE-aligned rubrics, band scoring |
| Tuition centres | Expensive ($200-400/mo), slow turnaround | Instant feedback, fraction of cost |
| EssayGrader.ai | US-centric rubrics, no OCR for handwritten | SG O/A Level rubrics, handwriting OCR |
| School teachers | Overworked, 2-4 week turnaround | <5 min feedback, unlimited practice |

### 1.6 Singapore Secondary Education Context

Secondary education in Singapore typically lasts four to five years:

- **Four-Year Course (Express):** Primarily for Express stream students (and some Normal Academic students) taking the GCE 'O' Level examinations.
- **Five-Year Course (Normal):** For Normal (Academic) and Normal (Technical) students who take the GCE 'N' Levels in their 4th year and often the GCE 'O' Levels in their 5th year.
- **Integrated Programme (IP):** A direct, 6-year route (4 years secondary + 2 years junior college) that skips the GCE 'O' Levels, leading directly to the A-Levels or equivalent.

> **Note:** The Ministry of Education is transitioning to Full Subject-Based Banding (FSBB), which replaces traditional streaming, but the 4-to-5-year structure largely remains as of 2026.

**Supported student levels:** Secondary 1, Secondary 2, Secondary 3, Secondary 4, Secondary 5

---

## 2. Assessment Truth Model (Locked)

### 2.1 Score Schema — Aligned to MOE 1184 Syllabus

#### Situational Writing (Section B) — Total: 30
| Dimension | Max Marks | MOE Mapping |
|---|---|---|
| Task Fulfilment | 10 | Addressing required points, purpose/audience/context, use of given info |
| Language | 20 | Organisation, clarity of expression, accuracy |

#### Continuous Writing (Section C) — Total: 30
| Dimension | Max Marks | MOE Mapping |
|---|---|---|
| Content & Development | 10 | Relevance, depth, engagement |
| Language & Organisation | 20 | Expression, vocabulary, grammar, structure |

### 2.2 Banding (per MOE 1184 descriptors)

#### Situational Writing — Task Fulfilment (out of 10)
| Band | Marks | Descriptor |
|---|---|---|
| 5 | 9-10 | All points addressed and developed in detail; purpose/audience/context fully addressed |
| 4 | 7-8 | All points addressed with one or more developed; purpose/audience/context clearly addressed |
| 3 | 5-6 | Most points addressed with some development |
| 2 | 3-4 | Some points addressed; partially addressed context |
| 1 | 1-2 | One point addressed; occasionally addressed context |
| 0 | 0 | No creditable response |

#### Situational Writing — Language (out of 20)
| Band | Marks | Descriptor |
|---|---|---|
| 5 | 17-20 | Coherent and cohesive; effective use of ambitious vocabulary; complex grammar used accurately |
| 4 | 13-16 | Coherent with some cohesion; varied vocabulary and grammar; mostly accurate |
| 3 | 9-12 | Most ideas coherent; vocabulary varied enough to convey meaning; often accurate |
| 2 | 5-8 | Some ideas coherent; mostly simple vocabulary; meaning usually clear |
| 1 | 1-4 | Ideas in isolation; simple vocabulary; few correct examples |
| 0 | 0 | No creditable response |

### 2.3 Marking Output Contract
- Required per submission:
  - **Per-dimension score + band + justification** with direct quotes from student text
  - 3 strengths — each citing a specific passage
  - 3 weaknesses — each citing a specific passage with suggested improvement
  - 3 actionable next steps — concrete and specific to this essay (no generic advice)
  - Confidence score (0-1) for OCR and marking
  - Review recommended flag when low confidence or OCR ambiguity
- **Feedback quality rules:**
  - Every piece of feedback MUST reference the student's actual text
  - No contradictions between strengths and weaknesses
  - No generic comments (e.g. "try to use more varied vocabulary" without examples)
  - Provide a rewritten example for each weakness

### 2.4 Model Version Tracking
- Every evaluation records: `rubricVersion`, `modelId`, `promptVersion`, `timestamp`
- Score comparisons only valid within same rubric+model version
- Dashboard flags when historical scores used a different version
- Model/prompt changes require re-benchmarking against calibration set before deployment

---

## 3. Quality Targets & Service Levels

### 3.1 Performance SLOs (MVP)
- p95 upload-to-feedback latency: <= 5 minutes
- p99 upload-to-feedback latency: <= 8 minutes
- Uptime: 99.5% monthly

### 3.2 OCR Quality Targets
- English handwritten character accuracy: >= 92% (clean images), >= 85% (typical home photos)
- Chinese handwritten character accuracy: >= 85% pilot target
- OCR confidence threshold for manual correction prompt: < 0.80

### 3.3 Marking Quality Targets
- Agreement with human marker (exact band match): >= 70%
- Agreement within +/-2 marks (out of 30): >= 90%
- Re-evaluation cadence: monthly benchmark set against annotated scripts
- **Launch requirement:** Calibration set of 50+ pre-scored essays (by qualified teachers) before GA

### 3.4 Failure Budgets
- OCR hard-failure rate (cannot produce draft text): < 3%
- Marking generation failure rate: < 1%
- Rewrite generation failure rate: < 1%

---

## 4. Safety, Pedagogy & Moderation Guardrails

### 4.1 Rewrite Guardrails
- Label rewritten text as: **Reference Model Answer (for learning)**
- Never claim guaranteed grades
- Always include "Why this change" explanations grouped by:
  - Structure
  - Language
  - Vocabulary
  - Task response
- Enforce word-count envelope (+/-5% unless user allows flexible mode)
- **Rewrite must match student's approximate language level** — don't produce Band 5 prose for a Band 2 student. Aim one band above current level.

### 4.2 Anti Over-Reliance Controls
- Show original first, rewrite second
- Lock copy/export for free tier
- Require student reflection prompt before seeing full rewrite (paid tier configurable)

### 4.3 Content Safety
- Detect and block harmful/offensive prompt generation
- Quarantine flagged submissions for review
- Provide parent-visible incident note for blocked content

### 4.4 Appeals/Recheck
- Parent can request one-click recheck
- **Recheck methodology:** Runs a second evaluation pass with:
  - Different system prompt emphasising areas of concern
  - Re-verification of OCR text accuracy
  - If score differs by >3 marks from original, flag for human review queue
- Response SLA for recheck result: <= 24 hours (automated unless escalated)

---

## 5. Privacy, Security, Retention (Concrete)

### 5.1 Data Classification
- PII: parent account data, student profile metadata
- Sensitive educational data: scripts, OCR text, feedback history
- Billing data: handled via payment provider tokenization

### 5.2 Retention Policy
- Free tier submissions: retain 12 months
- Paid tier submissions: retain while active + 24 months after cancellation
- Logs with masked identifiers: 90 days
- Backups: rolling 35 days

### 5.3 Deletion & Export SLA
- Export request completion: <= 7 days
- Deletion completion (primary + backups expiry path): <= 30 days
- Immediate access revocation on deletion request confirmation

### 5.4 Security Controls
- TLS in transit, encryption at rest
- RBAC enforced server-side
- Optional 2FA for paid accounts (email/SMS OTP)
- Audit trail for access to student records

---

## 6. Topic & Question Generator

### 6.1 Overview
Two modes for generating practice essay topics:

### 6.2 Mode 1: From Article (Manual Upload)
- Parent/student uploads a newspaper clipping (image) or pastes article text
- System extracts key themes via OCR (reuses existing pipeline) or NLP
- AI generates 2-3 essay prompts per article, mapped to selected essay type
- Prompts include guiding points (for situational writing) or suggested angles (for continuous writing)
- Source article stored and linked to generated assignments

### 6.3 Mode 2: From Internet (Auto-Generated)
- System curates trending topics from SG news sources weekly
- AI generates age-appropriate, MOE-style prompts from curated topics
- Topics categorised: Environment, Technology, Social Issues, Education, Health, Current Affairs
- Filterable by: essay type, level (Sec 1-5), difficulty
- Content moderation: auto-filter inappropriate themes; human review for edge cases
- Refresh cadence: weekly batch + on-demand generation

### 6.4 Topic Bank
- All generated topics stored in searchable bank
- Parents can browse, filter, and assign from topic bank
- Popular/well-rated topics surfaced first
- Community ratings (optional Phase 2): parents rate topic quality

---

## 7. Upload & Connectivity

### 7.1 Resilient Upload Flow
- Chunked upload with resume capability for multi-image submissions
- Progress indicator per image with retry button
- Auto-save draft state — partially uploaded submissions recoverable
- Offline detection: queue uploads when connectivity returns
- Image quality pre-check before upload (blur detection, lighting, orientation)
- Guided capture UI: overlay showing ideal framing for handwritten scripts

### 7.2 Image Processing
- Auto-rotate and deskew
- Multi-page ordering with drag-and-drop reorder
- Support up to 8 images per submission
- Accepted formats: JPEG, PNG, HEIF (iPhone native)

---

## 8. Onboarding & Trust Building

### 8.1 First-Time Parent Flow
1. Register (email or mobile)
2. Add student profile (name, level: Sec 1-5)
3. **Interactive demo:** System marks a pre-loaded sample essay in real-time, explaining each score
4. Guided first submission with tooltips
5. Post-first-feedback survey: "Did this match your expectations?"

### 8.2 Trust Signals
- Display confidence score prominently — "AI is 87% confident in this assessment"
- Show rubric band descriptors alongside scores — parent can verify
- Link to MOE 1184 syllabus reference for transparency
- "How we mark" explainer page with methodology
- Display calibration stats: "Our scores match qualified teachers 70%+ of the time"

### 8.3 Notifications
- **Email:** Feedback ready, weekly progress summary, subscription reminders
- **Push (web):** Feedback ready, recheck complete
- **WhatsApp (Phase 2):** Optional — feedback summary + link
- Parent configures notification preferences in settings

---

## 9. Pricing & Billing

### 9.1 Free Tier
- 3 submissions per month
- Full marking + feedback
- Rewrite: view only (no copy/export)
- Topic generator: 2 generations per month
- Analytics: last 30 days only

### 9.2 Paid Tier — "WriteRight Plus" (tentative: $14.90/month or $129/year)
- Unlimited submissions
- Full rewrite with copy/export
- Unlimited topic generation
- Analytics: full history + trend charts
- Priority processing (<3 min p95)
- Recheck: 3 per month included
- Up to 3 student profiles per account

### 9.3 Billing
- Payment: Stripe (credit card, PayNow integration if available)
- Trial: 7-day free trial of Plus on signup
- Cancellation: immediate access to end of billing period
- No annual lock-in; monthly cancellable

---

## 10. 12-Week MVP Delivery Plan

### Weeks 1-2: Foundations
- Finalize score schema aligned to MOE 1184 rubrics
- Set up auth, parent/student accounts, student linking
- Build submission pipeline skeleton (upload, job queue, status tracking)
- Assemble calibration essay set (50+ scored by teachers)
- Design database schema (see Section 12)

### Weeks 3-4: Topic Generator + Print
- Generate MOE-style prompts (English only) — both manual and auto modes
- Topic bank with browse/filter
- Add PDF print layout
- Add assignment creation and student assignment linkage

### Weeks 5-6: OCR + Manual Correction
- Multi-image upload with chunked resume
- Image quality pre-check + guided capture
- OCR extraction pipeline + confidence scoring
- Manual correction editor and save versioning

### Weeks 7-8: Marking Engine v1
- Rubric scoring engine (separate flows for situational vs continuous writing)
- Feedback cards (strength/weakness/actions) — all citing student text
- Low-confidence review flag and recheck trigger
- Benchmark against calibration set; iterate prompts until quality targets met

### Weeks 9-10: Rewrite + Comparison UX
- Two rewrite modes: exam-optimised, clarity-optimised
- Rewrite pitched at one band above student's current level
- Side-by-side diff view
- "Why this change" explanations

### Weeks 11-12: Analytics + Billing + Hardening
- Parent dashboard (trend, error categories, submission frequency)
- Onboarding flow with interactive demo
- Free tier limits + paid subscription gating (Stripe)
- SLO dashboards, incident alerts, security review, pilot release
- Error state UX (OCR failure, timeout, low confidence)

---

## 11. API Draft (MVP)

### 11.1 Auth & Accounts
- POST /v1/auth/register
- POST /v1/auth/login
- POST /v1/auth/refresh
- POST /v1/auth/forgot-password — sends password reset email via Supabase
- POST /v1/auth/reset-password — updates password using reset token
- GET /v1/auth/callback — exchanges Supabase auth code for session (used by email reset links)
- POST /v1/students
- POST /v1/students/{studentId}/link-parent
- GET /v1/users/me
- PUT /v1/users/me/notifications (notification preferences)

### 11.2 Topics & Assignments
- POST /v1/topics/generate `{ source: "upload" | "trending", essayType, level, articleText?, imageRefs? }`
- GET /v1/topics?category=&essayType=&level= (browse topic bank)
- POST /v1/assignments `{ studentId, topicId?, prompt, essayType, wordCountMin, wordCountMax }`
- GET /v1/assignments/{assignmentId}
- POST /v1/assignments/{assignmentId}/export-pdf

### 11.3 Submissions
- POST /v1/submissions `{ assignmentId }` → returns `{ submissionId, uploadUrls[] }`
- PUT /v1/submissions/{submissionId}/images/{index} (chunked upload)
- POST /v1/submissions/{submissionId}/finalize
- GET /v1/submissions/{submissionId}/status
- GET /v1/submissions/{submissionId}/ocr-text
- PUT /v1/submissions/{submissionId}/ocr-text (manual correction)

### 11.4 Evaluation
- POST /v1/submissions/{submissionId}/evaluate
- GET /v1/submissions/{submissionId}/feedback

**Sample feedback response:**
```json
{
  "submissionId": "sub_abc123",
  "essayType": "situational_writing",
  "rubricVersion": "1184-sw-v1",
  "modelVersion": "gpt4o-2024-08",
  "promptVersion": "sw-marking-v3",
  "dimensions": [
    {
      "name": "Task Fulfilment",
      "score": 7,
      "maxScore": 10,
      "band": 4,
      "justification": "All required points addressed. The suggestion about LED bulbs is well-developed with supporting data. However, the point about school campaigns could use more specific detail."
    },
    {
      "name": "Language",
      "score": 14,
      "maxScore": 20,
      "band": 4,
      "justification": "Coherent presentation with effective rhetorical questions ('Is it wise to keep using something that wastes energy?'). Vocabulary is varied ('inefficient', 'disrupted ecosystems'). Minor issues: some repetitive sentence structures in the solutions paragraph."
    }
  ],
  "totalScore": 21,
  "band": 4,
  "strengths": [
    { "text": "Strong opening hook with the light/pollution paradox creates immediate engagement", "quote": "every time you switch on a light, you are also switching on pollution" },
    { "text": "Effective use of rhetorical questions to persuade the audience", "quote": "Is it wise to keep using something that wastes energy, harms the environment, and drains money?" },
    { "text": "Clear call-to-action with specific, actionable suggestions", "quote": "launching a 'Switch It Off, Save the Earth' campaign" }
  ],
  "weaknesses": [
    { "text": "Solutions section becomes list-like without sufficient elaboration", "quote": "First, we can switch to energy-efficient bulbs... Second, we can develop the habit...", "suggestion": "Develop each solution with a specific example or statistic, e.g. 'An LED bulb uses 75% less energy — switching just 10 classroom lights could save $500 a year.'" },
    { "text": "Repetitive sentence openings weaken the flow", "quote": "More energy... More air pollution... More carbon emissions...", "suggestion": "Vary the sentence structure: 'As energy consumption rises, so does air pollution — and with it, carbon emissions that drive global warming.'" },
    { "text": "Conclusion restates points without adding new emotional weight", "quote": "Let us act now, switch to efficient bulbs, switch off unnecessary lights", "suggestion": "End with a vivid image or challenge: 'Next time you leave a classroom, look at that light switch. That's not just electricity — that's your future.'" }
  ],
  "nextSteps": [
    "Practice varying sentence openings — aim for no more than 2 consecutive sentences starting the same way",
    "When listing solutions, develop one fully (with data/example) rather than listing many briefly",
    "Study speeches by student leaders for how they close with emotional resonance rather than summary"
  ],
  "confidence": 0.85,
  "reviewRecommended": false
}
```

- POST /v1/submissions/{submissionId}/rewrite `{ mode: "exam-optimised" | "clarity-optimised" }`
- POST /v1/submissions/{submissionId}/recheck

### 11.5 Analytics & Billing
- GET /v1/parents/{parentId}/dashboard
- GET /v1/students/{studentId}/progress?period=30d|90d|all
- POST /v1/billing/subscribe `{ plan: "plus_monthly" | "plus_annual" }`
- GET /v1/billing/usage
- POST /v1/billing/cancel

### 11.6 Achievements & Gamification
- GET /v1/students/{studentId}/achievements (all earned + progress)
- GET /v1/students/{studentId}/achievements/next (closest to unlock)
- GET /v1/students/{studentId}/streaks (current + longest)

### 11.7 Wishlist & Rewards
- GET /v1/students/{studentId}/wishlist (all items + status)
- POST /v1/students/{studentId}/wishlist (kid adds item)
- PUT /v1/wishlist/{itemId} (parent sets achievement requirement)
- POST /v1/wishlist/{itemId}/claim (kid claims)

### 11.8 Redemption & Promise Tracking
- POST /v1/redemptions/{id}/acknowledge (parent saw it)
- POST /v1/redemptions/{id}/fulfil `{ note?, photoUrl? }` (parent fulfils)
- POST /v1/redemptions/{id}/reschedule `{ newDeadline, reason }`
- POST /v1/redemptions/{id}/withdraw `{ reason }`
- POST /v1/redemptions/{id}/confirm (kid confirms receipt)
- POST /v1/redemptions/{id}/nudge (kid sends gentle reminder, 1x/day max)
- GET /v1/parents/{parentId}/promise-score (fulfilment stats)
- GET /v1/parents/{parentId}/redemptions?status= (filter by status)
- GET /v1/parents/{parentId}/reward-suggestions (smart suggestions based on progress)

---

## 12. Built-in Essay Editor with AI Writing Coach

### 12.1 Overview
A Tiptap-based rich text editor where students write essays directly in the app, with a real-time AI assistant that coaches them as they write. The AI helps students write better — it does NOT write for them.

### 12.2 Writing Modes
| Mode | Timer | AI Assistant | Use Case |
|---|---|---|---|
| **Practice** | Off | Full assistance | Learning & improving |
| **Timed Practice** | Configurable (30/45/60 min) | Limited hints | Exam prep |
| **Exam Simulation** | Strict (matches O Level timing) | OFF | Mock exam |

### 12.3 AI Assistance Features
- **🔴 Real-time live scoring** — AI continuously estimates score + band as student writes, updated after every paragraph. Shows per-dimension breakdown (Task Fulfilment, Language) with specific tips to reach next band. Score progression sparkline shows improvement during the session. Uses GPT-4o-mini for <3s latency.
- **Passive analysis** (always-on, background): structure tracker, tone checker, word count pacing, repetition detector, real-time grammar highlights
- **Smart suggestions** (on pause/paragraph end): opening strategies, vocabulary upgrades, transition words, pacing warnings, conclusion prompts
- **Ask the Coach** (student chat): student types questions, AI responds with strategies and examples — never writes full text for them
- **Inline grammar** (Grammarly-style): red underline for grammar/spelling, yellow for weak vocab, orange for run-ons, blue for excessive passive voice
- **Outline builder** (pre-writing): scaffolded essay structure with AI-suggested points
- **"To reach next band"** — live actionable tips: "Address point 3", "Fix 3 grammar errors", "Use more varied vocabulary"

### 12.4 Anti-Cheating Guardrails
- AI never writes full sentences — only strategies and examples
- AI panel text is non-selectable / copy-disabled
- Max 10 suggestions + 15 chat messages per essay
- Exam mode = AI completely OFF
- All AI interactions logged — parent can review transparency log
- Adaptive assistance: less help for stronger students (Band 4-5)

### 12.5 Tech: Tiptap Editor
- Headless, extensible, React-native
- JSON document model — easy to store/version in Supabase
- Custom extensions for grammar highlights and word count
- Auto-save every 30s with draft versioning
- Collaborative-ready for Phase 2 (tutor commenting)

See `ESSAY_EDITOR.md` for full specification including data model, API, and component structure.

---

## 13. Gamification, Achievements & Rewards

### 12.1 Overview
A motivation loop connecting student effort → achievements → wishlists → parent rewards → accountability. Kids earn badges through consistent practice and improvement — not just high scores.

### 12.2 Achievement Types

#### 📝 Practice Achievements (Effort-based)
| Achievement | Criteria | Badge |
|---|---|---|
| First Steps | Complete first submission | 🐣 |
| Getting Started | Complete 5 submissions | ✏️ |
| Dedicated Writer | Complete 20 submissions | 📝 |
| Writing Machine | Complete 50 submissions | ⚡ |
| Century Club | Complete 100 submissions | 💯 |

#### 📈 Improvement Achievements (Growth-based)
| Achievement | Criteria | Badge |
|---|---|---|
| Levelling Up | Improve total score by 3+ marks over 5 submissions | 📈 |
| Band Breaker | Move up one band (e.g. Band 3 → Band 4) | 🎯 |
| Grammar Hero | Reduce language errors by 50% over 10 submissions | 🛡️ |
| Vocab Explorer | Use 10+ new vocabulary words (detected across submissions) | 📚 |
| Consistency King | Submit at least once a week for 4 consecutive weeks | 👑 |

#### 🏆 Mastery Achievements (Score-based)
| Achievement | Criteria | Badge |
|---|---|---|
| Band 3 Unlocked | Score Band 3 (15-20) for the first time | 🥉 |
| Band 4 Unlocked | Score Band 4 (21-25) for the first time | 🥈 |
| Band 5 Unlocked | Score Band 5 (26-30) for the first time | 🥇 |
| Perfect Language | Score 18+ out of 20 on Language dimension | ✨ |
| Task Master | Score 9+ out of 10 on Task Fulfilment | 🎯 |

#### 🔥 Streak Achievements
| Achievement | Criteria | Badge |
|---|---|---|
| 3-Day Streak | Submit 3 days in a row | 🔥 |
| 7-Day Streak | Submit 7 days in a row | 🔥🔥 |
| 30-Day Streak | Submit 30 days in a row | 🔥🔥🔥 |
| Comeback Kid | Return after 14+ day gap and complete a submission | 💪 |

#### 🎓 Special Achievements
| Achievement | Criteria | Badge |
|---|---|---|
| Self-Corrector | Use manual OCR correction 5 times | 🔍 |
| Reflective Writer | Complete reflection prompt before viewing rewrite 10 times | 🪞 |
| Topic Explorer | Complete essays across 5+ different topic categories | 🌍 |
| All-Rounder | Score Band 4+ in both Situational and Continuous writing | 🎓 |

### 12.3 Achievement Rules
- Achievements are **permanent** once earned (never revoked)
- Progress towards achievements shown as progress bars
- New achievement → celebratory animation + notification to parent
- Achievements visible on student's profile (shareable badge wall)
- **No leaderboards** — competition is against yourself, not others (pedagogy-first)

### 12.4 Kid's Wishlist

**How it works:**
1. Kid adds items they want to their wishlist (up to 10 items)
2. Parent reviews and tags each item with an **achievement requirement**
3. When the achievement is unlocked, the item becomes **claimable**
4. Parent gets notified → fulfils the reward

**Wishlist item types:**
- 🎁 **Custom rewards** (parent-defined): "Ice cream outing", "30 min screen time", "$10 pocket money"
- 🎮 **Pre-built templates**: Treat 🍦 | Screen Time 🎮 | Book 📖 | Activity 🏊 | Money 💰 | Creative 🎨
- 🫣 **Surprise rewards**: Parent can hide rewards that appear only when earned (delight factor)

**Reward tier suggestions:**
- **Small** (practice milestones): Treats, screen time ($0-10)
- **Medium** (improvement milestones): Books, outings ($10-30)
- **Large** (mastery milestones): Big items, experiences ($30+)

### 12.5 Prize Redemption & Parent Promise Tracking

**The accountability loop:**
```
Kid earns achievement → Claims wishlist item → Parent has 7 days to fulfil
→ Escalating nudges if overdue → Promise Score tracks history
```

**Redemption states:**
| Status | Description |
|---|---|
| 🔒 Locked | Achievement not yet earned |
| 🔓 Claimable | Achievement earned, kid can claim |
| 📋 Claimed | Kid claimed, waiting for parent |
| ⏳ Pending Fulfilment | Parent acknowledged, in progress |
| ✅ Completed | Parent fulfilled, kid confirmed receipt |
| ⚠️ Overdue | Past 7-day fulfilment deadline |
| 🔄 Rescheduled | Parent set new deadline with reason |
| ❌ Withdrawn | Parent cancelled with mandatory reason |

**Parent accountability nudges:**
| Day After Claim | Notification |
|---|---|
| Day 0 | "🎁 Aiden claimed 'Nintendo Switch game'! Fulfil within 7 days." |
| Day 3 | "⏰ Reminder: 4 days left to fulfil Aiden's reward" |
| Day 5 | "⚠️ 2 days left. Keep the promise!" |
| Day 7 | "🚨 Reward is now overdue. Aiden can see this." |
| Day 14 | "❗ Overdue for a week. This affects motivation." |

**Kid-side features:**
- Promise Tracker: "Dad promised: Nintendo Switch game 🎮 — Claimed 3 days ago ⏳"
- Confirm receipt button: "I got it! 🎉" → moves to trophy case
- Gentle nudge (1x per day max): "Hey, just a reminder about my reward! 😊"
- If overdue: shows ⚠️ but **no shaming language** — just "Still waiting..."

**Parent Promise Score (parent dashboard only, not shown to kid):**
- Tracks: `fulfilled_on_time / total_claimed`
- Display: "Your Promise Score: 87% ✅ (7 of 8 fulfilled on time)"
- Coaching nudges:
  - < 70%: "Tip: Smaller, frequent rewards work better than big rare ones."
  - < 50%: "Your child may lose motivation if rewards aren't fulfilled."

**Fulfilment options:**
- ✅ Mark as fulfilled (optional photo proof — fun memory!)
- 🔄 Reschedule with new deadline + reason (kid sees reason)
- ❌ Withdraw with mandatory reason (kid keeps the achievement badge)

### 12.6 Student Motivation UX
- **Badge wall** — earned achievements in color, locked ones greyed with progress bars
- **"Next achievement" spotlight** — closest one to unlock
- **Post-submission nudges**: "You're 3 submissions from 'Dedicated Writer'!"
- **Score improvement nudge**: "Your score went up 4 marks! Keep going for 'Levelling Up'!"
- **Streak alerts**: "🔥 5-day streak! 2 more days for the 7-day badge!"
- **Trophy case** — all fulfilled rewards with dates and optional parent photos
- **Confetti/animation** on new achievement unlock

### 12.7 Parent Reward Dashboard
- Wishlist Manager — view kid's wishes, set/modify achievement requirements
- Achievement Timeline — all earned achievements with dates
- Pending Rewards — items ready to fulfil
- Reward History — past rewards, total value, monthly spend trend
- Promise Score — fulfilment rate + coaching tips
- Quick Reward — spontaneous reward for good effort (not tied to achievement)
- Milestone Alerts — "Aiden is 1 submission away from 'Dedicated Writer'!"
- Streak alerts — "Aiden's 7-day streak ends tomorrow — remind him to submit!"

---

## 13. Data Model Draft (Core Entities)

```
User
  id, role (parent|student), email, mobile, passwordHash, status, locale,
  notificationPrefs (JSON), createdAt, updatedAt

StudentProfile
  id, userId, displayName, level (sec1|sec2|sec3|sec4|sec5), linkedParentIds[], createdAt

Topic
  id, source (upload|trending|manual), sourceText, sourceImageRefs[],
  category, essayType (situational|continuous), level,
  generatedPrompts (JSON), createdAt

Assignment
  id, studentId, topicId (nullable), essayType, essaySubType (letter|email|report|speech|proposal|narrative|expository|argumentative|descriptive),
  prompt, guidingPoints[], wordCountMin, wordCountMax, language, createdAt

Submission
  id, assignmentId, imageRefs[], ocrText, ocrConfidence, ocrModelVersion,
  status (draft|uploading|processing|ocr_complete|evaluated|failed),
  failureReason, createdAt, updatedAt

Evaluation
  id, submissionId, essayType, rubricVersion, modelId, promptVersion,
  dimensionScores (JSON), totalScore, band,
  strengths (JSON), weaknesses (JSON), nextSteps (JSON),
  confidence, reviewRecommended, createdAt

Rewrite
  id, submissionId, mode (exam_optimised|clarity_optimised),
  rewrittenText, diffPayload (JSON), rationale (JSON),
  targetBand, modelId, promptVersion, createdAt

Recheck
  id, submissionId, originalEvaluationId, newEvaluationId,
  scoreDelta, escalated, status, requestedAt, completedAt

RubricTemplate
  id, essayType, name, version, criteria (JSON), bandDescriptors (JSON),
  active, createdAt

Subscription
  id, accountId, plan, status, stripeCustomerId, stripeSubscriptionId,
  currentPeriodEnd, renewalDate, createdAt

AuditLog
  actorId, action, entityType, entityId, metadata (JSON), timestamp

Achievement
  id, code (unique), name, description, category (practice|improvement|mastery|streak|special),
  badgeEmoji, criteria (JSON), sortOrder, createdAt

StudentAchievement
  id, studentId, achievementId, unlockedAt, submissionId (trigger)

StudentStreak
  id, studentId, currentStreak, longestStreak, lastSubmissionDate, updatedAt

AchievementProgress
  id, studentId, achievementId, currentValue, targetValue, updatedAt

WishlistItem
  id, studentId, createdBy (student|parent), title, description, imageUrl,
  rewardType (treat|screen_time|book|activity|money|creative|custom),
  requiredAchievementId, isSurprise, expiresAt,
  status (pending_parent|locked|claimable|claimed|fulfilled|expired),
  claimedAt, fulfilledAt, createdAt

Redemption
  id, wishlistItemId, studentId, parentId, achievementId,
  status (claimed|acknowledged|pending_fulfilment|completed|overdue|rescheduled|withdrawn),
  fulfilmentDeadline (default: claim + 7 days), rescheduledDeadline, rescheduleReason,
  withdrawalReason, fulfilmentPhotoUrl, fulfilmentNote,
  kidConfirmed, kidConfirmedAt, claimedAt, acknowledgedAt, fulfilledAt, createdAt

KidNudge
  id, redemptionId, studentId, sentAt
```

---

## 13. Error States & UX

| Scenario | User Sees | Action |
|---|---|---|
| OCR fails completely | "We couldn't read your handwriting. Try retaking the photo with better lighting." + guided recapture tips | Retry upload |
| OCR low confidence | OCR text shown with highlighted uncertain words + "Please review and correct" | Manual correction editor |
| Marking times out | "Taking longer than usual. We'll notify you when ready." | Background processing + push notification |
| Upload fails mid-way | "Upload interrupted. X of Y images saved." + Resume button | Resume from last successful chunk |
| Recheck score differs significantly | "Our recheck found a different result. Here's a comparison." | Show both evaluations side-by-side |
| Rate limit (free tier) | "You've used 3/3 free submissions this month. Upgrade for unlimited." | Upgrade CTA |

---

## 14. KPI Instrumentation Plan

### 14.1 Core KPI Events
- topic_generated (source, essayType)
- assignment_created
- submission_uploaded
- ocr_completed (confidence)
- manual_correction_used
- evaluation_completed (score, band, confidence)
- rewrite_viewed
- rewrite_copied (if enabled)
- recheck_requested
- onboarding_demo_completed
- subscription_started (plan)
- subscription_renewed
- subscription_canceled (reason)
- achievement_unlocked (achievement_code, student_id)
- wishlist_item_added (student_id, reward_type)
- reward_claimed (student_id, item_id, achievement_code)
- reward_fulfilled (parent_id, redemption_id, days_to_fulfil)
- reward_fulfilled_late (parent_id, redemption_id, days_overdue)
- reward_rescheduled (parent_id, redemption_id)
- reward_withdrawn (parent_id, redemption_id, reason)
- kid_nudge_sent (student_id, redemption_id)
- kid_confirmed_receipt (student_id, redemption_id)
- promise_score_dropped (parent_id, new_score)
- streak_milestone (student_id, days)
- streak_broken (student_id, was_days)

### 14.2 KPI Formulas
- Monthly active students: unique students with evaluation_completed in month / active student base
- Avg submissions per student: total submission_uploaded / active students
- Score improvement (3 months): (latest 30-day avg - baseline 30-day avg) / baseline
- Free-to-paid conversion: subscriptions started / signups (by cohort, 30-day window)
- Renewal rate: renewals / subscriptions due
- NPS: promoter-detractor survey at day 45 and day 120

### 14.3 Operational Dashboards
- Funnel: topic → assignment → upload → OCR → evaluation → rewrite viewed
- Quality: OCR accuracy sample audits, human-marker agreement, feedback contradiction rate
- Reliability: latency percentiles, failure rates, recheck volumes

---

## 15. Risk Register (Owners, Triggers, Mitigations)

1. **OCR accuracy too low on poor photos**
   - Owner: ML Lead
   - Trigger: OCR confidence median <0.8 for 7 days
   - Mitigation: image-quality precheck, guided recapture UI, manual correction prominence

2. **Marking inconsistency vs teachers**
   - Owner: Assessment Lead
   - Trigger: exact band agreement <70% monthly
   - Mitigation: rubric prompt calibration, sampled human moderation, model rollback path

3. **Student over-reliance on rewrite**
   - Owner: Product Lead
   - Trigger: rewrite viewed rate high but score improvement flat for 2 cycles
   - Mitigation: reflection prompts, rationale-first reveal, optional rewrite delay mode

4. **Parent trust risk from incorrect feedback**
   - Owner: CX Lead
   - Trigger: complaint rate >2% of active paid accounts/month
   - Mitigation: recheck workflow, confidence transparency, escalation support queue

5. **Data privacy incident**
   - Owner: Security Lead
   - Trigger: unauthorized access alert or audit anomaly
   - Mitigation: strict RBAC tests, encryption, audit trails, incident playbook + notification workflow

6. **Slow feedback under load**
   - Owner: Platform Lead
   - Trigger: p95 >5 min for 3 consecutive days
   - Mitigation: queue autoscaling, job prioritization, OCR/model batching

7. **Low conversion from free to paid**
   - Owner: Growth Lead
   - Trigger: conversion <8% after 2 cohorts
   - Mitigation: paywall optimization, clearer value in analytics/rewrite, onboarding nudges

8. **Model/prompt drift degrading quality**
   - Owner: ML Lead
   - Trigger: benchmark scores drop >5% after model/prompt update
   - Mitigation: mandatory re-benchmark before deployment, version tracking, rollback capability

---

## 16. Phase Mapping (Updated)

### Phase 1 (MVP GA)
- Parent/student accounts + onboarding
- Topic generator (manual + auto) + topic bank
- Question generation + PDF export
- Upload + OCR + manual correction (with resilient upload)
- AI marking + feedback (situational + continuous writing rubrics)
- Rewrite + side-by-side comparison
- Basic parent analytics (30/90 day)
- Free/paid billing (Stripe)
- Notification preferences (email + web push)
- **Achievements** — practice, improvement, mastery, streak badges with progress bars
- **Wishlist** — kid adds items, parent sets achievement requirements, claim flow
- **Redemption tracking** — 7-day fulfilment deadline, escalating nudges, parent promise score
- **Kid confirmation** — "I got it!" receipt flow, trophy case

### Phase 2
- Tutor role + student management
- Custom rubrics
- Multi-student parent tools expansion
- Chinese full support
- WhatsApp notifications
- Community topic ratings
- A Level GP rubric support
- Surprise rewards (hidden until earned)
- Achievement sharing (shareable badge card image)
- Seasonal achievements (e.g. "PSLE Prep Marathon — 30 essays in September")
- Tutor-set achievements for their students
- Smart reward suggestions + photo proof memory wall
- Kid nudge system (gentle reminders)

### Phase 3
- School tenant model
- Batch processing and exports
- Procurement and institutional admin workflows
- PSLE composition rubric support
- Native mobile apps
- Class-level achievements (school tenant)
- School reward store integration
- Family reward budget tracker

---

## 17. Open Decisions to Confirm Before Build Start

1. ~~Final score scale: keep 30 or move to 50 for school familiarity~~ **→ Keep 30, aligned to MOE 1184**
2. Chinese in MVP: keep pilot-only or GA at launch
3. Reflection gate: mandatory for all students or configurable by parent
4. Pricing: confirm $14.90/month or adjust based on market research
5. News sources for auto topic generation: which SG outlets to scrape/license?
6. Calibration essay set: who scores them? Hire ex-MOE markers or partner with tuition centres?
