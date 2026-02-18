'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useRequestRewrite, useRewrites, useSubmission, useEvaluation, type RewriteResult, type RewriteAnnotation } from '@/lib/api/client';
import { DiffView } from '@/components/feedback/diff-view';
import Link from 'next/link';

const DIMENSION_COLORS: Record<string, string> = {
  Language: 'bg-blue-100 text-blue-800 border-blue-200',
  Content: 'bg-amber-100 text-amber-800 border-amber-200',
  Organisation: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Audience & Register': 'bg-purple-100 text-purple-800 border-purple-200',
};

function getDimensionStyle(dimension: string) {
  return DIMENSION_COLORS[dimension] ?? 'bg-gray-100 text-gray-700 border-gray-200';
}

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
  const [targetBand, setTargetBand] = useState<number | undefined>(undefined);
  const [view, setView] = useState<'annotated' | 'diff'>('annotated');
  const requestRewrite = useRequestRewrite();
  const submission = useSubmission(params.id);
  const evaluation = useEvaluation(params.id);
  const existingRewrites = useRewrites(params.id);

  const handleGenerate = () => {
    requestRewrite.mutate({ submissionId: params.id, mode, targetBand });
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
        ⚠️ Reference Model Answer — for learning purposes only. Choose your target band below.
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

      {currentBand != null && currentBand < 5 && (
        <div className="mt-4">
          <label className="text-sm font-medium text-muted-foreground">Target Band</label>
          <div className="mt-1.5 flex gap-2">
            {Array.from({ length: 5 - currentBand }, (_, i) => currentBand + 1 + i).map((band) => (
              <button
                key={band}
                onClick={() => setTargetBand(band === (targetBand ?? currentBand + 1) ? undefined : band)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                  (targetBand ?? currentBand + 1) === band
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                Band {band}
              </button>
            ))}
          </div>
        </div>
      )}

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

          {rewrite.band_justification && (
            <div className="mb-6 rounded-lg border border-indigo-200 bg-indigo-50/50 p-5">
              <h3 className="text-sm font-semibold text-indigo-900">
                Why this rewrite scores Band {rewrite.target_band}
              </h3>
              <p className="mt-2 text-sm text-indigo-800">
                {rewrite.band_justification.summary}
              </p>

              {rewrite.band_justification.keyChanges?.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                    Key Changes
                  </h4>
                  {rewrite.band_justification.keyChanges.map((change, i) => (
                    <div key={i} className="rounded-md border border-indigo-100 bg-white p-3">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <span className="text-xs font-medium text-red-600">Before</span>
                          <p className="mt-0.5 text-sm text-gray-700 italic">&ldquo;{change.original}&rdquo;</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-green-600">After</span>
                          <p className="mt-0.5 text-sm text-gray-700 italic">&ldquo;{change.rewritten}&rdquo;</p>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-indigo-700">
                        <span className="font-medium">Why:</span> {change.reason}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* View toggle */}
          {rewrite.paragraph_annotations && rewrite.paragraph_annotations.length > 0 && (
            <div className="mb-4 flex gap-2">
              {(['annotated', 'diff'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                    view === v ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {v === 'annotated' ? 'Annotated Rewrite' : 'Diff View'}
                </button>
              ))}
            </div>
          )}

          {/* Annotated view — paragraph by paragraph with coaching notes */}
          {view === 'annotated' && rewrite.paragraph_annotations && rewrite.paragraph_annotations.length > 0 ? (
            <div className="space-y-1">
              {stripMarkdownFences(rewrite.rewritten_text)
                .split(/\n\n+/)
                .map((paragraph, idx) => {
                  const annotation = rewrite.paragraph_annotations?.find(
                    (a) => a.paragraphIndex === idx,
                  );
                  return (
                    <div key={idx}>
                      <p className="text-sm leading-relaxed text-gray-900">{paragraph}</p>
                      {annotation && (
                        <div className="my-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2">
                          <span
                            className={`mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none ${getDimensionStyle(annotation.dimension)}`}
                          >
                            {annotation.dimension}
                          </span>
                          <p className="text-xs leading-snug text-amber-900">
                            {annotation.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ) : (
            <DiffView
              original={originalText}
              rewritten={stripMarkdownFences(rewrite.rewritten_text)}
              diffPayload={rewrite.diff_payload as Array<{ type: 'add' | 'remove' | 'unchanged'; value: string }> | undefined}
              rationale={rationale}
            />
          )}
        </div>
      )}
    </div>
  );
}
