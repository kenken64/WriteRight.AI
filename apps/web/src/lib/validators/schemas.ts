import { z } from 'zod';

// ─── Auth Forms ───
export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name is too long'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['parent', 'student']),
});
export type RegisterInput = z.infer<typeof registerSchema>;

// ─── Assignment Form ───
export const newAssignmentFormSchema = z.object({
  essayType: z.enum(['situational', 'continuous']),
  essaySubType: z.enum([
    'letter', 'email', 'report', 'speech', 'proposal',
    'narrative', 'expository', 'argumentative', 'descriptive',
  ]),
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
  wordCountMin: z.number().int().positive('Must be a positive number'),
  wordCountMax: z.number().int().positive('Must be a positive number'),
}).refine((data) => data.wordCountMax >= data.wordCountMin, {
  message: 'Max words must be greater than or equal to min words',
  path: ['wordCountMax'],
});
export type NewAssignmentFormInput = z.infer<typeof newAssignmentFormSchema>;

// ─── Users ───
export const userSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['parent', 'student']),
  email: z.string().email().nullable(),
  mobile: z.string().nullable(),
  display_name: z.string().nullable(),
  notification_prefs: z.object({
    email: z.boolean(),
    push: z.boolean(),
  }),
  status: z.enum(['active', 'suspended', 'deleted']),
  created_at: z.string(),
});
export type User = z.infer<typeof userSchema>;

// ─── Student Profiles ───
export const studentProfileSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  display_name: z.string(),
  level: z.enum(['sec3', 'sec4', 'sec5']),
  created_at: z.string(),
});
export type StudentProfile = z.infer<typeof studentProfileSchema>;

// ─── Topics ───
export const topicSchema = z.object({
  id: z.string().uuid(),
  source: z.enum(['upload', 'trending', 'manual']),
  source_text: z.string().nullable(),
  category: z.enum([
    'environment', 'technology', 'social_issues',
    'education', 'health', 'current_affairs',
  ]).nullable(),
  essay_type: z.enum(['situational', 'continuous']),
  level: z.string().nullable(),
  generated_prompts: z.any(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
});
export type Topic = z.infer<typeof topicSchema>;

// ─── Assignments ───
export const essayTypeSchema = z.enum(['situational', 'continuous']);
export const essaySubTypeSchema = z.enum([
  'letter', 'email', 'report', 'speech', 'proposal',
  'narrative', 'expository', 'argumentative', 'descriptive',
]);

export const assignmentSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  topic_id: z.string().uuid().nullable(),
  essay_type: essayTypeSchema,
  essay_sub_type: essaySubTypeSchema.nullable(),
  prompt: z.string().min(10),
  guiding_points: z.array(z.string()).nullable(),
  word_count_min: z.number().int().positive(),
  word_count_max: z.number().int().positive(),
  language: z.string(),
  created_at: z.string(),
});
export type Assignment = z.infer<typeof assignmentSchema>;

export const createAssignmentSchema = assignmentSchema.pick({
  essay_type: true,
  essay_sub_type: true,
  prompt: true,
  word_count_min: true,
  word_count_max: true,
}).extend({
  student_id: z.string().uuid().optional(),
  topic_id: z.string().uuid().optional(),
  guiding_points: z.array(z.string()).optional(),
});

// ─── Submissions ───
export const submissionStatusSchema = z.enum([
  'draft', 'uploading', 'processing', 'ocr_complete',
  'evaluating', 'evaluated', 'failed',
]);

export const submissionSchema = z.object({
  id: z.string().uuid(),
  assignment_id: z.string().uuid(),
  image_refs: z.array(z.string()).nullable(),
  ocr_text: z.string().nullable(),
  ocr_confidence: z.number().nullable(),
  status: submissionStatusSchema,
  failure_reason: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Submission = z.infer<typeof submissionSchema>;

// ─── Evaluations ───
export const dimensionScoreSchema = z.object({
  name: z.string(),
  score: z.number().int(),
  maxScore: z.number().int(),
  band: z.number().int(),
  justification: z.string(),
});

export const feedbackItemSchema = z.object({
  text: z.string(),
  quote: z.string(),
  suggestion: z.string().optional(),
});

export const evaluationSchema = z.object({
  id: z.string().uuid(),
  submission_id: z.string().uuid(),
  essay_type: z.string(),
  rubric_version: z.string(),
  model_id: z.string(),
  prompt_version: z.string(),
  dimension_scores: z.array(dimensionScoreSchema),
  total_score: z.number().int().min(0).max(30),
  band: z.number().int().min(0).max(5),
  strengths: z.array(feedbackItemSchema),
  weaknesses: z.array(feedbackItemSchema),
  next_steps: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  review_recommended: z.boolean(),
  created_at: z.string(),
});
export type Evaluation = z.infer<typeof evaluationSchema>;

// ─── Rewrites ───
export const rewriteSchema = z.object({
  id: z.string().uuid(),
  submission_id: z.string().uuid(),
  mode: z.enum(['exam_optimised', 'clarity_optimised']),
  rewritten_text: z.string(),
  diff_payload: z.any(),
  rationale: z.any(),
  target_band: z.number().int().nullable(),
  created_at: z.string(),
});
export type Rewrite = z.infer<typeof rewriteSchema>;

// ─── Achievements ───
export const achievementSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(['practice', 'improvement', 'mastery', 'streak', 'special']),
  badge_emoji: z.string(),
  criteria: z.any(),
  sort_order: z.number(),
});
export type Achievement = z.infer<typeof achievementSchema>;

export const studentAchievementSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  achievement_id: z.string().uuid(),
  unlocked_at: z.string(),
  achievement: achievementSchema.optional(),
});
export type StudentAchievement = z.infer<typeof studentAchievementSchema>;

export const studentStreakSchema = z.object({
  student_id: z.string().uuid(),
  current_streak: z.number(),
  longest_streak: z.number(),
  last_submission_date: z.string().nullable(),
});
export type StudentStreak = z.infer<typeof studentStreakSchema>;

// ─── Wishlist ───
export const rewardTypeSchema = z.enum([
  'treat', 'screen_time', 'book', 'activity', 'money', 'creative', 'custom',
]);

export const wishlistItemSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  created_by: z.enum(['student', 'parent']),
  title: z.string(),
  description: z.string().nullable(),
  image_url: z.string().nullable(),
  reward_type: rewardTypeSchema,
  required_achievement_id: z.string().uuid().nullable(),
  is_surprise: z.boolean(),
  status: z.enum(['pending_parent', 'locked', 'claimable', 'claimed', 'fulfilled', 'expired']),
  claimed_at: z.string().nullable(),
  fulfilled_at: z.string().nullable(),
  created_at: z.string(),
});
export type WishlistItem = z.infer<typeof wishlistItemSchema>;

// ─── Redemptions ───
export const redemptionStatusSchema = z.enum([
  'claimed', 'acknowledged', 'pending_fulfilment',
  'completed', 'overdue', 'rescheduled', 'withdrawn',
]);

export const redemptionSchema = z.object({
  id: z.string().uuid(),
  wishlist_item_id: z.string().uuid(),
  student_id: z.string().uuid(),
  parent_id: z.string().uuid(),
  achievement_id: z.string().uuid(),
  status: redemptionStatusSchema,
  fulfilment_deadline: z.string(),
  kid_confirmed: z.boolean(),
  claimed_at: z.string(),
  fulfilled_at: z.string().nullable(),
  created_at: z.string(),
});
export type Redemption = z.infer<typeof redemptionSchema>;

// ─── Subscriptions ───
export const subscriptionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  plan: z.enum(['free', 'plus_monthly', 'plus_annual']),
  status: z.enum(['active', 'trialing', 'past_due', 'canceled', 'incomplete']),
  current_period_end: z.string().nullable(),
});
export type Subscription = z.infer<typeof subscriptionSchema>;

// ─── API Request Schemas ───
export const generateTopicRequestSchema = z.object({
  source: z.enum(['upload', 'trending']),
  essayType: essayTypeSchema,
  level: z.enum(['sec3', 'sec4', 'sec5']).optional(),
  articleText: z.string().optional(),
  imageRefs: z.array(z.string()).optional(),
});

export const evaluateRequestSchema = z.object({
  submissionId: z.string().uuid(),
});

export const rewriteRequestSchema = z.object({
  submissionId: z.string().uuid(),
  mode: z.enum(['exam_optimised', 'clarity_optimised']),
});

// ─── Onboarding ───
export const studentOnboardSchema = z.object({
  level: z.enum(['sec3', 'sec4', 'sec5']),
  displayName: z.string().min(1).max(100),
});
export type StudentOnboardInput = z.infer<typeof studentOnboardSchema>;

export const parentTypeSchema = z.enum(['parent', 'school_teacher', 'tuition_teacher']);
export type ParentType = z.infer<typeof parentTypeSchema>;

export const parentOnboardSchema = z.object({
  inviteCode: z.string().length(6).toUpperCase(),
  parentType: parentTypeSchema.optional().default('parent'),
});
export type ParentOnboardInput = z.infer<typeof parentOnboardSchema>;

export const inviteCodeSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  student_id: z.string().uuid(),
  is_active: z.boolean(),
  claimed_by: z.string().uuid().nullable(),
  claimed_at: z.string().nullable(),
  created_at: z.string(),
  expires_at: z.string(),
});
export type InviteCode = z.infer<typeof inviteCodeSchema>;
