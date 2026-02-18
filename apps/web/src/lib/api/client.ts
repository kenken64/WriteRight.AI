import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Assignment,
  Submission,
  Evaluation,
  Topic,
  Achievement,
  WishlistItem,
  Redemption,
  StudentStreak,
  StudentOnboardInput,
  ParentOnboardInput,
  StudentProfile,
  InviteCode,
} from '@/lib/validators/schemas';
import { readCsrfToken } from '@/lib/hooks/use-csrf-token';

const API_BASE = '/api/v1';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  // Automatically include CSRF token for mutating requests
  const method = (options?.method ?? 'GET').toUpperCase();
  if (MUTATING_METHODS.has(method)) {
    const csrfToken = readCsrfToken();
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.error || error.message || `API error: ${res.status}`);
  }
  return res.json();
}

// ─── Assignments ───
export function useAssignments(studentId?: string) {
  return useQuery({
    queryKey: ['assignments', studentId],
    queryFn: () => apiFetch<Assignment[]>(`/assignments?studentId=${studentId}`),
    enabled: !!studentId,
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Assignment>) =>
      apiFetch<Assignment>('/assignments', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  });
}

// ─── Submissions ───
export function useSubmissions(assignmentId?: string) {
  return useQuery({
    queryKey: ['submissions', assignmentId],
    queryFn: () => apiFetch<Submission[]>(`/submissions?assignmentId=${assignmentId}`),
    enabled: !!assignmentId,
  });
}

export function useSubmission(id: string) {
  return useQuery({
    queryKey: ['submission', id],
    queryFn: async () => {
      const res = await apiFetch<{ submission: Submission }>(`/submissions/${id}`);
      return res.submission;
    },
  });
}

export function useEvaluation(submissionId: string) {
  return useQuery({
    queryKey: ['evaluation', submissionId],
    queryFn: () => apiFetch<Evaluation>(`/submissions/${submissionId}/feedback`),
    enabled: !!submissionId,
  });
}

export function useRequestEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (submissionId: string) =>
      apiFetch<{ jobId: string }>(`/evaluate`, { method: 'POST', body: JSON.stringify({ submissionId }) }),
    onSuccess: (_, submissionId) => qc.invalidateQueries({ queryKey: ['submission', submissionId] }),
  });
}

export interface BandKeyChange {
  original: string;
  rewritten: string;
  reason: string;
}

export interface BandJustification {
  summary: string;
  keyChanges: BandKeyChange[];
}

export interface RewriteAnnotation {
  paragraphIndex: number;
  originalSnippet: string;
  feedback: string;
  dimension: string;
}

export interface RewriteResult {
  id: string;
  submission_id: string;
  mode: string;
  rewritten_text: string;
  diff_payload: unknown;
  rationale: Record<string, string> | null;
  band_justification: BandJustification | null;
  paragraph_annotations: RewriteAnnotation[] | null;
  target_band: string | null;
  created_at: string;
}

export function useRewrites(submissionId: string) {
  return useQuery({
    queryKey: ['rewrites', submissionId],
    queryFn: () =>
      apiFetch<{ rewrites: RewriteResult[] }>(`/submissions/${submissionId}/rewrite`).then(
        (res) => res.rewrites,
      ),
    enabled: !!submissionId,
  });
}

export function useRequestRewrite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { submissionId: string; mode: 'exam_optimised' | 'clarity_optimised'; targetBand?: number }) =>
      apiFetch<{ rewrite: RewriteResult }>(`/submissions/${data.submissionId}/rewrite`, { method: 'POST', body: JSON.stringify({ mode: data.mode, targetBand: data.targetBand }) }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['rewrites', variables.submissionId] });
    },
  });
}

// ─── Topics ───
export function useTopics(filters?: { category?: string; essayType?: string; level?: string }, page = 1, pageSize = 10) {
  const params = new URLSearchParams({
    ...(filters as Record<string, string>),
    page: String(page),
    pageSize: String(pageSize),
  }).toString();
  return useQuery({
    queryKey: ['topics', filters, page, pageSize],
    queryFn: () => apiFetch<{ topics: Topic[]; total: number }>(`/topics?${params}`),
  });
}

export function useTopic(id: string | null) {
  return useQuery({
    queryKey: ['topic', id],
    queryFn: () => apiFetch<{ topic: Topic }>(`/topics/${id}`).then((res) => res.topic),
    enabled: !!id,
  });
}

export function useGenerateTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { source: 'upload' | 'trending'; essayType: string; articleText?: string }) =>
      apiFetch<Topic>('/topics/generate', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['topics'] }),
  });
}

export function useUpdateTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Pick<Topic, 'category' | 'essay_type' | 'level' | 'generated_prompts'>>) =>
      apiFetch<{ topic: Topic }>(`/topics/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['topics'] }),
  });
}

export function useDeleteTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/topics/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['topics'] }),
  });
}

// ─── Achievements ───
export function useAchievements(studentId: string) {
  return useQuery({
    queryKey: ['achievements', studentId],
    queryFn: () => apiFetch<Achievement[]>(`/achievements?studentId=${studentId}`),
  });
}

export function useStreaks(studentId: string) {
  return useQuery({
    queryKey: ['streaks', studentId],
    queryFn: () => apiFetch<StudentStreak>(`/achievements/streaks?studentId=${studentId}`),
  });
}

// ─── Wishlist & Rewards ───
export function useWishlist(studentId: string) {
  return useQuery({
    queryKey: ['wishlist', studentId],
    queryFn: () =>
      apiFetch<{ items: WishlistItem[] }>(`/wishlist/students/${studentId}`).then(
        (res) => res.items,
      ),
    enabled: !!studentId,
  });
}

export function useAddWishlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { studentId: string; title: string; rewardType: string; createdBy: string }) =>
      apiFetch<{ item: WishlistItem }>(`/wishlist/students/${data.studentId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
  });
}

export function useApproveWishlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { itemId: string; requiredAchievementId: string }) =>
      apiFetch(`/wishlist/items/${data.itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'approve', requiredAchievementId: data.requiredAchievementId }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
  });
}

export function useRejectWishlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) =>
      apiFetch(`/wishlist/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'reject' }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
  });
}

export function useClaimReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) =>
      apiFetch(`/wishlist/items/${itemId}/claim`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wishlist'] });
      qc.invalidateQueries({ queryKey: ['redemptions'] });
    },
  });
}

export function useRedemptions(parentId: string) {
  return useQuery({
    queryKey: ['redemptions', parentId],
    queryFn: () => apiFetch<Redemption[]>(`/redemptions?parentId=${parentId}`),
  });
}

export function useAcknowledgeRedemption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/redemptions/${id}/acknowledge`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['redemptions'] }),
  });
}

export function useWithdrawRedemption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/redemptions/${id}/withdraw`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['redemptions'] }),
  });
}

export function useFulfilRedemption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; note?: string; photoUrl?: string }) =>
      apiFetch(`/redemptions/${data.id}/fulfil`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['redemptions'] }),
  });
}

// ─── Onboarding ───
export function useStudentOnboard() {
  return useMutation({
    mutationFn: (data: StudentOnboardInput) =>
      apiFetch<{ profile: StudentProfile; inviteCode: string }>('/onboard/student', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}

export function useParentOnboard() {
  return useMutation({
    mutationFn: (data: ParentOnboardInput) =>
      apiFetch<{ linked: boolean; studentId: string }>('/onboard/parent', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}

export function useParentSkipOnboard() {
  return useMutation({
    mutationFn: () =>
      apiFetch<{ skipped: boolean }>('/onboard/parent/skip', { method: 'POST' }),
  });
}

export function useInviteCode() {
  return useQuery({
    queryKey: ['invite-code'],
    queryFn: () => apiFetch<{ inviteCode: InviteCode }>('/invite-code'),
  });
}

export function useRegenerateInviteCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ inviteCode: string }>('/invite-code/regenerate', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invite-code'] }),
  });
}
