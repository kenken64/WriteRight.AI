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
      apiFetch<{ linked?: boolean; studentId?: string; classCode?: string; className?: string | null }>('/onboard/parent', {
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

// ─── Class Codes (Teachers) ───
export function useClassCode() {
  return useQuery({
    queryKey: ['class-code'],
    queryFn: () =>
      apiFetch<{ classCode: { id: string; code: string; class_name: string | null; created_at: string } | null; studentCount: number }>('/class-codes'),
  });
}

export function useRegenerateClassCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ classCode: string }>('/class-codes/regenerate', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['class-code'] }),
  });
}

export function useJoinClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { classCode: string }) =>
      apiFetch<{ linked: boolean; teacherName: string }>('/class-codes/join', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

// ─── Linked Students (Parents/Teachers) ───
export function useLinkedStudents() {
  return useQuery({
    queryKey: ['linked-students'],
    queryFn: () =>
      apiFetch<{ students: { id: string; displayName: string; level: string }[] }>('/linked-students'),
  });
}

// ─── Submission Messages ───
export interface SubmissionMessage {
  id: string;
  submission_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender: { display_name: string; role: string } | null;
}

export function useSubmissionMessages(submissionId: string) {
  return useQuery({
    queryKey: ['submission-messages', submissionId],
    queryFn: () =>
      apiFetch<{ messages: SubmissionMessage[] }>(`/submissions/${submissionId}/messages`).then(
        (res) => res.messages,
      ),
    enabled: !!submissionId,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { submissionId: string; content: string }) =>
      apiFetch<{ message: SubmissionMessage }>(`/submissions/${data.submissionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: data.content }),
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['submission-messages', variables.submissionId] });
    },
  });
}

// ─── Student Notes ───
export interface StudentNote {
  id: string;
  submission_id: string;
  student_id: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  is_done: boolean;
  created_at: string;
  updated_at: string;
}

export function useStudentNotes(submissionId: string) {
  return useQuery({
    queryKey: ['student-notes', submissionId],
    queryFn: () =>
      apiFetch<{ notes: StudentNote[] }>(`/submissions/${submissionId}/notes`).then(
        (res) => res.notes,
      ),
    enabled: !!submissionId,
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { submissionId: string; content: string; priority: string }) =>
      apiFetch<{ note: StudentNote }>(`/submissions/${data.submissionId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content: data.content, priority: data.priority }),
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['student-notes', variables.submissionId] });
    },
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      submissionId: string;
      noteId: string;
      content?: string;
      priority?: string;
      is_done?: boolean;
    }) =>
      apiFetch<{ note: StudentNote }>(
        `/submissions/${data.submissionId}/notes/${data.noteId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            ...(data.content !== undefined && { content: data.content }),
            ...(data.priority !== undefined && { priority: data.priority }),
            ...(data.is_done !== undefined && { is_done: data.is_done }),
          }),
        },
      ),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['student-notes', variables.submissionId] });
    },
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { submissionId: string; noteId: string }) =>
      apiFetch<{ success: boolean }>(
        `/submissions/${data.submissionId}/notes/${data.noteId}`,
        { method: 'DELETE' },
      ),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['student-notes', variables.submissionId] });
    },
  });
}

// ─── Student Highlights ───
export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange';

export interface StudentHighlight {
  id: string;
  submission_id: string;
  student_id: string;
  highlighted_text: string;
  color: HighlightColor;
  occurrence_index: number;
  created_at: string;
  updated_at: string;
}

export function useStudentHighlights(submissionId: string) {
  return useQuery({
    queryKey: ['student-highlights', submissionId],
    queryFn: () =>
      apiFetch<{ highlights: StudentHighlight[] }>(`/submissions/${submissionId}/highlights`).then(
        (res) => res.highlights,
      ),
    enabled: !!submissionId,
  });
}

export function useCreateHighlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      submissionId: string;
      highlighted_text: string;
      color: HighlightColor;
      occurrence_index: number;
    }) =>
      apiFetch<{ highlight: StudentHighlight }>(`/submissions/${data.submissionId}/highlights`, {
        method: 'POST',
        body: JSON.stringify({
          highlighted_text: data.highlighted_text,
          color: data.color,
          occurrence_index: data.occurrence_index,
        }),
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['student-highlights', variables.submissionId] });
    },
  });
}

export function useUpdateHighlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { submissionId: string; highlightId: string; color: HighlightColor }) =>
      apiFetch<{ highlight: StudentHighlight }>(
        `/submissions/${data.submissionId}/highlights/${data.highlightId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ color: data.color }),
        },
      ),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['student-highlights', variables.submissionId] });
    },
  });
}

export function useDeleteHighlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { submissionId: string; highlightId: string }) =>
      apiFetch<{ success: boolean }>(
        `/submissions/${data.submissionId}/highlights/${data.highlightId}`,
        { method: 'DELETE' },
      ),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['student-highlights', variables.submissionId] });
    },
  });
}

// ─── Gallery ───
export interface GallerySubmission {
  id: string;
  status: string;
  image_refs: string[] | null;
  gallery_pdf_ref: string | null;
  created_at: string;
  assignment: {
    id: string;
    prompt: string;
    essay_type: string;
    topic_id: string | null;
    student_id: string;
    topic: {
      id: string;
      source_text: string | null;
      category: string | null;
      generated_prompts: unknown;
    } | null;
    student: {
      display_name: string;
    } | null;
  } | null;
}

export function useGallery(filters?: { category?: string }, page = 1, pageSize = 10) {
  const params = new URLSearchParams({
    ...(filters as Record<string, string>),
    page: String(page),
    pageSize: String(pageSize),
  }).toString();
  return useQuery({
    queryKey: ['gallery', filters, page, pageSize],
    queryFn: () => apiFetch<{ submissions: GallerySubmission[]; total: number }>(`/gallery?${params}`),
  });
}

export function useGenerateGalleryPdf() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (submissionId: string) =>
      apiFetch<{ url: string }>(`/gallery/${submissionId}/pdf`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gallery'] }),
  });
}
