# WriteRight SG — System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Parent App   │  │  Student App  │  │  Landing / Marketing     │  │
│  │  (Dashboard,  │  │  (Upload,     │  │  (SSR, SEO-optimised)    │  │
│  │   Rewards,    │  │   Feedback,   │  │                          │  │
│  │   Analytics)  │  │   Wishlist,   │  │                          │  │
│  │              │  │   Badges)     │  │                          │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘  │
│         │                 │                      │                  │
│         └────────────┬────┴──────────────────────┘                  │
│                      │                                              │
│              Next.js 14+ (App Router)                               │
│              Vercel Edge Network (SG)                                │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       │ HTTPS / REST + Realtime WebSocket
                       │
┌──────────────────────┴──────────────────────────────────────────────┐
│                         API LAYER                                    │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Next.js API Routes (Edge Runtime)                           │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐ ┌────────┐  │   │
│  │  │ Auth   │ │ Topics │ │ Submit │ │ Evaluate │ │ Rewards│  │   │
│  │  │ Router │ │ Router │ │ Router │ │ Router   │ │ Router │  │   │
│  │  └────────┘ └────────┘ └────────┘ └──────────┘ └────────┘  │   │
│  │  ┌────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────┐   │   │
│  │  │Billing │ │Analytics │ │ Wishlist   │ │ Redemption   │   │   │
│  │  │Router  │ │Router    │ │ Router     │ │ Router       │   │   │
│  │  └────────┘ └──────────┘ └────────────┘ └──────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Middleware: Auth (JWT) → Rate Limit → Validation (Zod) → RBAC     │
└──────────────┬──────────────────────────────┬───────────────────────┘
               │                              │
       ┌───────┴───────┐              ┌───────┴───────┐
       │  Supabase      │              │  Async Jobs    │
       │  (Data Layer)  │              │  (AI Pipeline) │
       │               │              │               │
       └───────┬───────┘              └───────┬───────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       DATA & SERVICES LAYER                          │
│                                                                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │
│  │  Postgres   │  │  Supabase  │  │  Supabase  │  │  Supabase    │  │
│  │  (RLS)      │  │  Storage   │  │  Auth      │  │  Realtime    │  │
│  │             │  │  (S3)      │  │  (JWT)     │  │  (WebSocket) │  │
│  └──────┬─────┘  └──────┬─────┘  └────────────┘  └──────────────┘  │
│         │               │                                           │
│  ┌──────┴──────────────┴──────────────────────────────────────┐    │
│  │                    AI PIPELINE                              │    │
│  │                                                            │    │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐ │    │
│  │  │ Image    │  │ Google Cloud │  │ Confidence Check     │ │    │
│  │  │ Quality  │  │ Vision OCR   │  │ >= 0.80 → proceed    │ │    │
│  │  │ Check    │──▶│              │──▶│ < 0.80 → manual fix │ │    │
│  │  └──────────┘  └──────────────┘  └──────────┬───────────┘ │    │
│  │                                              │             │    │
│  │  ┌──────────────────┐  ┌─────────────────────▼───────────┐│    │
│  │  │ Topic Generator  │  │ Marking Engine (GPT-4o)         ││    │
│  │  │ (GPT-4o/Claude)  │  │ ┌─────────────────────────────┐ ││    │
│  │  │                  │  │ │ Select rubric (sit/cont)     │ ││    │
│  │  │ ┌──────────────┐ │  │ │ Load versioned prompt       │ ││    │
│  │  │ │ Article OCR  │ │  │ │ Structured JSON output      │ ││    │
│  │  │ │ News Scraper │ │  │ │ Zod schema validation       │ ││    │
│  │  │ │ Prompt Gen   │ │  │ │ Store with version metadata │ ││    │
│  │  │ └──────────────┘ │  │ └─────────────────────────────┘ ││    │
│  │  └──────────────────┘  └─────────────────┬───────────────┘│    │
│  │                                          │                │    │
│  │                              ┌───────────▼─────────────┐  │    │
│  │                              │ Rewrite Engine (GPT-4o) │  │    │
│  │                              │ Target: 1 band above    │  │    │
│  │                              │ Diff + rationale output │  │    │
│  │                              └─────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐    │
│  │  Stripe        │  │  Resend        │  │  Sentry            │    │
│  │  (Billing)     │  │  (Email)       │  │  (Error Tracking)  │    │
│  └────────────────┘  └────────────────┘  └────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. Frontend (Next.js 14+ App Router)

```
apps/web/
├── app/
│   ├── (marketing)/           # Landing, pricing, about — SSR, public
│   │   ├── page.tsx           # Landing page
│   │   ├── pricing/
│   │   └── how-it-works/
│   │
│   ├── (auth)/                # Login, register, onboarding
│   │   ├── login/
│   │   ├── register/
│   │   └── onboarding/        # Interactive demo + first submission guide
│   │
│   ├── (dashboard)/           # Authenticated routes — parent & student
│   │   ├── layout.tsx         # Sidebar + nav, role-based rendering
│   │   │
│   │   ├── assignments/       # Topic generator, assignment list, PDF export
│   │   │   ├── page.tsx       # List view
│   │   │   ├── new/           # Create from topic bank or generate
│   │   │   └── [id]/          # Assignment detail
│   │   │
│   │   ├── submissions/       # Upload, OCR review, feedback
│   │   │   ├── page.tsx       # List view with status badges
│   │   │   ├── new/           # Multi-image upload with chunked resume
│   │   │   └── [id]/
│   │   │       ├── page.tsx   # Status + OCR review
│   │   │       ├── feedback/  # Score cards + detailed feedback
│   │   │       └── rewrite/   # Side-by-side diff view
│   │   │
│   │   ├── topics/            # Topic bank browse + generate
│   │   │   ├── page.tsx       # Browse/filter
│   │   │   └── generate/      # Upload article or auto-generate
│   │   │
│   │   ├── achievements/      # Badge wall, progress bars, streaks
│   │   │   └── page.tsx
│   │   │
│   │   ├── wishlist/          # Kid's wishlist + claim flow
│   │   │   └── page.tsx
│   │   │
│   │   ├── rewards/           # Parent: manage rewards, promise tracker
│   │   │   ├── page.tsx       # Pending + history
│   │   │   └── promise-score/ # Fulfilment stats
│   │   │
│   │   ├── analytics/         # Parent dashboard: trends, errors, progress
│   │   │   └── page.tsx
│   │   │
│   │   ├── settings/          # Profile, notifications, billing
│   │   │   └── page.tsx
│   │   │
│   │   └── trophy-case/       # Fulfilled rewards history
│   │       └── page.tsx
│   │
│   └── api/                   # API route handlers
│       └── v1/
│           ├── auth/
│           ├── topics/
│           ├── assignments/
│           ├── submissions/
│           ├── evaluate/
│           ├── rewrite/
│           ├── achievements/
│           ├── wishlist/
│           ├── redemptions/
│           ├── analytics/
│           ├── billing/
│           └── webhooks/      # Stripe webhooks
│
├── components/
│   ├── ui/                    # shadcn/ui base components
│   ├── upload/
│   │   ├── chunked-uploader.tsx   # tus.io resumable upload
│   │   ├── image-quality-check.tsx # Blur/lighting detection
│   │   └── page-reorder.tsx       # Drag-and-drop image ordering
│   ├── feedback/
│   │   ├── score-card.tsx         # Band + dimension display
│   │   ├── feedback-item.tsx      # Strength/weakness with quote
│   │   └── diff-view.tsx          # Side-by-side rewrite comparison
│   ├── achievements/
│   │   ├── badge-wall.tsx         # Grid of earned/locked badges
│   │   ├── progress-bar.tsx       # Achievement progress
│   │   ├── streak-counter.tsx     # 🔥 streak display
│   │   └── confetti.tsx           # Celebration animation
│   ├── rewards/
│   │   ├── wishlist-card.tsx      # Item with status + progress
│   │   ├── promise-tracker.tsx    # Parent fulfilment timeline
│   │   ├── trophy-card.tsx        # Fulfilled reward display
│   │   └── nudge-button.tsx       # Kid's gentle reminder
│   ├── onboarding/
│   │   ├── demo-marker.tsx        # Interactive marking demo
│   │   └── guided-tooltip.tsx     # First-submission guide
│   └── charts/
│       ├── score-trend.tsx        # Line chart over time
│       └── error-categories.tsx   # Top 5 error types
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser client
│   │   ├── server.ts          # Server component client
│   │   └── middleware.ts      # Auth middleware
│   ├── stripe/
│   │   ├── client.ts
│   │   └── webhooks.ts
│   ├── api/
│   │   └── client.ts          # Type-safe API client (TanStack Query)
│   ├── validators/
│   │   └── schemas.ts         # Zod schemas (shared with API)
│   └── utils/
│       ├── roles.ts           # RBAC helpers
│       └── format.ts          # Score/band formatting
│
└── middleware.ts               # Next.js middleware: auth redirect, rate limit
```

### 2. AI Pipeline Package

```
packages/ai/
├── ocr/
│   ├── vision-client.ts       # Google Cloud Vision API wrapper
│   ├── image-preprocess.ts    # Deskew, rotate, quality score
│   └── confidence.ts          # Token-level confidence extraction
│
├── marking/
│   ├── engine.ts              # Main marking orchestrator
│   ├── rubrics/
│   │   ├── situational.ts     # Situational writing rubric + prompt
│   │   └── continuous.ts      # Continuous writing rubric + prompt
│   ├── validator.ts           # Zod schema for marking output
│   └── benchmark.ts           # Run against calibration set
│
├── rewrite/
│   ├── engine.ts              # Rewrite orchestrator
│   ├── modes/
│   │   ├── exam-optimised.ts  # Maximise marks
│   │   └── clarity-optimised.ts # Improve readability
│   ├── diff.ts                # Generate diff payload
│   └── band-target.ts         # Calculate target band (current + 1)
│
├── topics/
│   ├── from-article.ts        # Extract themes → generate prompts
│   ├── from-trending.ts       # Scrape SG news → generate prompts
│   └── categoriser.ts         # Auto-categorise topics
│
├── prompts/
│   ├── v1/                    # Versioned prompt templates
│   │   ├── marking-sw-v1.ts   # Situational writing marking
│   │   ├── marking-cw-v1.ts   # Continuous writing marking
│   │   ├── rewrite-v1.ts
│   │   └── topic-gen-v1.ts
│   └── registry.ts            # Prompt version registry
│
├── achievements/
│   ├── engine.ts              # Check achievements after each evaluation
│   ├── rules.ts               # Achievement criteria definitions
│   └── streak.ts              # Streak calculation logic
│
└── shared/
    ├── openai-client.ts       # OpenAI SDK wrapper with retry
    ├── types.ts               # Shared TypeScript types
    └── errors.ts              # Custom error classes
```

### 3. Supabase Layer

```
supabase/
├── migrations/
│   ├── 001_users_and_auth.sql
│   ├── 002_topics_and_assignments.sql
│   ├── 003_submissions_and_ocr.sql
│   ├── 004_evaluations_and_rewrites.sql
│   ├── 005_achievements_and_streaks.sql
│   ├── 006_wishlist_and_redemptions.sql
│   ├── 007_subscriptions_and_billing.sql
│   ├── 008_audit_logs.sql
│   └── 009_rls_policies.sql
│
├── functions/
│   ├── process-submission/     # Edge function: OCR → Mark → Notify
│   │   └── index.ts
│   ├── check-achievements/     # Edge function: run after evaluation
│   │   └── index.ts
│   ├── redemption-nudges/      # Cron: check overdue redemptions, send nudges
│   │   └── index.ts
│   ├── trending-topics/        # Cron: weekly topic generation from news
│   │   └── index.ts
│   └── stripe-webhook/         # Handle Stripe events
│       └── index.ts
│
├── seed.sql                    # Test data + calibration essays
└── config.toml                 # Supabase project config
```

---

## Request Flows

### Flow 1: Essay Submission → Feedback

```
Student uploads images
    │
    ▼
[Next.js API] POST /v1/submissions
    │ → Create submission record (status: draft)
    │ → Return signed upload URLs
    │
    ▼
[Client] Chunked upload via tus.io → Supabase Storage
    │
    ▼
[Next.js API] POST /v1/submissions/{id}/finalize
    │ → Update status: processing
    │ → Enqueue job
    │
    ▼
[Edge Function: process-submission]
    │
    ├─ Step 1: Image Quality Check
    │   └─ Blur score, lighting, orientation → auto-fix or reject
    │
    ├─ Step 2: OCR (Google Cloud Vision)
    │   ├─ Extract text + per-token confidence
    │   ├─ Store ocrText + ocrConfidence
    │   └─ If confidence < 0.80 → status: ocr_complete, notify for manual correction
    │       else → proceed to Step 3
    │
    ├─ Step 3: Marking Engine (GPT-4o)
    │   ├─ Load rubric (situational vs continuous)
    │   ├─ Load versioned prompt template
    │   ├─ Call GPT-4o with structured JSON output
    │   ├─ Validate response with Zod schema
    │   ├─ Store evaluation with rubricVersion + modelId + promptVersion
    │   └─ Status: evaluated
    │
    ├─ Step 4: Check Achievements
    │   ├─ Run achievement engine against new evaluation
    │   ├─ Update streaks
    │   ├─ If new achievement → store + check wishlist claimability
    │   └─ Send achievement notification if earned
    │
    └─ Step 5: Notify
        ├─ Supabase Realtime → update UI live
        ├─ Email (Resend) if preference set
        └─ Push notification (web)

Total target: < 5 min (p95)
```

### Flow 2: Wishlist → Redemption → Fulfilment

```
Kid adds "Nintendo Switch game" to wishlist
    │
    ▼
[API] POST /v1/students/{id}/wishlist
    │ → Status: pending_parent
    │ → Notify parent
    │
    ▼
Parent sets requirement: "Band 4 Unlocked" achievement
    │
    ▼
[API] PUT /v1/wishlist/{id}
    │ → requiredAchievementId set
    │ → Status: locked
    │ → Kid sees progress bar
    │
    ▼
... Kid practices, submits essays, improves ...
    │
    ▼
[Achievement Engine] Band 4 unlocked!
    │ → student_achievements record created
    │ → Check wishlist: any items requiring this achievement?
    │ → Yes → Status: claimable
    │ → Notify kid: "You can now claim Nintendo Switch game! 🎉"
    │ → Notify parent: "Aiden unlocked Band 4!"
    │
    ▼
Kid taps "Claim!"
    │
    ▼
[API] POST /v1/wishlist/{id}/claim
    │ → Create redemption record
    │ → Status: claimed
    │ → fulfilmentDeadline: now + 7 days
    │ → Notify parent: "Aiden claimed Nintendo Switch game. Fulfil within 7 days."
    │
    ▼
[Cron: redemption-nudges] runs daily
    │ → Day 3: reminder
    │ → Day 5: warning
    │ → Day 7: overdue alert
    │ → Day 14: escalated reminder
    │
    ▼
Parent fulfils
    │
    ▼
[API] POST /v1/redemptions/{id}/fulfil
    │ → Status: completed (pending kid confirmation)
    │ → Optional: photo proof uploaded
    │ → Notify kid: "Your reward is ready!"
    │
    ▼
Kid confirms: "I got it! 🎉"
    │
    ▼
[API] POST /v1/redemptions/{id}/confirm
    │ → kidConfirmed: true
    │ → Move to trophy case
    │ → Update parent promise score
```

### Flow 3: Topic Generation

```
Mode A: From Article
    │
    ▼
Parent uploads newspaper clipping OR pastes text
    │
    ▼
[API] POST /v1/topics/generate { source: "upload", essayType, imageRefs/articleText }
    │
    ├─ If image → OCR pipeline → extract article text
    ├─ NLP theme extraction
    ├─ GPT-4o: generate 2-3 MOE-style prompts
    ├─ Include guiding points (situational) or suggested angles (continuous)
    └─ Store in topic bank
    │
    ▼
Return generated topics → Parent selects → Create assignment

---

Mode B: Auto (Trending)
    │
    ▼
[Cron: trending-topics] runs weekly
    │
    ├─ Scrape/RSS from CNA, Straits Times, TODAY
    ├─ Filter: age-appropriate, relevant categories
    ├─ GPT-4o: generate prompts per article
    ├─ Auto-categorise: Environment, Tech, Social, Education, Health
    ├─ Content moderation check
    └─ Store in topic bank
    │
    ▼
Student/Parent browses topic bank → Filter by category/type/level → Assign
```

---

## Infrastructure

### Deployment Architecture

```
                    ┌─────────────────┐
                    │   Cloudflare    │
                    │   DNS + WAF     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Vercel Edge   │
                    │   Network (SG)  │
                    │                 │
                    │  Next.js SSR    │
                    │  API Routes     │
                    │  Static Assets  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼──────┐ ┌────▼─────┐ ┌──────▼───────┐
     │  Supabase     │ │  OpenAI  │ │  Google      │
     │  (SG Region)  │ │  API     │ │  Cloud       │
     │               │ │          │ │  Vision      │
     │  - Postgres   │ │  GPT-4o  │ │              │
     │  - Auth       │ │          │ │  OCR         │
     │  - Storage    │ └──────────┘ └──────────────┘
     │  - Realtime   │
     │  - Edge Funcs │
     └──────┬────────┘
            │
     ┌──────▼────────┐
     │  Stripe       │
     │  (Billing)    │
     └───────────────┘
```

### Environment Configuration

```
# .env.local (example)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
OPENAI_MARKING_PROMPT_VERSION=sw-marking-v1

# Google Cloud Vision
GOOGLE_CLOUD_PROJECT_ID=writeright-sg
GOOGLE_CLOUD_CREDENTIALS=...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Resend (Email)
RESEND_API_KEY=re_...

# Sentry
SENTRY_DSN=https://...

# App
NEXT_PUBLIC_APP_URL=https://writeright.sg
```

---

## Security Architecture

### Authentication Flow

```
Register/Login
    │
    ▼
Supabase Auth (email/mobile + OTP)
    │ → JWT issued (contains: userId, role)
    │
    ▼
Next.js Middleware
    │ → Verify JWT on every request
    │ → Extract role (parent|student)
    │ → Apply route-level access control
    │
    ▼
API Route Handler
    │ → Supabase client with user context
    │ → RLS policies enforce data isolation
    │ → Parent can only see linked students' data
    │ → Student can only see own data
```

### Row-Level Security Matrix

| Table | Parent Access | Student Access |
|---|---|---|
| users | Own record | Own record |
| student_profiles | Linked students only | Own profile |
| assignments | Linked students' assignments | Own assignments |
| submissions | Linked students' submissions | Own submissions |
| evaluations | Linked students' evaluations | Own evaluations |
| achievements | Linked students' achievements | Own achievements |
| wishlist_items | Linked students' items (full CRUD) | Own items (read + add) |
| redemptions | Linked students' redemptions (manage) | Own redemptions (claim + confirm) |
| subscriptions | Own subscription | Read-only (plan status) |

### Rate Limiting

| Tier | Limit | Window |
|---|---|---|
| Free (unauthenticated) | 20 req | per minute |
| Free (authenticated) | 60 req | per minute |
| Paid | 120 req | per minute |
| AI endpoints (evaluate/rewrite) | 5 req | per minute |
| Upload | 10 req | per minute |

---

## Monitoring & Observability

### Dashboards

```
┌──────────────────────────────────────────────────┐
│  OPERATIONAL DASHBOARD (Vercel + Sentry)         │
│                                                  │
│  API Latency (p50/p95/p99)    Error Rate         │
│  ████████████░░░░ 120ms       ██░░░░░░░░ 0.3%   │
│                                                  │
│  Active Users (24h)           Submissions (24h)  │
│  ████████████████ 847         ████████░░░░ 234   │
│                                                  │
│  OCR Pipeline                 Marking Pipeline   │
│  Avg: 12s  Fail: 1.2%       Avg: 45s  Fail: 0% │
│                                                  │
│  Stripe MRR        Promise Score (avg)           │
│  $2,340            ████████████████ 84%          │
└──────────────────────────────────────────────────┘
```

### Alerts

| Alert | Condition | Channel |
|---|---|---|
| High error rate | > 5% 5xx in 5 min | Slack + email |
| OCR pipeline down | 3 consecutive failures | Slack + PagerDuty |
| Marking latency spike | p95 > 5 min for 15 min | Slack |
| Stripe webhook failure | 3 consecutive failures | Email |
| Database connection pool | > 80% utilised | Slack |
| Storage quota | > 80% of plan | Email |

---

## Scaling Strategy

### Phase 1 (0-1,000 users): Current Architecture
- Vercel serverless + Supabase managed
- Single region (SG)
- No caching layer needed
- Estimated cost: $250-300/mo

### Phase 2 (1,000-10,000 users): Optimise
- Add Redis cache (Upstash) for frequently accessed data (achievements, leaderless queries)
- Implement connection pooling (Supabase built-in via PgBouncer)
- Move AI pipeline to dedicated queue (Inngest or Trigger.dev) for better retry/monitoring
- Add CDN caching for topic bank
- Estimated cost: $800-1,200/mo

### Phase 3 (10,000+ users): Migrate Critical Paths
- Consider moving to AWS (ECS + Aurora) for school tenant isolation
- Dedicated AI inference queue with priority lanes
- Read replicas for analytics queries
- Multi-region if expanding beyond SG
- Estimated cost: $3,000-5,000/mo

---

## Development Workflow

```
Feature Branch
    │
    ▼
PR opened → GitHub Actions CI
    │ ├─ TypeScript type check
    │ ├─ ESLint + Prettier
    │ ├─ Vitest unit tests
    │ ├─ Supabase migration dry-run
    │ └─ Build check
    │
    ▼
Vercel Preview Deployment (auto)
    │ → Unique URL per PR
    │ → Connected to Supabase staging project
    │
    ▼
Code Review + QA on preview
    │
    ▼
Merge to main
    │
    ▼
Vercel Production Deployment (auto)
    │ → Supabase migrations applied
    │ → Sentry release tagged
    │
    ▼
Post-deploy smoke tests (Playwright)
```

### Branching Strategy

```
main ─────────────────────────────── production
  │
  ├── feat/topic-generator ──── PR → merge
  ├── feat/ocr-pipeline ─────── PR → merge
  ├── feat/achievements ──────── PR → merge
  ├── fix/upload-resume ──────── PR → merge
  └── chore/deps-update ──────── PR → merge
```

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Monolith vs microservices | **Monolith (Next.js)** | 12-week timeline, 1-2 devs, split later if needed |
| ORM | **Drizzle ORM** | Type-safe, lightweight, great Supabase/Postgres support |
| API style | **REST** | Simple, well-understood, cacheable. GraphQL is overkill for MVP |
| State management | **TanStack Query** | Server state is 90% of state; no need for Redux/Zustand |
| File upload | **tus.io protocol** | Resumable, handles poor connectivity, battle-tested |
| PDF generation | **react-pdf** | Client-side, no server cost, good enough for question sheets |
| AI structured output | **JSON mode + Zod** | Validate AI responses at runtime, catch hallucinations |
| Prompt versioning | **File-based in repo** | Git history = version history, simple to review changes |
| Cron jobs | **Supabase pg_cron + Edge Functions** | Built-in, no extra service for MVP |
| Email | **Resend** | Developer-friendly, React email templates, generous free tier |
