# Test Accounts

> These accounts are created by running the mock data scripts against your Supabase database.

## Setup

```bash
# ── WriteRight SG variant ──────────────────────────
# Create teacher + 3 students
node scripts/create-mock-teacher.mjs

# Create achievement tester student + parent
node scripts/create-mock-student.mjs

# ── Sharpener (International) variant ──────────────
# Create international teacher + 3 students
node scripts/create-mock-teacher-intl.mjs

# Create international achievement tester + parent
node scripts/create-mock-student-intl.mjs
```

---

## WriteRight SG Accounts

### Teacher

| Field | Value |
|---|---|
| Email | `teacher-tester@writeright.test` |
| Password | `WriteRight2026!` |
| Role | `parent` (parent_type: `school_teacher`) |
| Display name | Mrs. Chen |
| Class name | 3A English |
| Class code | *(generated on each run)* |

### Students (Teacher's Class)

All use password: **`WriteRight2026!`**

| Name | Email | Level |
|---|---|---|
| Alice Tan | `student-alice@writeright.test` | Sec 3 |
| Bob Lim | `student-bob@writeright.test` | Sec 3 |
| Carol Wong | `student-carol@writeright.test` | Sec 4 |

Each student has:
- 2 evaluated submissions (situational + technology topics)
- 1 open assignment (continuous writing)
- Linked to teacher via `parent_student_links`

### Achievement Tester (Student)

| Field | Value |
|---|---|
| Email | `achievement-tester@writeright.test` |
| Password | `WriteRight2026!` |
| Role | `student` |
| Display name | Achievement Tester |
| Level | Sec 4 |

This account has:
- 102 evaluated submissions
- All 17 achievements unlocked
- 35-day streak
- 5 fulfilled wishlist rewards (Trophy Case)
- Topics across 5 categories + continuous writing

### Parent

| Field | Value |
|---|---|
| Email | `parent-tester@writeright.test` |
| Password | `WriteRight2026!` |
| Role | `parent` (parent_type: `parent`) |
| Display name | Mock Parent |

Linked to the Achievement Tester student account.

---

## Sharpener (International) Accounts

### Teacher

| Field | Value |
|---|---|
| Email | `teacher-tester@sharpener.test` |
| Password | `Sharpener2026!` |
| Role | `parent` (parent_type: `school_teacher`) |
| Display name | Ms. Thompson |
| Class name | 10A English |
| Class code | *(generated on each run)* |

### Students (Teacher's Class)

All use password: **`Sharpener2026!`**

| Name | Email | Level |
|---|---|---|
| Emma Richardson | `student-emma@sharpener.test` | Year 9 |
| James Okonkwo | `student-james@sharpener.test` | Year 9 |
| Sarah Martinez | `student-sarah@sharpener.test` | Year 10 |

Each student has:
- 2 evaluated submissions (environment + technology topics)
- 1 open assignment (continuous writing)
- Linked to teacher via `parent_student_links`

### Achievement Tester (Student)

| Field | Value |
|---|---|
| Email | `achievement-tester@sharpener.test` |
| Password | `Sharpener2026!` |
| Role | `student` |
| Display name | Achievement Tester |
| Level | Year 10 |

This account has:
- 102 evaluated submissions
- All 17 achievements unlocked
- 35-day streak
- 5 fulfilled wishlist rewards (Trophy Case)
- Topics across 5 categories + continuous writing
- Rubric version: `intl-igcse-v1`

### Parent

| Field | Value |
|---|---|
| Email | `parent-tester@sharpener.test` |
| Password | `Sharpener2026!` |
| Role | `parent` (parent_type: `parent`) |
| Display name | Mock Parent |

Linked to the Achievement Tester student account.

---

## Notes

- The class code is randomly generated each time the teacher scripts run. Check the script output for the actual code.
- All scripts clean up previous mock data before creating new data, so they are safe to re-run.
- SG and International accounts use different email domains (`@writeright.test` vs `@sharpener.test`) and can coexist in the same database.
- All scripts read credentials from `apps/web/.env.local` (`NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`).
