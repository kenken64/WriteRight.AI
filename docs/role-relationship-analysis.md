# WriteRight SG — Role & Relationship Analysis

**Date:** 2025-07-26
**Status:** Pending PO consensus (Sebastian + SW L)
**No code changes until approved.**

---

## Context

Sebastian proposed two changes for WriteRight SG:
1. Add **Teacher** as 3rd role (tuition or school)
2. Add **Grading Feedback & Review System**

Kenneth asked Similancao to critically challenge both proposals and map out relationships.

---

## Current Model (2 Roles)

```
Parent/Guardian ──── 1:M ──── Student(s)
```

---

## Proposed Model (3 Roles) — Complexity Analysis

### Core Problem: Roles Aren't Mutually Exclusive

A single adult user can be:
- A **parent** of their own kids
- A **guardian** of someone else's kids (uncle, grandparent, helper)
- A **teacher** with many students
- **All of the above simultaneously**

---

## Relationship Scenarios

### Scenario 1: Teacher Who Is Also a Parent

```
Mrs Tan (User)
  ├── AS PARENT ──── Aiden (her son, Sec 3)
  ├── AS PARENT ──── Emily (her daughter, Sec 1)
  └── AS TEACHER ──── Class 3A (30 students)
        ├── Aiden (her own son!) ⚠️
        ├── Ryan, Sarah, ... 27 others
```

**Conflicts:**
- Does Mrs Tan see Aiden's essays as parent (full access) or teacher (grading only)?
- If Aiden submits, does it appear in both dashboards?
- Can she grade her own child? (Conflict of interest)
- Which notification settings apply?

### Scenario 2: Guardian ≠ Biological Parent

```
Uncle Ahmad (Guardian) ──── Zara (niece, parents overseas)
Mr Lee (Teacher) ──── Zara + 29 others
```

**Conflicts:**
- Guardian needs same access as parent (progress, payment, essay history)
- System can't assume "parent" = biological parent → use **Guardian** terminology
- Guardianship can change (custody, relatives rotating)

### Scenario 3: Tuition Teacher vs School Teacher

```
Ms Wong (Private tutor) ──── 8 students across 4 schools
Mr Lim (School teacher) ──── Class 4B, 35 students
```

**Conflicts:**
- School teacher expects class roster, bulk ops, curriculum rubrics
- Tuition teacher manages individually, may use different standards
- Same student could have BOTH — who sees what?

---

## The Overlap Matrix

| Scenario | Parent View | Teacher View | Conflict |
|----------|------------|-------------|----------|
| Teacher grades own child | Full essay + progress + billing | Grading + class analytics | Data boundary violation |
| Guardian views graded essay | Progress + feedback received | Grading + rubric | Clean if separated |
| Student has 2 teachers | Sees all feedback | Each sees only their own | Who owns progress narrative? |
| Teacher is guardian of non-bio child | Guardian access | Teacher access to same student | Two permission scopes, same user, same student |

---

## Recommended Data Model

### Option A: Single User, Multiple Roles ✅ (Recommended)

```
User
  ├── id, name, email, phone
  └── UserRoles[] (one user can hold multiple roles)

UserRole
  ├── role_type: GUARDIAN | TEACHER
  ├── context: school_id? | null (private tutor)

GuardianStudent (replaces ParentStudent)
  ├── guardian_id → User
  ├── student_id → User
  ├── relationship: PARENT | UNCLE | GRANDPARENT | GUARDIAN | OTHER
  ├── is_primary: boolean (for billing/notifications)

TeacherStudent
  ├── teacher_id → User
  ├── student_id → User
  ├── class_group: string (e.g. "3A")
  ├── teacher_type: SCHOOL | TUITION | PRIVATE
  └── active: boolean
```

### Overlap Rule

When user is BOTH guardian AND teacher of same student:
- **Guardian context:** Full access (essays, progress, billing, all teachers' feedback)
- **Teacher context:** Grading access only (essays submitted to them, their feedback, class analytics)
- UI shows **role switcher**: "Viewing as: Parent 👨‍👧 | Teacher 👩‍🏫"
- Don't exclude own child from class — **flag and scope**

---

## Permission Matrix

| Action | Guardian | Teacher (own class) | Teacher (own child in class) |
|--------|----------|-------------------|------------------------------|
| View essay | ✅ All essays | ✅ Submitted to them only | ✅ Teacher context only |
| View AI grading | ✅ All | ✅ Their class only | ✅ Teacher context |
| View progress/trends | ✅ Full history | ✅ Class-scoped | ⚠️ Teacher=class; Guardian=full |
| View billing | ✅ | ❌ | ❌ (Guardian view only) |
| Submit feedback on grading | ✅ As guardian | ✅ As teacher | ⚠️ Must pick role |
| View other teachers' feedback | ✅ (their child) | ❌ | ✅ Only as Guardian |
| Class analytics | ❌ | ✅ | ✅ As teacher |

---

## Sibling Sharing Analysis

### Why Siblings Might Share
- Older sibling's essay as reference/example for younger
- Parent wants to compare progress across kids

### Problems
- **Academic integrity** — younger copies older's graded work
- **Privacy** — older sibling may not consent (Sec 4 kid doesn't want Sec 1 sibling reading their essays)
- **Grading context** — different levels graded against different rubrics, apples vs oranges

### Recommended Model

```
FamilyUnit
  ├── family_id
  ├── primary_guardian_id (paying adult)
  └── students[] (all kids under this guardian)

EssayShare
  ├── essay_id
  ├── shared_by: student_id (owner)
  ├── shared_with: student_id (sibling)
  ├── permission: VIEW_ONLY
  └── requires_consent: boolean
```

**Recommendation:** Sharing is **opt-in per essay**, controlled by the student who wrote it. Guardian sees all kids' work via their dashboard already. Sibling-to-sibling is a separate, explicit action.

### Guardian Multi-Ownership Questions
- Can a student have **multiple guardians**? (Mum + Dad both want access) → Yes, use is_primary flag
- Can guardianship be **transferred**? (Divorce, custody) → Need active/inactive status
- Primary guardian concept needed for billing and notifications

---

## Grading Feedback & Review System (Proposed)

### Spec Summary
- Users (teachers/students/parents) rate AI grading: accuracy (5-star) + feedback quality (5-star)
- Category tags: too harsh, too lenient, helpful, missed errors, incorrect issues
- Optional text comment (500 chars max)
- Request human review (paid feature)
- Aggregated admin dashboard, anonymized feedback
- Compact widget on grading results page

### Critical Challenges
1. **Too early** — no significant user base yet; feedback from nobody
2. **5-star ratings are noisy** — students who got bad grades rate "too harsh"
3. **"Human review" paid feature** — who reviews? Qualified markers = ops burden = separate business model
4. **Anonymization fragile** — small class sizes (5-10) make anonymization trivially breakable
5. **Trust comes from quality, not widgets** — engineering effort better spent improving AI grading

### Recommendation
Ship core product → get 50+ users → then add feedback system. Premature for launch.

---

## Overall Recommendations

1. **Use "Guardian" not "Parent"** — covers all caretaker scenarios
2. **Role switcher is mandatory** for 3-role model
3. **Launch with Guardian + Student only** — add Teacher as Phase 2
4. **Tuition vs School teacher = property, not separate role**
5. **One student, multiple teachers** — design for it from day one
6. **Sibling sharing = opt-in per essay, student-controlled**
