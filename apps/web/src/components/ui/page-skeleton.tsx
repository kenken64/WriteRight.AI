export function PageSkeleton() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar skeleton - desktop only */}
      <aside className="hidden w-64 flex-shrink-0 border-r bg-white p-4 md:block">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-5 w-5 animate-pulse rounded bg-muted" />
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </aside>

      {/* Main content skeleton */}
      <main className="flex-1 bg-muted/30 p-4 md:p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-white p-6">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
