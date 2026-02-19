import Link from 'next/link';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { formatStatus, formatConfidence, getStatusDescription } from '@/lib/utils/format';
import { OcrSection } from '@/components/submission/ocr-section';
import { ReEvaluateButton } from '@/components/submission/re-evaluate-button';
import { ChatPanel } from '@/components/submission/chat-panel';
import { StudentNotesPanel } from '@/components/submission/student-notes-panel';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SubmissionDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // Get current user and role for chat/notes visibility
  const { data: { user } } = await supabase.auth.getUser();
  let userRole: string | null = null;
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    userRole = userData?.role ?? null;
  }

  const { data: submission } = await supabase
    .from('submissions')
    .select('*, assignment:assignments(prompt, essay_type, essay_sub_type, student:student_profiles(display_name))')
    .eq('id', id)
    .single();

  if (!submission) notFound();

  // Always generate fresh signed URLs from image_refs (reliable, 1-hour expiry).
  // The stored ocr_image_urls (public bucket) can be stale or inaccessible,
  // so we prefer freshly signed URLs every page load.
  let imageUrls: string[] = [];
  if (submission.image_refs?.length) {
    const admin = createAdminSupabaseClient();
    for (const ref of submission.image_refs as string[]) {
      const { data } = await admin.storage
        .from('submissions')
        .createSignedUrl(ref, 3600); // 1 hour expiry
      if (data?.signedUrl) imageUrls.push(data.signedUrl);
    }
  }

  const status = formatStatus(submission.status);
  const statusDescription = getStatusDescription(submission.status);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Link href="/submissions" className="text-sm text-muted-foreground hover:underline">
        ← Back to Submissions
      </Link>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-2xl font-bold md:text-3xl">Submission</h1>
        <span className={`rounded-full px-3 py-1 text-sm ${status.color}`}>{status.label}</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>ID: {id.slice(0, 8)}</span>
        {submission.assignment?.student?.display_name && (
          <span>Submitted by: {submission.assignment.student.display_name}</span>
        )}
        <span>
          {new Date(submission.created_at).toLocaleString('en-SG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}
        </span>
      </div>

      {statusDescription && (
        <p className="mt-2 text-sm text-muted-foreground">{statusDescription}</p>
      )}

      <div className="mt-6 rounded-lg border bg-white p-6">
        <h2 className="font-medium">{submission.assignment?.prompt}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {submission.assignment?.essay_type} · {submission.assignment?.essay_sub_type}
        </p>
      </div>

      {submission.ocr_text ? (
        <div className="mt-6 rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Extracted Text</h2>
            {submission.ocr_confidence && (
              <span className="text-sm text-muted-foreground">
                OCR Confidence: {formatConfidence(submission.ocr_confidence)}
              </span>
            )}
          </div>
          <OcrSection
            submissionId={id}
            text={submission.ocr_text}
            imageUrls={imageUrls}
          />
        </div>
      ) : submission.status === 'evaluated' && (
        <div className="mt-6 rounded-lg border bg-white p-6">
          <h2 className="font-medium">Extracted Text</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Text extraction not available for this submission.
          </p>
        </div>
      )}

      <ReEvaluateButton submissionId={id} status={submission.status} />

      {submission.status === 'evaluated' && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/submissions/${id}/feedback`}
            className="flex-1 rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary/90"
          >
            View Feedback
          </Link>
          <Link
            href={`/submissions/${id}/rewrite`}
            className="flex-1 rounded-md border px-4 py-2 text-center text-sm font-medium hover:bg-muted"
          >
            View Rewrite
          </Link>
        </div>
      )}

      {user && <ChatPanel submissionId={id} currentUserId={user.id} />}

      {user && userRole === 'student' && <StudentNotesPanel submissionId={id} />}
    </div>
  );
}
