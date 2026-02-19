# WriteRight SG — Tech Stack Proposal

## Guiding Principles
- **Ship fast** — 12-week MVP timeline, no over-engineering
- **SG-optimised** — low latency for SG users, PDPA compliant
- **Cost-efficient** — generous free tiers, pay-as-you-grow
- **Multi-user ready** — RBAC, row-level security from day 1

---

## Option A: Supabase Stack (Recommended for MVP)

Best for: fast shipping, built-in auth + RBAC, real-time capabilities

### Frontend
| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14+ (App Router)** | SSR for SEO (landing pages), RSC for dashboard perf |
| UI | **shadcn/ui + Tailwind** | Clean, accessible, fast to build |
| State | **TanStack Query** | Server state caching, optimistic updates |
| Upload | **tus.io client** | Chunked resumable uploads (critical for mobile on MRT) |
| PDF | **react-pdf** | Client-side PDF generation for question export |

### Backend
| Layer | Choice | Why |
|---|---|---|
| API | **Next.js API Routes + Supabase Edge Functions** | Colocated with frontend, edge-fast |
| Auth | **Supabase Auth** | Email/mobile login, magic links, OAuth, built-in |
| Database | **Supabase (Postgres)** | Row-level security (RLS) = parents only see their kids' data |
| Storage | **Supabase Storage** | S3-compatible, signed upload URLs, image transforms |
| Queue | **Supabase Edge Functions + pg_cron** | Lightweight job processing for OCR → marking pipeline |
| Realtime | **Supabase Realtime** | Live status updates ("Your essay is being marked...") |

### AI / ML Pipeline
| Layer | Choice | Why |
|---|---|---|
| OCR | **Google Cloud Vision API** | Best handwriting OCR accuracy, good for Asian scripts, Chinese-ready |
| Marking Engine | **OpenAI GPT-4o** | Best reasoning for rubric-based assessment, structured JSON output |
| Rewrite Engine | **OpenAI GPT-4o** | Same model, different prompt — consistency in language understanding |
| Topic Generator | **Claude 3.5 Sonnet or GPT-4o** | Creative prompt generation, cheaper for batch topic creation |
| Embeddings | **OpenAI text-embedding-3-small** | Topic similarity, duplicate detection |
| Orchestration | **LangChain or custom** | Prompt versioning, chain management, retry logic |

### Infrastructure
| Layer | Choice | Why |
|---|---|---|
| Hosting | **Vercel** | Next.js native, edge network, preview deployments |
| CDN | **Vercel Edge Network** | Auto, included |
| Region | **Singapore (sin1)** | Vercel + Supabase both support SG region |
| Monitoring | **Vercel Analytics + Sentry** | Performance + error tracking |
| Billing | **Stripe** | Cards, subscriptions, webhooks. PayNow via Stripe SG |
| Email | **Resend** | Transactional emails (feedback ready, weekly digest) |
| DNS | **Cloudflare** | DDoS protection, fast DNS |

### Cost Estimate (MVP, 0-1000 users)
| Service | Monthly Cost |
|---|---|
| Vercel Pro | $20 |
| Supabase Pro | $25 |
| Google Cloud Vision | ~$50 (1000 submissions × 3 images avg) |
| OpenAI GPT-4o | ~$150 (marking + rewrite, ~$0.10-0.15 per submission) |
| Stripe | 3.4% + $0.50 per transaction |
| Resend | Free tier (3000 emails/mo) |
| Sentry | Free tier |
| **Total** | **~$250-300/mo** |

---

## Option B: AWS Stack (If scaling is priority)

Better for: Phase 2/3 school tenants, high volume, full control

### Frontend
| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14+** | Same as Option A |
| Hosting | **AWS Amplify or Vercel** | Amplify if all-in on AWS |

### Backend
| Layer | Choice | Why |
|---|---|---|
| API | **Node.js + Fastify on ECS Fargate** | Containerised, auto-scaling |
| Auth | **AWS Cognito** | User pools, MFA, federation |
| Database | **RDS Postgres (Aurora Serverless v2)** | Auto-scales, pay-per-use |
| Storage | **S3** | Presigned URLs, lifecycle policies |
| Queue | **SQS + Lambda** | Scalable job processing, dead letter queues |
| Cache | **ElastiCache (Redis)** | Rate limiting, session cache |

### Cost Estimate (MVP)
| Service | Monthly Cost |
|---|---|
| ECS Fargate | ~$50 |
| Aurora Serverless | ~$30 |
| S3 | ~$5 |
| SQS + Lambda | ~$10 |
| Cognito | Free (first 50k MAU) |
| OpenAI + GCV | ~$200 |
| **Total** | **~$350-400/mo** |

---

## 🏆 Recommendation: Option A (Supabase Stack)

**Why:**
1. **Fastest to MVP** — Supabase gives you auth + DB + storage + realtime out of the box
2. **Row-level security** — parent/student data isolation is built into Postgres policies, not app code
3. **Cheapest to start** — ~$250/mo vs ~$400/mo
4. **SG region available** — both Vercel and Supabase have Singapore PoPs
5. **Migration path** — if you outgrow Supabase, it's just Postgres. Dump and move to RDS/Aurora anytime
6. **12-week timeline** — no time to set up ECS, Cognito, SQS. Supabase = skip the boilerplate

**When to switch to Option B:**
- >10,000 MAU
- School tenant model needs VPC isolation
- Compliance requires AWS GovCloud or specific certifications
- Need batch processing at scale (>1000 submissions/day)

---

## Database Schema (Supabase/Postgres)

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Core tables
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('parent', 'student')),
  email TEXT UNIQUE,
  mobile TEXT UNIQUE,
  display_name TEXT,
  notification_prefs JSONB DEFAULT '{"email": true, "push": true}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('sec3', 'sec4', 'sec5')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE parent_student_links (
  parent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (parent_id, student_id)
);

CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('upload', 'trending', 'manual')),
  source_text TEXT,
  source_image_refs TEXT[],
  category TEXT,
  essay_type TEXT NOT NULL CHECK (essay_type IN ('situational', 'continuous')),
  level TEXT,
  generated_prompts JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id),
  essay_type TEXT NOT NULL CHECK (essay_type IN ('situational', 'continuous')),
  essay_sub_type TEXT CHECK (essay_sub_type IN (
    'letter', 'email', 'report', 'speech', 'proposal',
    'narrative', 'expository', 'argumentative', 'descriptive'
  )),
  prompt TEXT NOT NULL,
  guiding_points JSONB,
  word_count_min INT,
  word_count_max INT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  image_refs TEXT[],
  ocr_text TEXT,
  ocr_confidence FLOAT,
  ocr_model_version TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'uploading', 'processing', 'ocr_complete',
    'evaluating', 'evaluated', 'failed'
  )),
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  essay_type TEXT NOT NULL,
  rubric_version TEXT NOT NULL,
  model_id TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  dimension_scores JSONB NOT NULL,
  total_score INT NOT NULL,
  band INT NOT NULL,
  strengths JSONB NOT NULL,
  weaknesses JSONB NOT NULL,
  next_steps JSONB NOT NULL,
  confidence FLOAT NOT NULL,
  review_recommended BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rewrites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('exam_optimised', 'clarity_optimised')),
  rewritten_text TEXT NOT NULL,
  diff_payload JSONB,
  rationale JSONB,
  target_band INT,
  model_id TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rechecks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id),
  original_evaluation_id UUID REFERENCES evaluations(id),
  new_evaluation_id UUID REFERENCES evaluations(id),
  score_delta INT,
  escalated BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'escalated')),
  requested_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'plus_monthly', 'plus_annual')),
  status TEXT DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies (examples)
CREATE POLICY "Parents see own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Parents see linked students"
  ON student_profiles FOR SELECT
  USING (
    id IN (
      SELECT student_id FROM parent_student_links
      WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Students see own submissions"
  ON submissions FOR SELECT
  USING (
    assignment_id IN (
      SELECT a.id FROM assignments a
      JOIN student_profiles sp ON a.student_id = sp.id
      WHERE sp.user_id = auth.uid()
    )
  );
```

---

## Project Structure

```
WriteRight-SG/
├── apps/
│   └── web/                    # Next.js app
│       ├── app/
│       │   ├── (auth)/         # Login, register
│       │   ├── (dashboard)/    # Parent/student dashboard
│       │   ├── assignments/    # Topic generator, assignment list
│       │   ├── submissions/    # Upload, OCR review, feedback view
│       │   ├── analytics/      # Progress charts
│       │   └── api/            # API routes
│       ├── components/
│       │   ├── ui/             # shadcn components
│       │   ├── upload/         # Chunked uploader
│       │   ├── feedback/       # Score cards, diff view
│       │   └── onboarding/     # Demo, tooltips
│       └── lib/
│           ├── supabase/       # Client + server clients
│           ├── stripe/         # Billing helpers
│           └── utils/
├── packages/
│   └── ai/                     # AI pipeline (shared)
│       ├── ocr/                # Google Cloud Vision wrapper
│       ├── marking/            # Rubric scoring prompts + chain
│       ├── rewrite/            # Rewrite prompts + chain
│       ├── topics/             # Topic generation
│       └── prompts/            # Versioned prompt templates
├── supabase/
│   ├── migrations/             # SQL migrations
│   ├── functions/              # Edge functions (async jobs)
│   └── seed.sql                # Test data + calibration essays
├── PRD.md
├── TECH_STACK.md
└── package.json
```

---

## Dev Tooling

| Tool | Purpose |
|---|---|
| **pnpm** | Package manager (workspace monorepo) |
| **Turborepo** | Monorepo build orchestration |
| **TypeScript** | End-to-end type safety |
| **Zod** | Runtime schema validation (API + AI responses) |
| **Vitest** | Unit tests |
| **Playwright** | E2E tests |
| **ESLint + Prettier** | Code quality |
| **GitHub Actions** | CI/CD → Vercel preview + production deploys |
| **Supabase CLI** | Local dev, migrations, type generation |

---

## AI Pipeline Detail

```
Upload Images
    ↓
[Image Quality Check] — blur/lighting/orientation
    ↓ (pass)
[Google Cloud Vision OCR] — returns text + confidence per token
    ↓
[OCR Confidence Check]
    ├── >= 0.80 → auto-proceed
    └── < 0.80 → prompt user for manual correction
    ↓
[Marking Engine]
    ├── Select rubric (situational vs continuous)
    ├── Load versioned prompt template
    ├── GPT-4o structured output (JSON mode)
    ├── Validate response against Zod schema
    └── Store with model_id + prompt_version + rubric_version
    ↓
[Feedback Ready] → notify user
    ↓ (on request)
[Rewrite Engine]
    ├── Input: original text + evaluation + essay type
    ├── Target: one band above current
    ├── Output: rewritten text + diff + rationale per change
    └── Validate word count envelope
```

---

## Security Checklist (MVP)

- [ ] Supabase RLS policies on ALL tables
- [ ] API rate limiting (free: 10 req/min, paid: 60 req/min)
- [ ] Signed upload URLs (expire in 15 min)
- [ ] Input sanitisation on OCR manual correction
- [ ] Stripe webhook signature verification
- [ ] CORS restricted to app domain
- [ ] CSP headers configured
- [ ] No PII in logs (mask email/mobile in Sentry)
- [ ] PDPA compliance: data export + deletion flows tested
- [ ] Penetration test before GA
