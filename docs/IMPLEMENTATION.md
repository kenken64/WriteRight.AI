# WriteRight — Implementation Documentation

> Last updated: 2025-02-15

---

## Table of Contents

1. [Password Reset (Forgot Password)](#1-password-reset-forgot-password)
2. [Reset Password (Token-Based)](#2-reset-password-token-based)
3. [Change Password](#3-change-password)
4. [Assignment Creation](#4-assignment-creation)
5. [AI Evaluate](#5-ai-evaluate)
6. [AI Rewrite](#6-ai-rewrite)
7. [AI Recheck](#7-ai-recheck)
8. [Topic Generation](#8-topic-generation)
9. [PDF Export](#9-pdf-export)
10. [Finalize / OCR + Auto-Evaluate](#10-finalize--ocr--auto-evaluate)
11. [OCR Text (Get/Edit)](#11-ocr-text-getedit)
12. [CSRF Exemptions for Auth Routes](#12-csrf-exemptions-for-auth-routes)
13. [DATA_DIR Persistent Storage Utility](#13-data_dir-persistent-storage-utility)
14. [Word Count Input Validation](#14-word-count-input-validation)
15. [User ID Audit Fixes (Submissions, Wishlist)](#15-user-id-audit-fixes-submissions-wishlist)
16. [Settings API](#16-settings-api)

---

## 1. Password Reset (Forgot Password)

**Endpoint:** `POST /api/v1/auth/forgot-password`

**Why custom?** Supabase's built-in password reset sends emails from their domain. We bypass this entirely by using **Resend API** to send branded emails with a custom token flow.

### Request
```json
{ "email": "user@example.com" }
```

### Response
```json
{ "message": "If an account exists, a reset link has been sent." }
```

Always returns success (200) to avoid leaking user existence.

### Internal Flow
1. Looks up user by email via `supabaseAdmin.auth.admin.listUsers()`
2. If not found → returns generic success (no leak)
3. Generates 32-byte random token with `crypto.randomBytes(32)`
4. Stores SHA-256 hash of token in `password_reset_tokens` table (raw token never stored)
5. Invalidates any existing tokens for this user (deletes old rows)
6. Token expires in **1 hour**
7. Builds reset URL: `{origin}/reset-password?token={rawToken}`
8. Sends styled HTML email via `Resend` SDK
9. Brand name and sender email are configurable via `NEXT_PUBLIC_APP_NAME` and `SENDER_EMAIL` env vars

### Database Table: `password_reset_tokens`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK to auth.users |
| token_hash | text | SHA-256 of raw token |
| expires_at | timestamptz | 1 hour from creation |
| used_at | timestamptz | Null until consumed |

---

## 2. Reset Password (Token-Based)

**Endpoint:** `POST /api/v1/auth/reset-password`

### Request
```json
{ "token": "abc123...", "password": "newSecurePassword" }
```

### Response (Success)
```json
{ "message": "Password updated successfully" }
```

### Response (Error)
```json
{ "error": "Invalid or expired reset link. Please request a new one." }
```

### Internal Flow
1. Validates token and password are present; password ≥ 8 chars
2. SHA-256 hashes the incoming token
3. Looks up matching row in `password_reset_tokens` where `used_at IS NULL` and `expires_at > now()`
4. If not found → 400 error
5. Updates user password via `supabaseAdmin.auth.admin.updateUserById()`
6. Marks token as used (`used_at = now()`)

---

## 3. Change Password

**Endpoint:** `POST /api/v1/auth/change-password`

Requires active session (authenticated user).

### Request
```json
{ "currentPassword": "old123", "newPassword": "new12345" }
```

### Response
```json
{ "message": "Password updated successfully" }
```

### Internal Flow
1. Gets current user from Supabase session
2. Verifies current password by calling `supabase.auth.signInWithPassword()` — if it fails, current password is wrong
3. Updates password via admin API: `supabaseAdmin.auth.admin.updateUserById()`
4. Password minimum: 8 characters

---

## 4. Assignment Creation

**Endpoint:** `POST /api/v1/assignments`

### Request
```json
{
  "student_id": "uuid (optional, defaults to current user)",
  "essay_type": "situational | continuous",
  "essay_sub_type": "letter | email | report | speech | proposal | narrative | expository | argumentative | descriptive",
  "prompt": "Write about...",
  "word_count_min": 300,
  "word_count_max": 500,
  "topic_id": "uuid (optional)",
  "guiding_points": ["point1", "point2"] 
}
```

### Response (201)
```json
{ "assignment": { "id": "...", ... } }
```

### Internal Flow
1. Authenticates user via Supabase session
2. Validates body against `createAssignmentSchema` (Zod)
3. **student_id fix:** If `student_id` is not provided, defaults to `user.id` (the authenticated user). This fixes the bug where assignments had null student_id.
4. Sets `language: "en"` (hardcoded for SG edition)
5. Inserts into `assignments` table

### GET Endpoint
`GET /api/v1/assignments?studentId=uuid` — lists assignments with joined topic data, ordered by created_at desc.

---

## 5. AI Evaluate

**Endpoint:** `POST /api/v1/submissions/{id}/evaluate`

### Request
No body required (uses submission's existing `ocr_text`).

### Response (201)
```json
{
  "evaluation": {
    "id": "...",
    "submission_id": "...",
    "essay_type": "continuous",
    "rubric_version": "v1",
    "model_id": "gpt-4o",
    "total_score": 22,
    "band": "B3",
    "dimension_scores": [...],
    "strengths": [...],
    "weaknesses": [...],
    "next_steps": [...],
    "confidence": 0.85,
    "review_recommended": false
  }
}
```

### Internal Flow
1. Fetches submission + joined assignment
2. Requires `ocr_text` to be present (400 if not)
3. Sets status to `evaluating`
4. Calls `evaluateEssay()` from `@writeright/ai` package with essay text, type, prompt, guiding points, level
5. Inserts result into `evaluations` table
6. Updates submission status to `evaluated` (or `failed` on error)

---

## 6. AI Rewrite

**Endpoint:** `POST /api/v1/submissions/{id}/rewrite`

### Request
```json
{ "mode": "exam_optimised | clarity_optimised" }
```
Mode defaults to `"exam_optimised"` if omitted.

### Response (201)
```json
{
  "rewrite": {
    "id": "...",
    "submission_id": "...",
    "mode": "exam_optimised",
    "rewritten_text": "...",
    "diff_payload": {...},
    "rationale": "...",
    "target_band": "B4"
  }
}
```

### GET `GET /api/v1/submissions/{id}/rewrite`
Returns all rewrites for a submission, ordered by created_at desc.

### Internal Flow
1. Fetches submission with joined assignment + evaluations
2. Requires `ocr_text` and at least one evaluation
3. Takes the latest evaluation, converts to `EvaluationResult` type
4. Calls `rewriteEssay()` from `@writeright/ai` with essay text, mode, evaluation, essay type, prompt
5. Inserts result into `rewrites` table

---

## 7. AI Recheck

**Endpoint:** `POST /api/v1/submissions/{id}/recheck`

### Request
No body required.

### Response (201)
```json
{
  "evaluation": { ... },
  "attempt": 2
}
```

### Internal Flow
1. Enforces **max 2 rechecks** (3 total evaluations per submission) — returns 429 if exceeded
2. Fetches submission + assignment
3. Re-runs `evaluateEssay()` with same parameters (natural AI variance produces different results)
4. Inserts new evaluation row
5. Returns attempt number in response

---

## 8. Topic Generation

**Endpoint:** `POST /api/v1/topics/generate`

### Request
```json
{
  "source": "upload | trending",
  "essayType": "situational | continuous",
  "level": "sec3 | sec4 | sec5 (optional, defaults to sec4)",
  "articleText": "string (required if source=upload)"
}
```

### Response (201)
```json
{
  "topic": {
    "id": "...",
    "source": "trending",
    "generated_prompts": [...],
    "essay_type": "continuous",
    ...
  }
}
```

### Internal Flow
1. Validates against `generateTopicRequestSchema`
2. Checks subscription plan usage limits (free: 5/month, paid: 50/month)
3. If `source=upload` → calls `generateFromArticle(articleText, essayType, level)`
4. If `source=trending` → calls `generateFromTrending(essayType, level)`
5. Inserts into `topics` table with generated prompts

---

## 9. PDF Export

**Endpoint:** `GET /api/v1/assignments/{id}/export-pdf`

### Response
Returns `text/html` with `Content-Disposition: inline` — designed to be printed to PDF via browser's Ctrl+P.

### Internal Flow
1. Fetches assignment with nested submissions → evaluations → rewrites
2. Takes the latest evaluation and latest rewrite
3. Builds a styled HTML report containing:
   - Assignment details (type, prompt, guiding points)
   - Student's essay (OCR text)
   - Evaluation: total score, band, dimension scores table, strengths, weaknesses, next steps
   - AI-rewritten version (if available)
4. Includes print-optimized CSS
5. All text is HTML-escaped for security

---

## 10. Finalize / OCR + Auto-Evaluate

**Endpoint:** `POST /api/v1/submissions/{id}/finalize`

### Request
No body required.

### Response (201)
```json
{
  "submission": { "id": "...", "ocr_text": "...", "status": "evaluated" },
  "evaluation": { ... }
}
```

### Internal Flow
1. Fetches submission + assignment
2. Requires `image_refs` to be present
3. Transitions status from `draft` → `processing` (uses optimistic lock with `.eq("status", "draft")` to prevent double-finalize — returns 409 on conflict)
4. **Step 1 — OCR:** If `ocr_text` is null, builds public URLs from Supabase storage, calls `extractTextFromImages()` from `@writeright/ai`, stores result
5. **Step 2 — Auto-evaluate:** Calls `evaluateEssay()` with the OCR text
6. Inserts evaluation, updates status to `evaluated`
7. On failure: sets status to `failed` with `failure_reason`

---

## 11. OCR Text (Get/Edit)

**Endpoint:** `GET /api/v1/submissions/{id}/ocr-text`

### Response
```json
{ "ocrText": "...", "confidence": 0.95, "status": "ocr_complete" }
```

**Endpoint:** `PUT /api/v1/submissions/{id}/ocr-text`

### Request
```json
{ "ocrText": "corrected text here", "confidence": 1.0 }
```

Allows students to manually correct OCR output before evaluation. Text is sanitized via `sanitizeInput()`.

---

## 12. CSRF Exemptions for Auth Routes

**File:** `src/lib/middleware/csrf.ts`

The CSRF middleware uses a **double-submit cookie pattern**:
- On GET requests: sets a `csrf-token` cookie (httpOnly=false so JS can read it)
- On POST/PUT/PATCH/DELETE: validates that `X-CSRF-Token` header matches the cookie value
- Cookie is `sameSite: strict`, `secure` in production

### Exempted Routes
| Path | Reason |
|---|---|
| `/api/v1/webhooks/stripe` | Verified by Stripe signature |
| `/auth/callback` | Supabase OAuth callback |
| `/api/auth/callback` | Supabase OAuth callback |
| `/api/v1/auth/*` | Login, register, logout, forgot-password, reset-password — these are unauthenticated or use their own verification |

Auth routes are exempted because users don't have a CSRF cookie before logging in.

---

## 13. DATA_DIR Persistent Storage Utility

**File:** `src/lib/storage/data-dir.ts`

### `getDataDir(...subPaths: string[]): string`
Returns and auto-creates a persistent data directory.
- **Railway:** Uses `DATA_DIR` env var (typically `/app/data` volume mount)
- **Local:** Falls back to `./data` relative to project root
- Automatically creates directory tree with `fs.mkdirSync({ recursive: true })`

### `getDataFilePath(...segments: string[]): string`
Returns a full file path within the data directory. Last segment is treated as the filename; preceding segments are subdirectories.

### Usage
```typescript
import { getDataDir, getDataFilePath } from '@/lib/storage/data-dir';

const uploadsDir = getDataDir('uploads', 'images');  // Creates ./data/uploads/images/
const logFile = getDataFilePath('logs', 'app.log');   // Returns ./data/logs/app.log
```

---

## 14. Word Count Input Validation

**File:** `src/lib/validators/schemas.ts`

The `newAssignmentFormSchema` enforces:
- `wordCountMin`: positive integer
- `wordCountMax`: positive integer
- **Refinement:** `wordCountMax >= wordCountMin` — otherwise Zod returns `"Max words must be greater than or equal to min words"` on the `wordCountMax` field

This is used both client-side (form validation) and server-side (`createAssignmentSchema` picks `word_count_min` and `word_count_max` from the assignment schema).

---

## 15. User ID Audit Fixes (Submissions, Wishlist)

### Submissions
**File:** `src/app/api/v1/submissions/route.ts`

The `POST` handler now sets `student_id: user.id` from the authenticated session, ensuring submissions are always attributed to the logged-in user rather than relying on client-provided data.

### Wishlist
**File:** `src/app/api/v1/wishlist/students/{studentId}/route.ts`

Uses `requireParentOrStudent()` RBAC middleware to verify the requesting user is either:
- The student themselves, or
- The student's linked parent

The `student_id` comes from the URL param (verified by RBAC), not from the request body. The `created_by` field tracks whether the item was created by `"student"` or `"parent"`.

### Login Audit
**File:** `src/app/api/v1/auth/login/route.ts`

All login attempts (success and failure) are recorded via `auditLog()`:
- Success: `actorId = user.id`, action = `login_success`
- Failure: `actorId = 'unknown'`, action = `login_failed`, includes email and error reason

---

## 16. Settings API

**Endpoint:** `GET /api/v1/settings`

### Response
```json
{
  "displayName": "John",
  "email": "john@example.com",
  "notificationPrefs": { "email": true, "push": true },
  "role": "student"
}
```

**Endpoint:** `PUT /api/v1/settings`

### Request
```json
{
  "displayName": "New Name",
  "notificationPrefs": { "email": false, "push": true }
}
```

### Internal Flow
- GET: Fetches from `users` table + auth metadata
- PUT: Validates with Zod schema, updates `users` table. Returns 400 if no fields provided, 422 on validation failure.
