import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { formatStatus, formatConfidence } from '@/lib/utils/format';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SubmissionDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: submission } = await supabase
    .from('submissions')
    .select('*, assignment:assignments(prompt, essay_type, essay_sub_type)')
    .eq('id', id)
    .single();

  if (!submission) notFound();

  const status = formatStatus(submission.status);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link href="/submissions" className="text-sm text-muted-foreground hover:underline">
        ← Back to Submissions
      </Link>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-2xl font-bold md:text-3xl">Submission</h1>
        <span className={`rounded-full px-3 py-1 text-sm ${status.color}`}>{status.label}</span>
      </div>

      <div className="mt-6 rounded-lg border bg-white p-6">
        <h2 className="font-medium">{submission.assignment?.prompt}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {submission.assignment?.essay_type} · {submission.assignment?.essay_sub_type}
        </p>
      </div>

      {submission.ocr_text && (
        <div className="mt-6 rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Extracted Text</h2>
            {submission.ocr_confidence && (
              <span className="text-sm text-muted-foreground">
                OCR Confidence: {formatConfidence(submission.ocr_confidence)}
              </span>
            )}
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm">{submission.ocr_text}</p>
        </div>
      )}

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
    </div>
  );
}
