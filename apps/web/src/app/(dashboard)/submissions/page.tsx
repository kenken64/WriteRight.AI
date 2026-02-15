import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatStatus, formatRelativeDate } from '@/lib/utils/format';

export default async function SubmissionsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*, assignment:assignments(prompt, essay_type)')
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold md:text-3xl">Submissions</h1>
      <div className="mt-6 space-y-4">
        {submissions && submissions.length > 0 ? (
          submissions.map((sub: any) => {
            const status = formatStatus(sub.status);
            return (
              <Link
                key={sub.id}
                href={`/submissions/${sub.id}`}
                className="block rounded-lg border bg-white p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-medium">
                      {sub.assignment?.prompt?.slice(0, 80)}...
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {sub.assignment?.essay_type} · {formatRelativeDate(sub.created_at)}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border bg-white py-20 px-6 text-center animate-fade-in">
            <span className="text-6xl">📄</span>
            <h3 className="mt-6 text-xl font-bold text-gray-900">No essays submitted yet</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Submit your first essay to get instant AI feedback and start tracking your progress.
            </p>
            <Link
              href="/assignments"
              className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              Go to assignments
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
