import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ScoreCard } from '@/components/feedback/score-card';
import { FeedbackItem } from '@/components/feedback/feedback-item';
import Link from 'next/link';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FeedbackPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: evaluation } = await supabase
    .from('evaluations')
    .select('*')
    .eq('submission_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!evaluation) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link href={`/submissions/${id}`} className="text-sm text-muted-foreground hover:underline">
        ← Back to Submission
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Feedback</h1>

      <ScoreCard
        totalScore={evaluation.total_score}
        band={evaluation.band}
        dimensions={evaluation.dimension_scores as any}
        confidence={evaluation.confidence}
        reviewRecommended={evaluation.review_recommended}
      />

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-green-600">💪 Strengths</h2>
        <div className="mt-4 space-y-3">
          {(evaluation.strengths as any[]).map((s: any, i: number) => (
            <FeedbackItem key={i} type="strength" text={s.text} quote={s.quote} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-orange-600">📝 Areas for Improvement</h2>
        <div className="mt-4 space-y-3">
          {(evaluation.weaknesses as any[]).map((w: any, i: number) => (
            <FeedbackItem
              key={i}
              type="weakness"
              text={w.text}
              quote={w.quote}
              suggestion={w.suggestion}
            />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">🎯 Next Steps</h2>
        <ol className="mt-4 list-inside list-decimal space-y-2 text-sm">
          {(evaluation.next_steps as string[]).map((step: string, i: number) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
