# WriteRight SG — Gamification & Rewards System

## Overview

A motivation loop that connects student effort → achievements → wishlists → parent rewards. Kids earn badges and unlock wishlist items through consistent practice and improvement — not just high scores.

---

## 1. Achievement System

### 1.1 Achievement Types

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
| Self-Corrector | Use manual OCR correction 5 times (shows diligence) | 🔍 |
| Reflective Writer | Complete reflection prompt before viewing rewrite 10 times | 🪞 |
| Topic Explorer | Complete essays across 5+ different topic categories | 🌍 |
| All-Rounder | Score Band 4+ in both Situational and Continuous writing | 🎓 |

### 1.2 Achievement Rules
- Achievements are **permanent** once earned (never revoked)
- Progress towards achievements shown as progress bars
- New achievement → celebratory animation + notification to parent
- Achievements visible on student's profile (shareable badge wall)
- **No leaderboards** — competition is against yourself, not others (pedagogy-first)

---

## 2. Kid's Wishlist

### 2.1 How It Works
1. Kid browses a wishlist and adds items they want
2. Each item is tagged with an **achievement requirement** (set by parent)
3. When the achievement is unlocked, the item becomes **claimable**
4. Parent gets notified → approves/fulfils the reward

### 2.2 Wishlist Item Types

#### 🎁 Custom Rewards (Parent-defined)
- Parent creates reward with description + optional image
- Examples: "Ice cream outing", "30 min extra screen time", "New book", "$10 pocket money"
- Parent sets which achievement(s) unlock it
- Most flexible — parents know their kids best

#### 🎮 Pre-built Reward Templates
- System provides suggestions parents can customize:
  - 🍦 Treat — "A special snack or dessert of your choice"
  - 🎮 Screen Time — "30 minutes bonus gaming/YouTube"
  - 📖 Book — "Pick any book you want"
  - 🏊 Activity — "Fun outing of your choice"
  - 💰 Money — "Pocket money bonus"
  - 🎨 Creative — "Art supplies / craft kit"

### 2.3 Wishlist Flow

```
Kid adds "Nintendo Switch game" to wishlist
    ↓
Parent sees wishlist request → sets requirement:
  "Unlock 'Band 4 Unlocked' achievement"
    ↓
Kid sees: "🎮 Nintendo Switch game — Reach Band 4 to unlock!"
    ↓
Kid practices, improves, reaches Band 4
    ↓
Achievement unlocked! 🏆
    ↓
Wishlist item becomes CLAIMABLE
    ↓
Parent gets notification: "Aiden unlocked Band 4! 
  He can now claim: Nintendo Switch game"
    ↓
Parent approves → Kid sees "CLAIMED! 🎉"
    ↓
Parent fulfils reward IRL
```

### 2.4 Wishlist Rules
- Kids can add up to 10 wishlist items
- Parents must approve + set achievement requirement for each item
- Parents can also surprise-add rewards the kid doesn't know about (hidden until earned)
- Items can have expiry dates (optional — "valid this school term only")
- Claimed items move to a "Trophy Case" history

---

## 3. Parent Reward Dashboard

### 3.1 Features
- **Wishlist Manager** — view kid's wishes, set/modify achievement requirements
- **Achievement Timeline** — see all earned achievements with dates
- **Pending Rewards** — items ready to be claimed/fulfilled
- **Reward History** — past rewards given
- **Quick Reward** — parent can give a spontaneous reward for good effort (not tied to achievement)
- **Milestone Alerts** — "Aiden is 1 submission away from 'Dedicated Writer'!"

### 3.2 Notifications to Parent
| Event | Notification |
|---|---|
| New achievement earned | "🏆 Aiden just earned 'Band Breaker'! He moved up to Band 4." |
| Wishlist item claimable | "🎁 Aiden can now claim 'Nintendo Switch game' — approve?" |
| Near milestone | "📈 Aiden is 2 submissions away from 'Writing Machine'!" |
| Streak at risk | "🔥 Aiden's 7-day streak ends tomorrow — remind him to submit!" |
| Comeback opportunity | "💪 Aiden hasn't submitted in 2 weeks. Encourage a comeback?" |

---

## 4. Student Experience

### 4.1 Achievement Page
- Badge wall showing all earned achievements (colorful, fun)
- Greyed-out badges for locked achievements with progress bars
- "Next achievement" spotlight — shows closest achievement to unlock
- Confetti/animation on new achievement

### 4.2 Wishlist Page
- Kid's wishlist with status per item:
  - 🔒 **Locked** — "Reach Band 4 to unlock" + progress bar
  - 🔓 **Unlockable** — achievement earned, waiting for parent approval
  - ✅ **Claimed** — in the trophy case
- "Add to Wishlist" button — kid types what they want, parent reviews

### 4.3 Motivation Nudges
- After each submission: "You're 3 submissions away from 'Dedicated Writer'!"
- After score improvement: "Your score went up 4 marks! Keep going for 'Levelling Up'!"
- After streak milestone: "🔥 5-day streak! 2 more days for the 7-day badge!"

---

## 5. Data Model Additions

```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,        -- e.g. 'band_4_unlocked'
  name TEXT NOT NULL,               -- e.g. 'Band Breaker'
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('practice', 'improvement', 'mastery', 'streak', 'special')),
  badge_emoji TEXT NOT NULL,
  criteria JSONB NOT NULL,          -- machine-readable unlock conditions
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE student_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id),
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  submission_id UUID REFERENCES submissions(id),  -- which submission triggered it
  UNIQUE (student_id, achievement_id)
);

CREATE TABLE student_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_submission_date DATE,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE achievement_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id),
  current_value INT DEFAULT 0,      -- e.g. submissions count, streak days
  target_value INT NOT NULL,        -- e.g. 20 for 'Dedicated Writer'
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (student_id, achievement_id)
);

CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL CHECK (created_by IN ('student', 'parent')),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  reward_type TEXT CHECK (reward_type IN ('treat', 'screen_time', 'book', 'activity', 'money', 'creative', 'custom')),
  required_achievement_id UUID REFERENCES achievements(id),
  status TEXT DEFAULT 'pending_parent' CHECK (status IN (
    'pending_parent',   -- kid added, parent hasn't set requirement yet
    'locked',           -- parent set requirement, not yet earned
    'claimable',        -- achievement earned, ready to claim
    'claimed',          -- kid claimed, parent notified
    'fulfilled',        -- parent confirmed fulfilled
    'expired'           -- past expiry date
  )),
  is_surprise BOOLEAN DEFAULT false,  -- hidden from kid until claimable
  expires_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Students see own achievements + own wishlist
-- Parents see linked students' achievements + manage wishlist
CREATE POLICY "Students see own achievements"
  ON student_achievements FOR SELECT
  USING (student_id IN (
    SELECT id FROM student_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Parents see linked student achievements"
  ON student_achievements FOR SELECT
  USING (student_id IN (
    SELECT student_id FROM parent_student_links WHERE parent_id = auth.uid()
  ));

CREATE POLICY "Parents manage wishlist"
  ON wishlist_items FOR ALL
  USING (student_id IN (
    SELECT student_id FROM parent_student_links WHERE parent_id = auth.uid()
  ));
```

---

## 6. API Additions

```
# Achievements
GET  /v1/students/{studentId}/achievements          # all earned + progress
GET  /v1/students/{studentId}/achievements/next      # closest to unlock
GET  /v1/students/{studentId}/streaks                # current + longest

# Wishlist
GET  /v1/students/{studentId}/wishlist               # all items + status
POST /v1/students/{studentId}/wishlist               # kid adds item
PUT  /v1/wishlist/{itemId}                           # parent sets requirement
POST /v1/wishlist/{itemId}/claim                     # kid claims
POST /v1/wishlist/{itemId}/fulfil                    # parent confirms

# Parent rewards dashboard
GET  /v1/parents/{parentId}/rewards/pending          # items ready to fulfil
GET  /v1/parents/{parentId}/rewards/history          # past rewards
POST /v1/parents/{parentId}/rewards/quick            # spontaneous reward
```

---

## 7. KPI Events (New)

```
achievement_unlocked (achievement_code, student_id)
wishlist_item_added (student_id, reward_type)
wishlist_item_claimed (student_id, item_id)
wishlist_item_fulfilled (parent_id, item_id)
streak_milestone (student_id, days)
streak_broken (student_id, was_days)
motivation_nudge_shown (student_id, nudge_type)
```

---

## 8. Prize Redemption & Parent Promise Tracking

### 8.1 The Problem
Kids earn rewards but parents forget, delay, or don't follow through. Trust breaks → motivation dies. The system must **hold parents accountable** to their promises.

### 8.2 Redemption Flow

```
Kid earns achievement → Wishlist item becomes CLAIMABLE
    ↓
Kid taps "Claim!" → Status: CLAIMED
    ↓
Parent gets notification: "Aiden earned Band 4! Time to deliver: Nintendo Switch game"
    ↓
Parent has 7 days to mark as FULFILLED
    ↓
If fulfilled → Kid confirms receipt → Status: COMPLETED ✅
If NOT fulfilled in 7 days → Escalation nudges begin
```

### 8.3 Promise Tracking States

| Status | Description | Visible To |
|---|---|---|
| 🔒 Locked | Achievement not yet earned | Kid (with progress bar) |
| 🔓 Claimable | Achievement earned, kid can claim | Kid + Parent |
| 📋 Claimed | Kid claimed, waiting for parent | Kid + Parent |
| ⏳ Pending Fulfilment | Parent acknowledged, in progress | Kid + Parent |
| ✅ Completed | Parent fulfilled, kid confirmed | Both (trophy case) |
| ⚠️ Overdue | Past fulfilment deadline | Both |
| ❌ Withdrawn | Parent cancelled (with reason) | Both |

### 8.4 Parent Accountability Nudges

| Day After Claim | Action |
|---|---|
| Day 0 | "🎁 Aiden claimed 'Nintendo Switch game'! Fulfil within 7 days." |
| Day 3 | "⏰ Reminder: Aiden is waiting for 'Nintendo Switch game' — 4 days left" |
| Day 5 | "⚠️ 2 days left to fulfil Aiden's reward. Keep the promise!" |
| Day 7 | "🚨 'Nintendo Switch game' is now overdue. Aiden can see this." |
| Day 14 | "❗ Aiden's reward has been overdue for a week. This affects motivation." |

### 8.5 Kid-Side Visibility
- Kid sees a **Promise Tracker** on their wishlist:
  - "Dad promised: Nintendo Switch game 🎮"
  - "Status: Claimed 3 days ago ⏳"
  - Progress bar showing days until expected fulfilment
- After fulfilment: kid taps "I got it! 🎉" to confirm → moves to trophy case
- If overdue: item shows ⚠️ but **no shaming language** — just "Still waiting..."
- Kid can send a gentle nudge (1 per day max): "Hey, just a reminder about my reward! 😊"

### 8.6 Parent Promise Score (Internal)
- Track parent fulfilment rate: `fulfilled_on_time / total_claimed`
- **Not shown to kid** — this is for the parent's own dashboard
- Parent sees: "Your Promise Score: 87% ✅ (7 of 8 fulfilled on time)"
- Low promise score triggers gentle coaching:
  - < 70%: "Tip: Set rewards you can realistically deliver. Smaller, frequent rewards work better than big rare ones."
  - < 50%: "Your child may lose motivation if rewards aren't fulfilled. Consider adjusting your reward sizes."

### 8.7 Fulfilment Options
- **Mark as fulfilled** — parent taps confirm, optional photo proof (fun!)
- **Partial fulfilment** — "We did something similar" + note
- **Reschedule** — "Will fulfil by [date]" with new deadline + reason shown to kid
- **Withdraw** — cancel reward with mandatory reason (kid sees reason)
  - "Decided to change the reward" / "Budget constraints" / "Custom reason"
  - Kid gets: "Reward updated: Dad changed 'Nintendo Switch game'. Reason: Let's pick something together!"
  - **Withdrawn rewards don't delete the earned achievement** — kid keeps the badge

### 8.8 Reward History & Trophy Case
- All fulfilled rewards live in kid's **Trophy Case**
- Shows: reward name, achievement that earned it, date fulfilled, optional parent photo
- Parent sees full history:
  - Total rewards given
  - Total value (if monetary amounts tagged)
  - Fulfilment timeline
  - Monthly reward spend trend

### 8.9 Smart Reward Suggestions for Parents
Based on kid's progress, suggest appropriate rewards:
- "Aiden is 2 submissions from 'Dedicated Writer'. Past rewards at this level: treat, screen time."
- "This is a major milestone (Band 4)! Other parents typically set higher-value rewards here."
- Suggest reward tiers:
  - **Small** (practice milestones): Treats, screen time, small toys ($0-10)
  - **Medium** (improvement milestones): Books, outings, activities ($10-30)
  - **Large** (mastery milestones): Big items, experiences ($30+)

### 8.10 Data Model Additions

```sql
CREATE TABLE redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_item_id UUID REFERENCES wishlist_items(id) ON DELETE CASCADE,
  student_id UUID REFERENCES student_profiles(id),
  parent_id UUID REFERENCES users(id),
  achievement_id UUID REFERENCES achievements(id),
  status TEXT NOT NULL DEFAULT 'claimed' CHECK (status IN (
    'claimed',              -- kid claimed
    'acknowledged',         -- parent saw it
    'pending_fulfilment',   -- parent committed to fulfil
    'completed',            -- parent fulfilled + kid confirmed
    'overdue',              -- past deadline
    'rescheduled',          -- parent set new deadline
    'withdrawn'             -- parent cancelled
  )),
  fulfilment_deadline TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  rescheduled_deadline TIMESTAMPTZ,
  reschedule_reason TEXT,
  withdrawal_reason TEXT,
  fulfilment_photo_url TEXT,
  fulfilment_note TEXT,
  kid_confirmed BOOLEAN DEFAULT false,
  kid_confirmed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE kid_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  redemption_id UUID REFERENCES redemptions(id),
  student_id UUID REFERENCES student_profiles(id),
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- Track parent promise score
CREATE VIEW parent_promise_stats AS
SELECT
  parent_id,
  COUNT(*) FILTER (WHERE status = 'completed') AS fulfilled,
  COUNT(*) FILTER (WHERE status = 'completed' AND fulfilled_at <= fulfilment_deadline) AS fulfilled_on_time,
  COUNT(*) FILTER (WHERE status = 'overdue') AS overdue,
  COUNT(*) FILTER (WHERE status = 'withdrawn') AS withdrawn,
  COUNT(*) AS total,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'completed' AND fulfilled_at <= fulfilment_deadline)::numeric
    / NULLIF(COUNT(*) FILTER (WHERE status IN ('completed', 'overdue')), 0) * 100
  ) AS promise_score
FROM redemptions
GROUP BY parent_id;
```

### 8.11 API Additions

```
# Redemptions
POST /v1/wishlist/{itemId}/claim                    # kid claims
POST /v1/redemptions/{id}/acknowledge               # parent saw it
POST /v1/redemptions/{id}/fulfil                    # parent fulfils { note?, photoUrl? }
POST /v1/redemptions/{id}/reschedule                # { newDeadline, reason }
POST /v1/redemptions/{id}/withdraw                  # { reason }
POST /v1/redemptions/{id}/confirm                   # kid confirms receipt
POST /v1/redemptions/{id}/nudge                     # kid sends gentle reminder

# Parent stats
GET  /v1/parents/{parentId}/promise-score           # fulfilment stats
GET  /v1/parents/{parentId}/redemptions?status=     # filter by status
GET  /v1/parents/{parentId}/reward-suggestions      # smart suggestions based on kid progress
```

### 8.12 KPI Events (New)

```
reward_claimed (student_id, item_id, achievement_code)
reward_acknowledged (parent_id, redemption_id)
reward_fulfilled (parent_id, redemption_id, days_to_fulfil)
reward_fulfilled_late (parent_id, redemption_id, days_overdue)
reward_rescheduled (parent_id, redemption_id)
reward_withdrawn (parent_id, redemption_id, reason)
kid_nudge_sent (student_id, redemption_id)
kid_confirmed_receipt (student_id, redemption_id)
promise_score_dropped (parent_id, new_score)
```

---

## 9. Phase Mapping

### Phase 1 (MVP)
- Core achievements (practice + improvement + mastery + streak)
- Achievement page with badge wall + progress bars
- Basic wishlist (kid adds → parent sets requirement → claim flow)
- Full redemption tracking with parent accountability nudges
- Parent promise score on dashboard
- Kid confirmation flow ("I got it!")
- Parent notifications for achievements + claimable rewards + overdue alerts

### Phase 2
- Surprise rewards (hidden until earned)
- Achievement sharing (shareable badge card image)
- Seasonal achievements (e.g. "PSLE Prep Marathon — 30 essays in September")
- Tutor-set achievements for their students
- Smart reward suggestions based on milestone tiers
- Photo proof of fulfilment (fun memory wall)
- Kid nudge system (gentle reminders)

### Phase 3
- Class-level achievements (school tenant)
- School reward store integration
- Achievement analytics for teachers (which students are engaged)
- Family reward budget tracker
