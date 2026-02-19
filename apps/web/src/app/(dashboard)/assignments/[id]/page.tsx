import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AssignmentDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: assignment } = await supabase
    .from('assignments')
    .select('*, submissions(*)')
    .eq('id', id)
    .single();

  if (!assignment) notFound();

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <Link href="/assignments" className="text-sm text-muted-foreground hover:underline">
            ← Back to Assignments
          </Link>
          <h1 className="mt-2 text-2xl font-bold md:text-3xl">Assignment</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {assignment.essay_type} · {assignment.essay_sub_type} · {assignment.word_count_min}-
            {assignment.word_count_max} words
          </p>
        </div>
        <Link
          href={`/submissions/new?assignmentId=${assignment.id}`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          Submit Essay
        </Link>
      </div>

      <div className="mt-6 rounded-lg border bg-white p-4">
        <h3 className="text-sm font-medium">Prompt</h3>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground break-words">
          {assignment.prompt}
        </p>
      </div>

      {assignment.guiding_points && (
        <div className="mt-6 rounded-lg border bg-white p-4">
          <h3 className="font-medium">Guiding Points</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {(assignment.guiding_points as string[]).map((point: string, i: number) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="mt-8 text-lg font-semibold">Submissions</h2>
      <div className="mt-4 space-y-3">
        {assignment.submissions?.length ? (
          assignment.submissions.map((sub: any) => (
            <Link
              key={sub.id}
              href={`/submissions/${sub.id}`}
              className="block rounded-lg border bg-white p-4 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">{new Date(sub.created_at).toLocaleDateString('en-SG')}</span>
                <span className="rounded-full bg-muted px-2 py-1 text-xs capitalize">{sub.status}</span>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No submissions yet.</p>
        )}
      </div>
    </div>
  );
}
