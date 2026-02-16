'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useRequestRewrite, useRewrites, useSubmission, useEvaluation, type RewriteResult } from '@/lib/api/client';
import { DiffView } from '@/components/feedback/diff-view';
import Link from 'next/link';

/** Strip markdown code-fence wrappers that the OCR pipeline sometimes adds. */
function stripMarkdownFences(text: string): string {
  return text
    .replace(/^\s*```(?:markdown|md)?\s*\n?/i, '')
    .replace(/\n?\s*```\s*$/i, '')
    .trim();
}

export default function RewritePage() {
  const params = useParams<{ id: string }>();
  const [mode, setMode] = useState<'exam_optimised' | 'clarity_optimised'>('exam_optimised');
  const requestRewrite = useRequestRewrite();
  const submission = useSubmission(params.id);
  const evaluation = useEvaluation(params.id);
  const existingRewrites = useRewrites(params.id);

  const handleGenerate = () => {
    requestRewrite.mutate({ submissionId: params.id, mode });
  };

  // Show mutation result immediately, fall back to latest persisted rewrite
  const rewrite: RewriteResult | undefined = useMemo(() => {
    if (requestRewrite.data?.rewrite) return requestRewrite.data.rewrite;
    if (existingRewrites.data && existingRewrites.data.length > 0) {
      // Latest first (sorted by created_at desc)
      return [...existingRewrites.data].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0];
    }
    return undefined;
  }, [requestRewrite.data, existingRewrites.data]);

  const originalText = stripMarkdownFences(submission.data?.ocr_text ?? '');
  const currentBand = evaluation.data?.band;

  // Convert rationale object to array for DiffView
  const rationale = rewrite?.rationale
    ? Object.entries(rewrite.rationale).map(([category, explanation]) => ({
        category,
        explanation: String(explanation),
      }))
    : undefined;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Link href={`/submissions/${params.id}`} className="text-sm text-muted-foreground hover:underline">
        ← Back to Submission
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Model Rewrite</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        ⚠️ Reference Model Answer — for learning purposes only. The rewrite is pitched one band
        above your current level.
      </p>

      <div className="mt-6 flex gap-3">
        {(['exam_optimised', 'clarity_optimised'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-md border px-4 py-2 text-sm ${
              mode === m ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground'
            }`}
          >
            {m === 'exam_optimised' ? '🎯 Exam-Optimised' : '✨ Clarity-Optimised'}
          </button>
        ))}
      </div>

      <button
        onClick={handleGenerate}
        disabled={requestRewrite.isPending}
        className="mt-4 rounded-md bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
      >
        {requestRewrite.isPending ? 'Generating...' : 'Generate Rewrite'}
      </button>

      {requestRewrite.isError && (
        <p className="mt-4 text-sm text-red-600">
          {requestRewrite.error?.message ?? 'Something went wrong. Please try again.'}
        </p>
      )}

      {rewrite && (
        <div className="mt-8">
          {rewrite.target_band && (
            <p className="mb-4 text-sm font-medium text-muted-foreground">
              📈 Rewritten to <span className="font-bold text-primary">Band {rewrite.target_band}</span>
              {currentBand ? <> from <span className="font-bold">Band {currentBand}</span></> : null}
            </p>
          )}

          <DiffView
            original={originalText}
            rewritten={stripMarkdownFences(rewrite.rewritten_text)}
            diffPayload={rewrite.diff_payload as Array<{ type: 'add' | 'remove' | 'unchanged'; value: string }> | undefined}
            rationale={rationale}
          />
        </div>
      )}
    </div>
  );
}
