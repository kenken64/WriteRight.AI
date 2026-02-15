'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChunkedUploader } from '@/components/upload/chunked-uploader';
import { ImageQualityCheck } from '@/components/upload/image-quality-check';
import { PageReorder } from '@/components/upload/page-reorder';

export default function NewSubmissionPage() {
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get('assignmentId');
  const [images, setImages] = useState<File[]>([]);
  const [step, setStep] = useState<'upload' | 'review' | 'submit'>('upload');

  const handleUploadComplete = (uploadedImages: File[]) => {
    setImages(uploadedImages);
    setStep('review');
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
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-6">
            <PageReorder images={images} onReorder={setImages} />
            <div className="flex gap-3">
              <button
                onClick={() => setStep('upload')}
                className="flex-1 rounded-md border px-4 py-2 text-sm"
              >
                Back
              </button>
              <button
                onClick={() => setStep('submit')}
                className="flex-1 rounded-md bg-primary px-4 py-2 text-sm text-white"
              >
                Submit for Marking
              </button>
            </div>
          </div>
        )}

        {step === 'submit' && (
          <div className="rounded-lg border bg-white p-8 text-center">
            <div className="text-4xl">📝</div>
            <h2 className="mt-4 text-lg font-semibold">Submission Received!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your essay is being processed. We&apos;ll notify you when feedback is ready.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
