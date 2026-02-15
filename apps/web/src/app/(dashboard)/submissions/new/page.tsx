'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChunkedUploader } from '@/components/upload/chunked-uploader';
import { ImageQualityCheck } from '@/components/upload/image-quality-check';
import { readCsrfToken } from '@/lib/hooks/use-csrf-token';

export default function NewSubmissionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const assignmentId = searchParams.get('assignmentId');
  const [imageRefs, setImageRefs] = useState<string[]>([]);
  const [step, setStep] = useState<'upload' | 'submitting' | 'error'>('upload');
  const [error, setError] = useState<string | null>(null);

  const handleUploadComplete = (refs: string[]) => {
    setImageRefs(refs);
  };

  const handleSubmit = async () => {
    if (!assignmentId || imageRefs.length === 0) return;

    setStep('submitting');
    setError(null);

    try {
      const csrfToken = readCsrfToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (csrfToken) headers['x-csrf-token'] = csrfToken;

      // Create the submission record
      const res = await fetch('/api/v1/submissions', {
        method: 'POST',
        headers,
        body: JSON.stringify({ assignmentId, imageRefs }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to create submission');
      }

      const { submission } = await res.json();

      // Trigger OCR + evaluation in the background (don't await)
      fetch(`/api/v1/submissions/${submission.id}/finalize`, {
        method: 'POST',
        headers,
      });

      // Redirect immediately — the detail page shows live status
      router.push(`/submissions/${submission.id}`);
    } catch (err) {
      setError((err as Error).message);
      setStep('error');
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-2xl font-bold">Submit Essay</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Upload photos, PDFs, or Word documents of your essay. We support up to 8 files per submission.
      </p>

      <div className="mt-8">
        {step === 'upload' && (
          <div className="space-y-6">
            <ImageQualityCheck />
            <ChunkedUploader
              assignmentId={assignmentId ?? ''}
              maxImages={8}
              onComplete={handleUploadComplete}
            />
            {imageRefs.length > 0 && (
              <button
                onClick={handleSubmit}
                className="w-full rounded-md bg-primary py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                Submit for Marking
              </button>
            )}
          </div>
        )}

        {step === 'submitting' && (
          <div className="rounded-lg border bg-white p-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <h2 className="mt-4 text-lg font-semibold">Submitting...</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Creating your submission and starting processing.
            </p>
          </div>
        )}

        {step === 'error' && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
            <h2 className="text-lg font-semibold text-red-800">Submission Failed</h2>
            <p className="mt-2 text-sm text-red-600">{error}</p>
            <button
              onClick={() => setStep('upload')}
              className="mt-4 rounded-md border px-4 py-2 text-sm"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
