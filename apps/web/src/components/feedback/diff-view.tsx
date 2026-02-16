'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

interface DiffChange {
  type: 'add' | 'remove' | 'unchanged';
  value: string;
}

interface DiffViewProps {
  original: string;
  rewritten: string;
  diffPayload?: DiffChange[];
  rationale?: Array<{ category: string; explanation: string }>;
}

/**
 * Strip markdown syntax for cleaner diffing (bold, italic, headers, lists markers).
 */
function stripMarkdownSyntax(text: string): string {
  return text
    // Remove code fences
    .replace(/```[\s\S]*?```/g, '')
    // Remove bold/italic markers
    .replace(/\*{1,3}(.*?)\*{1,3}/g, '$1')
    .replace(/_{1,3}(.*?)_{1,3}/g, '$1')
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    .trim();
}

/**
 * Sentence-level diff for cleaner results (avoids breaking on markdown syntax).
 */
function splitSentences(text: string): string[] {
  // Split on sentence boundaries, keeping the delimiter
  return text.split(/(?<=[.!?])\s+/).filter(Boolean);
}

function computeSentenceDiff(original: string, rewritten: string): DiffChange[] {
  const cleanOrig = stripMarkdownSyntax(original);
  const cleanRewrite = stripMarkdownSyntax(rewritten);

  const oldSentences = splitSentences(cleanOrig);
  const newSentences = splitSentences(cleanRewrite);

  const m = oldSentences.length;
  const n = newSentences.length;

  // LCS DP
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldSentences[i - 1] === newSentences[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack
  const stack: DiffChange[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldSentences[i - 1] === newSentences[j - 1]) {
      stack.push({ type: 'unchanged', value: oldSentences[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: 'add', value: newSentences[j - 1] });
      j--;
    } else {
      stack.push({ type: 'remove', value: oldSentences[i - 1] });
      i--;
    }
  }
  stack.reverse();

  // Merge consecutive same-type
  const changes: DiffChange[] = [];
  for (const change of stack) {
    const last = changes[changes.length - 1];
    if (last && last.type === change.type) {
      last.value += ' ' + change.value;
    } else {
      changes.push({ ...change });
    }
  }

  return changes;
}

function DiffHighlightedText({ diff, side }: { diff: DiffChange[]; side: 'original' | 'rewritten' }) {
  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed">
      {diff.map((change, i) => {
        if (change.type === 'unchanged') {
          return <span key={i}>{change.value} </span>;
        }
        if (side === 'original' && change.type === 'remove') {
          return (
            <span key={i} className="bg-red-100 text-red-800 line-through decoration-red-400">
              {change.value}{' '}
            </span>
          );
        }
        if (side === 'rewritten' && change.type === 'add') {
          return (
            <span key={i} className="bg-green-100 text-green-800">
              {change.value}{' '}
            </span>
          );
        }
        return null;
      })}
    </div>
  );
}

export function DiffView({ original, rewritten, diffPayload, rationale }: DiffViewProps) {
  const diff = useMemo(() => {
    if (diffPayload && diffPayload.length > 0) return diffPayload;
    if (!original || !rewritten) return [];
    return computeSentenceDiff(original, rewritten);
  }, [original, rewritten, diffPayload]);

  const hasDiff = diff.length > 0;

  return (
    <div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">📝 Original</h3>
          {hasDiff ? (
            <DiffHighlightedText diff={diff} side="original" />
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{original}</ReactMarkdown>
            </div>
          )}
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50/50 p-4">
          <h3 className="mb-3 text-sm font-medium text-green-700">✨ Rewrite (Reference Model Answer)</h3>
          {hasDiff ? (
            <DiffHighlightedText diff={diff} side="rewritten" />
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{rewritten}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      {rationale && rationale.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium">Why these changes?</h3>
          <div className="mt-3 space-y-2">
            {rationale.map((r, i) => (
              <div key={i} className="rounded-md border bg-white p-3">
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                  {r.category}
                </span>
                <p className="mt-1 text-sm text-muted-foreground">{r.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
