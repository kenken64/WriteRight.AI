'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { loginSchema } from '@/lib/validators/schemas';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (!errors[field]) errors[field] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/assignments');
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center gap-3"><img src="/logo.jpg" alt="WriteRight AI" className="h-10 w-10 rounded-full object-cover" /><span className="text-2xl font-bold">WriteRight SG</span></div>
          </Link>
        </div>
        
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            Better essays start<br />with better feedback.
          </h2>
          <p className="mt-4 text-lg text-blue-100 leading-relaxed">
            AI-powered marking aligned to Singapore&apos;s Singapore secondary school English syllabus. 
            Get instant, specific feedback that helps you improve.
          </p>
          
          <div className="mt-10 grid grid-cols-2 gap-6">
            <div>
              <p className="text-3xl font-bold">70%+</p>
              <p className="mt-1 text-sm text-blue-200">Teacher agreement rate</p>
            </div>
            <div>
              <p className="text-3xl font-bold">&lt;5 min</p>
              <p className="mt-1 text-sm text-blue-200">Feedback delivery</p>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-blue-200">
          © {new Date().getFullYear()} WriteRight SG
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center gap-2"><img src="/logo.jpg" alt="WriteRight AI" className="h-8 w-8 rounded-full object-cover" /><span className="text-xl font-bold text-gray-900">WriteRight <span className="text-blue-600">SG</span></span></div>
            </Link>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Welcome back</h1>
            <p className="mt-2 text-sm text-gray-500">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-medium text-blue-600 hover:text-blue-700">
                Sign up for free
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`mt-1.5 block w-full rounded-xl border ${fieldErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'} bg-gray-50 px-4 py-3 text-sm transition-colors focus:bg-white focus:outline-none focus:ring-1`}
              />
              {fieldErrors.email && (
                <p className="mt-1.5 text-xs text-red-500">{fieldErrors.email}</p>
              )}
            </div>
            
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`mt-1.5 block w-full rounded-xl border ${fieldErrors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'} bg-gray-50 px-4 py-3 text-sm transition-colors focus:bg-white focus:outline-none focus:ring-1`}
              />
              {fieldErrors.password && (
                <p className="mt-1.5 text-xs text-red-500">{fieldErrors.password}</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Logging in...
                </span>
              ) : (
                'Log in'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              By logging in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
