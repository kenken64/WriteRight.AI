import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.jpg" alt="WriteRight AI" className="h-8 w-8 rounded-full object-cover" />
            <span className="text-xl font-bold text-gray-900">
              WriteRight <span className="text-blue-600">SG</span>
            </span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              Start Free
            </Link>
          </nav>
        </div>
      </header>

      {/* 404 Content */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="relative">
          <span className="text-[120px] font-extrabold leading-none text-gray-100 sm:text-[180px]">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl">✏️</span>
          </div>
        </div>

        <h1 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">
          Page not found
        </h1>
        <p className="mt-3 max-w-md text-gray-500">
          Looks like this essay is still a draft. The page you&apos;re looking for
          doesn&apos;t exist or has been moved.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/register"
            className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Try Free — 3 Essays/Month
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-6">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} WriteRight SG. Built for Singapore students.
          </p>
        </div>
      </footer>
    </div>
  );
}
