# WriteRight SG — Built-in Essay Editor with AI Writing Assistant

## Overview

A rich text essay editor where students write directly in the app, with a real-time AI assistant that coaches them as they write — like having a tutor sitting beside them.

**Key principle:** The AI helps the student write better, it does NOT write for them.

---

## 1. Essay Editor

### 1.1 Editor Features
- **Rich text editor** built on Tiptap (headless, extensible, built for React)
- Word count (live, with min/max target from assignment)
- Paragraph count
- Timer (optional — exam simulation mode with countdown)
- Auto-save every 30 seconds to Supabase
- Draft versioning — student can see previous drafts
- Fullscreen / distraction-free mode
- Print preview (matches exam paper formatting)

### 1.2 Editor Toolbar
- Bold, italic, underline
- Paragraph breaks
- Undo / redo
- Word count display: "234 / 300-400 words"
- Timer toggle: "25:00 remaining" (exam mode)
- AI Assistant toggle: ON/OFF
- Submit for grading button

### 1.3 Writing Modes

| Mode | Timer | AI Assistant | Use Case |
|---|---|---|---|
| **Practice** | Off | Full assistance | Learning & improving |
| **Timed Practice** | Configurable (30/45/60 min) | Limited hints | Exam prep |
| **Exam Simulation** | Strict (matches O Level timing) | OFF | Mock exam |

---

## 2. AI Writing Assistant

### 2.1 How It Works

The AI assistant lives in a **side panel** next to the editor. It observes what the student is writing and offers contextual help — but only when asked or at natural pause points.

```
┌─────────────────────────────────┬──────────────────────────┐
│                                 │  🤖 AI Writing Coach     │
│  Essay Editor                   │                          │
│                                 │  💡 Suggestion:          │
│  Dear Principal,                │  Your opening is good!   │
│                                 │  Consider adding a hook  │
│  I am writing to express my     │  — a question or         │
│  concern about food waste in    │  surprising fact to grab │
│  our school canteen...          │  attention.              │
│                                 │                          │
│                                 │  Example: "Did you know  │
│                                 │  our canteen throws away │
│                                 │  50kg of food daily?"    │
│                                 │                          │
│  █                              │  ─────────────────────── │
│                                 │  📝 Ask me anything:     │
│                                 │  [How do I end this...] │
│                                 │  [Send]                  │
│                                 │                          │
│  Words: 45 / 300-400           │  Suggestions: 2/10 used  │
│  ⏱️ 28:30 remaining            │                          │
└─────────────────────────────────┴──────────────────────────┘
```

### 2.2 Real-Time Live Scoring

As the student writes, the AI continuously estimates their current score and band — updated after every paragraph or significant edit.

#### Live Score Panel (Always Visible)
```
┌──────────────────────────────┐
│  📊 Live Score Estimate       │
│                              │
│  Current Band: 3 ██████░░░░ │
│  Est. Score:   17/30         │
│                              │
│  Task Fulfilment:  6/10  ██████░░░░  │
│  ├ Points covered: 2/3       │
│  ├ Audience awareness: ✅     │
│  └ Given info used: ⚠️ Partial│
│                              │
│  Language:         11/20 █████░░░░░  │
│  ├ Organisation: Good         │
│  ├ Vocabulary: Average        │
│  ├ Grammar: 3 errors found    │
│  └ Expression: Needs variety  │
│                              │
│  💡 To reach Band 4 (+4 marks):     │
│  • Address the 3rd point     │
│  • Fix grammar errors        │
│  • Use more varied vocab     │
└──────────────────────────────┘
```

#### How It Works
- **After every paragraph** (detected by double-Enter), the AI re-evaluates the entire essay
- **Dimension breakdown** shows exactly where marks are being gained/lost
- **"To reach next band"** — actionable tips to improve score RIGHT NOW
- **Score history within session** — student sees their score climbing as they improve
- Uses **GPT-4o-mini** for speed (<3 seconds per evaluation)
- Score updates are **non-blocking** — student keeps writing while score refreshes in background

#### Score Progression Sparkline
A mini chart showing how the score changed during the writing session:
```
Score: 8 → 12 → 14 → 17 → 19  📈 Trending up!
       ·    ·    ·    ·    ·
       ─────────────────────
       P1   P2   P3   P4   P5
```

#### Dimension-Specific Feedback (Live)
Each dimension shows real-time status:

**Task Fulfilment (Situational Writing):**
- ✅ Point 1: Addressed (quote detected)
- ✅ Point 2: Addressed (quote detected)  
- 🔲 Point 3: Not yet addressed
- ✅ Purpose: Clear
- ⚠️ Audience: Partially addressed — "tone is slightly too casual for a formal letter"
- ⚠️ Given info: Only 1 of 3 data points used

**Language:**
- Organisation: "3 paragraphs, logical flow ✅"
- Grammar: "3 errors detected (hover to see)"
- Vocabulary: "Band 3 level — 2 ambitious words used, aim for 5+"
- Expression: "Sentence variety: low — 8 of 10 sentences start with subject"

#### Guardrails
- Live score is labelled as **"Estimate"** — not a guarantee
- Score only shown in Practice and Timed modes, NOT in Exam Simulation
- Student can minimise/hide the score panel if it causes anxiety
- Parent setting: option to disable live scoring for students who find it stressful

---

### 2.3 AI Assistance Types

#### 🔍 Passive Analysis (Always On, Background)
Runs silently as student writes. No interruptions — results available when student looks at the panel.

| Feature | What It Does |
|---|---|
| Structure tracker | Shows essay structure: Intro ✅ → Body 1 ✅ → Body 2 🔲 → Conclusion 🔲 |
| Tone checker | "Your tone is: Formal ✅" or "⚠️ This sounds too casual for a formal letter" |
| Word count pacing | "You're 60% through your word limit but only covered 1 of 3 points" |
| Repetition detector | "You've used 'important' 4 times. Try: crucial, significant, vital" |
| Grammar highlights | Underline grammar issues in real-time (wavy red line, like Word) |

#### 💡 Smart Suggestions (Triggered at Pause Points)
When student pauses for 15+ seconds or finishes a paragraph:

| Trigger | Suggestion Type |
|---|---|
| After opening paragraph | "Good hook! Now transition to your first point." or "Your opening could be stronger — try a rhetorical question." |
| Mid-essay, off-topic drift | "You started talking about food waste but this paragraph is about plastic. Refocus?" |
| Weak vocabulary detected | "Instead of 'very big problem', try 'significant issue' or 'pressing concern'" |
| Long run-on sentence | "This sentence is 45 words. Consider splitting it for clarity." |
| Missing connectors | "Add a transition: 'Furthermore', 'In addition', 'On the other hand'" |
| Approaching word limit | "You have 80 words left — start wrapping up with your conclusion." |
| Finished all points | "Great! All points covered. Time for a strong conclusion." |

#### 💬 Ask the Coach (Student-Initiated Chat)
Student can type questions in the assistant panel:

| Student Asks | AI Responds |
|---|---|
| "How do I start this essay?" | Gives 2-3 opening strategies specific to the essay type + topic |
| "What's a better word for 'good'?" | Suggests synonyms in context: "In this sentence, try 'beneficial', 'advantageous', or 'commendable'" |
| "Is my argument strong enough?" | Analyzes the current paragraph and suggests how to add evidence or examples |
| "How should I end this?" | Gives 2-3 conclusion strategies matching the essay type |
| "Check my grammar" | Highlights issues in the current paragraph with corrections |
| "I'm stuck" | Asks clarifying questions about their next point, offers a thought-starter |

### 2.3 Guardrails (Critical — Anti-Cheating)

| Rule | Implementation |
|---|---|
| **Never write full sentences for them** | AI suggests strategies and gives examples, never pastes text to copy |
| **No copy-paste from AI panel** | Text in AI panel is non-selectable / copy-disabled |
| **Suggestion limit** | Max 10 suggestions per essay (forces independent thinking) |
| **Chat limit** | Max 15 messages per essay session |
| **No full paragraph rewrites** | AI can show how to improve a sentence, not rewrite a whole paragraph |
| **Exam mode = AI OFF** | No assistance in exam simulation mode |
| **Transparency** | Every AI interaction logged — parent can review what help was used |
| **Originality flag** | If student's text closely matches AI suggestion patterns, flag for review |

### 2.4 Pedagogy Levels (Adaptive)

AI assistance adjusts based on student's historical performance:

| Student Level | AI Behaviour |
|---|---|
| **Band 1-2** (Weak) | More proactive suggestions, simpler language, structural scaffolding ("Try writing: first point, then evidence, then explanation") |
| **Band 3** (Average) | Balanced — suggests improvements, asks guiding questions ("What evidence supports this point?") |
| **Band 4-5** (Strong) | Minimal intervention — only flags subtle issues (tone, sophistication, nuance). Mostly responds to student-initiated questions |

---

## 3. Real-Time Grammar & Style

### 3.1 Inline Annotations
Like Google Docs / Grammarly — issues highlighted directly in the text:

| Highlight | Colour | Example |
|---|---|---|
| Grammar error | 🔴 Red underline | "The students **is** playing" → "are" |
| Spelling | 🔴 Red dotted | "enviroment" → "environment" |
| Weak vocabulary | 🟡 Yellow underline | "very nice" → suggest "delightful, pleasant" |
| Run-on sentence | 🟠 Orange underline | Sentence > 35 words |
| Passive voice (excessive) | 🔵 Blue underline | "The food was eaten by students" → "Students ate the food" |

### 3.2 Fix Interaction
- Student hovers over highlighted text → tooltip shows the issue + fix
- Student can: Accept fix | Ignore | Ask "Why?"
- "Why?" opens explanation in the AI panel (learning moment)

---

## 4. Essay Outline Builder (Pre-Writing)

Before writing, student can optionally build an outline:

```
📋 Essay Outline for: "Letter about food waste"

Introduction:
  □ Hook: _______________
  □ State purpose: _______________

Body Paragraph 1:
  □ Point: _______________
  □ Evidence/Example: _______________
  □ Explanation: _______________

Body Paragraph 2:
  □ Point: _______________
  □ Evidence/Example: _______________
  □ Explanation: _______________

Body Paragraph 3:
  □ Point: _______________
  □ Evidence/Example: _______________
  □ Explanation: _______________

Conclusion:
  □ Summarise: _______________
  □ Call to action: _______________
```

- AI can suggest outline points based on the topic (student fills in their own words)
- Outline converts to editor sections with headings
- Structure tracker follows the outline progress

---

## 5. Data Model Additions

```sql
CREATE TABLE essay_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES student_profiles(id),
  content TEXT,                     -- Current editor content (HTML/JSON)
  plain_text TEXT,                  -- Plain text version for AI analysis
  word_count INT DEFAULT 0,
  outline JSONB,                    -- Pre-writing outline if used
  writing_mode TEXT DEFAULT 'practice' CHECK (writing_mode IN ('practice', 'timed', 'exam')),
  timer_duration_min INT,           -- Null for practice mode
  timer_started_at TIMESTAMPTZ,
  ai_assistant_enabled BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'writing' CHECK (status IN ('writing', 'paused', 'submitted', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE draft_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID REFERENCES essay_drafts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  word_count INT,
  version_number INT NOT NULL,
  auto_saved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID REFERENCES essay_drafts(id) ON DELETE CASCADE,
  student_id UUID REFERENCES student_profiles(id),
  interaction_type TEXT NOT NULL CHECK (interaction_type IN (
    'suggestion',           -- AI proactive suggestion
    'grammar_fix',          -- Inline grammar correction
    'vocabulary_hint',      -- Vocabulary improvement
    'structure_hint',       -- Structure/organisation suggestion
    'student_question',     -- Student asked the coach
    'coach_response'        -- AI response to student question
  )),
  trigger TEXT,                     -- What triggered this (pause, paragraph_end, student_ask)
  content TEXT NOT NULL,            -- The suggestion or question
  student_text_context TEXT,        -- The student's text at that moment
  accepted BOOLEAN,                 -- Did student use the suggestion?
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE grammar_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID REFERENCES essay_drafts(id) ON DELETE CASCADE,
  offset_start INT NOT NULL,
  offset_end INT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('grammar', 'spelling', 'vocabulary', 'style', 'passive_voice')),
  original_text TEXT NOT NULL,
  suggestion TEXT NOT NULL,
  explanation TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'ignored')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
CREATE POLICY "Students see own drafts"
  ON essay_drafts FOR ALL
  USING (student_id IN (
    SELECT id FROM student_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Parents see linked student drafts (read only)"
  ON essay_drafts FOR SELECT
  USING (student_id IN (
    SELECT student_id FROM parent_student_links WHERE parent_id = auth.uid()
  ));

CREATE POLICY "Parents see AI interaction logs"
  ON ai_interactions FOR SELECT
  USING (student_id IN (
    SELECT student_id FROM parent_student_links WHERE parent_id = auth.uid()
  ));

CREATE TABLE live_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID REFERENCES essay_drafts(id) ON DELETE CASCADE,
  student_id UUID REFERENCES student_profiles(id),
  paragraph_count INT NOT NULL,
  total_score INT NOT NULL,
  band INT NOT NULL,
  dimension_scores JSONB NOT NULL,     -- per-dimension score + status
  next_band_tips JSONB,                -- actionable tips to reach next band
  rubric_version TEXT NOT NULL,
  model_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
CREATE POLICY "Students see own live scores"
  ON live_scores FOR SELECT
  USING (student_id IN (
    SELECT id FROM student_profiles WHERE user_id = auth.uid()
  ));
```

---

## 6. API Additions

```
# Essay Drafts
POST /v1/drafts                                    # Create new draft for assignment
GET  /v1/drafts/{draftId}                          # Get current draft
PUT  /v1/drafts/{draftId}                          # Auto-save / manual save
GET  /v1/drafts/{draftId}/versions                 # Draft version history
POST /v1/drafts/{draftId}/submit                   # Submit for grading (creates submission)

# AI Writing Assistant
POST /v1/drafts/{draftId}/ai/analyze               # Trigger passive analysis (structure, tone, pacing)
POST /v1/drafts/{draftId}/ai/suggest               # Get contextual suggestion at current position
POST /v1/drafts/{draftId}/ai/chat                  # Student asks the coach { message }
POST /v1/drafts/{draftId}/ai/grammar               # Run grammar check on current text
POST /v1/drafts/{draftId}/ai/outline-suggest       # AI suggests outline based on topic
POST /v1/drafts/{draftId}/ai/live-score            # Trigger live scoring evaluation
GET  /v1/drafts/{draftId}/ai/score-history         # Score progression during session

# Grammar Annotations
GET  /v1/drafts/{draftId}/annotations              # Get all annotations for current text
POST /v1/drafts/{draftId}/annotations/{id}/accept  # Student accepted fix
POST /v1/drafts/{draftId}/annotations/{id}/ignore  # Student ignored fix

# Parent view
GET  /v1/drafts/{draftId}/ai-log                   # Parent sees AI interactions for transparency
```

---

## 7. Tech Implementation

### 7.1 Editor: Tiptap
```bash
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-character-count @tiptap/extension-placeholder @tiptap/extension-underline
```

Why Tiptap:
- Headless — full control over UI, matches shadcn/ui design
- Extension-based — add grammar highlights, word count, custom marks
- Collaborative-ready (Phase 2: tutor can comment on student's draft live)
- JSON document model — easy to store/version in Supabase
- Great React support with hooks

### 7.2 AI Pipeline (Real-Time)

```
Student types in editor
    │
    ├── Every 30s: auto-save to Supabase (draft_versions)
    │
    ├── On pause (15s idle): 
    │   └── Send current paragraph to AI
    │       └── POST /v1/drafts/{id}/ai/suggest
    │       └── Return suggestion to side panel
    │
    ├── On paragraph complete (Enter+Enter):
    │   └── Run structure check
    │   └── Update structure tracker
    │
    ├── Every 2 paragraphs:
    │   └── Run grammar check on new text
    │   └── POST /v1/drafts/{id}/ai/grammar
    │   └── Return annotations → highlight in editor
    │
    └── On student question:
        └── POST /v1/drafts/{id}/ai/chat
        └── Include: current text, cursor position, essay type, topic, student level
        └── Return coaching response
```

### 7.3 AI Prompt Strategy

For the writing assistant, use GPT-4o-mini (faster, cheaper) for:
- Grammar checking
- Vocabulary suggestions
- Structure tracking

Use GPT-4o for:
- Student chat (needs deeper understanding)
- Contextual suggestions (needs to understand essay holistically)
- Outline generation

### 7.4 Debouncing & Rate Control
- Grammar check: debounce 5 seconds after typing stops
- Suggestions: debounce 15 seconds after typing stops
- Chat: no debounce (student-initiated) but rate-limited to 1 per 10 seconds
- Auto-save: every 30 seconds
- Max API calls per essay session: ~50 (budgeted)

---

## 8. Component Structure

```
apps/web/src/components/editor/
├── essay-editor.tsx           # Main Tiptap editor wrapper
├── editor-toolbar.tsx         # Formatting + mode controls
├── word-count-bar.tsx         # Live word count with target
├── timer.tsx                  # Countdown timer (timed/exam mode)
├── grammar-highlight.tsx      # Tiptap extension for inline annotations
├── ai-panel.tsx               # Side panel — suggestions + chat
├── ai-suggestion-card.tsx     # Individual suggestion display
├── ai-chat.tsx                # Student ↔ AI chat interface
├── structure-tracker.tsx      # Visual essay structure progress
├── outline-builder.tsx        # Pre-writing outline tool
├── draft-status.tsx           # "Saving..." / "Saved ✓" / "Draft 3"
└── mode-selector.tsx          # Practice / Timed / Exam toggle
```

---

## 9. KPI Events (New)

```
draft_created (student_id, writing_mode, assignment_id)
draft_auto_saved (draft_id, word_count, version_number)
draft_submitted (draft_id, word_count, time_spent_minutes)
draft_abandoned (draft_id, word_count, time_spent_minutes)
ai_suggestion_shown (draft_id, suggestion_type)
ai_suggestion_accepted (draft_id, suggestion_type)
ai_suggestion_ignored (draft_id, suggestion_type)
ai_chat_message_sent (draft_id, message_length)
grammar_fix_accepted (draft_id, category)
grammar_fix_ignored (draft_id, category)
outline_used (draft_id, points_filled)
exam_mode_started (draft_id, timer_duration)
exam_mode_completed (draft_id, time_remaining)
writing_session_duration (draft_id, minutes)
live_score_updated (draft_id, paragraph_count, score, band)
live_score_improved (draft_id, old_score, new_score, delta)
next_band_tip_shown (draft_id, tip_type)
live_score_hidden (draft_id)   # student chose to hide score panel
```

---

## 10. Phase Mapping

### Phase 1 (MVP)
- Tiptap editor with basic formatting
- Auto-save + draft versioning
- Word count + timer
- Practice + Timed + Exam modes
- AI side panel with suggestions + chat
- Inline grammar highlighting
- Suggestion + chat limits (10 + 15)
- Submit for grading flow

### Phase 2
- Outline builder (pre-writing)
- Adaptive AI levels (Band 1-2 vs 3 vs 4-5)
- Vocabulary tracker across essays
- Parent view: AI interaction transparency log
- Tutor live commenting on drafts

### Phase 3
- Collaborative editing (tutor + student)
- Speech-to-text input (student dictates, editor transcribes)
- Handwriting input via tablet stylus
- Essay templates library
