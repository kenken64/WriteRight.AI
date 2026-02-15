# COLLABORATION.md — Product Owner Working Guide

## Team & Roles

| Name | Role | Focus Area | Contact |
|------|------|-----------|---------|
| Kenneth | Lead Developer / Product Owner | Architecture, deployment, full-stack | WhatsApp |
| Sebastian | Product Owner | Product strategy, UX, feature validation | WhatsApp |
| SW L | Product Owner | Market research, content, QA | WhatsApp |

> Update this table as the team grows.

---

## Which Codebase?

We maintain **two separate products**. Always clarify which one you're working on.

| | **WriteRight SG** | **WriteRight AI (International)** |
|---|---|---|
| Repo | [WriteRight.SG](https://github.com/kenken64/WriteRight.SG) | [WriteRight-International](https://github.com/kenken64/WriteRight-International) |
| Live URL | [writerightweb-production.up.railway.app](https://writerightweb-production.up.railway.app/) | [writeright-international-production.up.railway.app](https://writeright-international-production.up.railway.app/) |
| Target Market | Singapore secondary schools | Global (Cambridge/IELTS, NYT standards) |
| Rubric | MOE 1184 Syllabus | NYT Writing Standards + Cambridge/IELTS |
| Locale | en-SG | en-GB |

**Rule:** When requesting a change, always specify **SG**, **International**, or **both**.

---

## Safety & Privacy

### Non-Negotiables

1. **No real student data in chat or commits** — never paste student essays, names, emails, or scores in group chat, issues, or commit messages
2. **Secrets stay in environment variables** — API keys (OpenAI, Stripe, Supabase) are NEVER committed to code. Use Railway environment variables or `.env.local` (which is `.gitignored`)
3. **No production database access in chat** — don't share connection strings, passwords, or database URLs in group conversations
4. **PDPA (SG) and GDPR (International) compliance** — user data collection must have consent, data deletion must be supported, analytics must be anonymised
5. **Stripe keys are environment-specific** — never mix test/production keys

### Data Handling

| Data Type | Where It Lives | Who Can Access |
|-----------|---------------|----------------|
| Student essays | Supabase (encrypted at rest) | App only (via RLS) |
| User accounts | Supabase Auth | App only |
| Payment data | Stripe (PCI compliant) | Stripe dashboard only |
| Analytics | Aggregated, anonymised | All product owners |
| API keys | Railway env vars / .env.local | Kenneth (infra lead) |

### If You Find a Security Issue

1. **Do NOT post it in the group chat**
2. DM Kenneth directly
3. If it's critical (data leak, auth bypass), take the service offline first, ask questions later

---

## Collaboration Workflow

### How We Communicate

- **Group chat (AI clawer)** — daily coordination, quick questions, feature discussions
- **GitHub Issues** — formal feature requests, bugs, tasks (tag with `sg`, `international`, or `both`)
- **GitHub PRs** — all code changes go through pull requests, no direct pushes to `main` (except hotfixes)

### Requesting Changes

Use this format in chat or GitHub Issues:

```
**Version:** SG / International / Both
**Type:** Feature / Bug / Content / Design
**Priority:** P0 (critical) / P1 (important) / P2 (nice to have)
**Description:** What you want changed
**Why:** User impact / business reason
```

Example:
> **Version:** International
> **Type:** Content
> **Priority:** P2
> **Description:** Update testimonials section with real beta tester quotes
> **Why:** Fake testimonials hurt credibility

### Decision Making

| Decision Type | Who Decides | Process |
|--------------|-------------|---------|
| Feature scope (SG) | Kenneth + Sebastian | Discuss in chat, Kenneth has final call |
| Feature scope (International) | All POs | Majority agreement |
| Technical architecture | Kenneth | Inform POs of trade-offs |
| Content & copy | Proposer drafts, others review | 24h to object, silence = approval |
| Pricing changes | All POs | Unanimous agreement required |
| Emergency fixes | Kenneth (or whoever is available) | Fix first, inform after |

### Branch Strategy

```
main          ← production (auto-deploys to Railway)
├── feat/*    ← new features
├── fix/*     ← bug fixes
└── content/* ← copy/documentation changes
```

- **Feature branches** → PR → review → merge to `main`
- **Hotfixes** → can go direct to `main` if urgent (notify team after)
- **Content changes** (docs, copy) → can be merged with 1 approval

---

## Working with Similancao (AI Assistant)

The AI assistant (Similancao 🦞) is available in the group chat and can:

- ✅ Make code changes across both repos
- ✅ Build, test, and push to GitHub
- ✅ Analyse features, write docs, review code
- ✅ Search the web for market research

**Important rules when asking Similancao:**
1. **Specify the version** — always say "SG", "International", or "both"
2. **One task at a time** — let it finish before requesting the next change
3. **Review before pushing** — for significant changes, ask to review the diff before pushing
4. **Don't share sensitive data** — Similancao has access to the codebase but treat group chat as semi-public

---

## Code Review Checklist

Before approving any PR:

- [ ] No hardcoded secrets or API keys
- [ ] No real student/user data in test files
- [ ] Changes match the correct version (SG vs International)
- [ ] Build passes (`npx turbo build`)
- [ ] Tests pass (`npx turbo test`)
- [ ] Mobile responsive (check on phone)
- [ ] Copy is appropriate for the target market

---

## Onboarding New Contributors

1. Add their number to the WhatsApp group
2. Add their GitHub username as a collaborator on the relevant repo(s)
3. Ask Kenneth to update Similancao's config if they need AI assistant access
4. Have them read this document
5. Start them with a small content or docs task to get familiar

---

## Conflict Resolution

Disagreements happen. Here's how we handle them:

1. **State your case with data** — not opinions, but user feedback, metrics, or research
2. **Time-box discussions** — 24h max. If no resolution, Kenneth breaks the tie
3. **Disagree and commit** — once decided, everyone supports the decision
4. **No changes to live products during disputes** — maintain status quo until resolved

---

## Review Schedule

This document should be reviewed and updated:
- When a new team member joins
- When we add a new product version
- Monthly, or when someone feels it's outdated

---

*Last updated: 2026-02-15 by Similancao 🦞*
