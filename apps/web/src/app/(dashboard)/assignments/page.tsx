import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function AssignmentsPage() {
  const supabase = createServerSupabaseClient();
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*, topic:topics(*)')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold md:text-3xl">Assignments</h1>
        <Link
          href="/assignments/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 min-h-[44px] flex items-center justify-center"
        >
          New Assignment
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {assignments && assignments.length > 0 ? (
          assignments.map((a: any) => (
            <Link
              key={a.id}
              href={`/assignments/${a.id}`}
              className="block rounded-lg border bg-white p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-medium">{a.prompt.slice(0, 100)}...</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {a.essay_type} · {a.essay_sub_type ?? 'General'} · {a.word_count_min}-{a.word_count_max} words
                  </p>
                </div>
                <span className="rounded-full bg-muted px-2 py-1 text-xs capitalize">
                  {a.status}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border bg-white py-20 px-6 text-center animate-fade-in">
            <span className="text-6xl">✏️</span>
            <h3 className="mt-6 text-xl font-bold text-gray-900">Start your writing journey</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Create your first assignment and begin improving your essay skills with AI-powered feedback.
            </p>
            <Link
              href="/assignments/new"
              className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              Create your first assignment
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
