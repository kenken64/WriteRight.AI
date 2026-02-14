'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { registerSchema } from '@/lib/validators/schemas';

type Role = 'parent' | 'student';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<Role>('parent');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const result = registerSchema.safeParse({ displayName, email, password, role });
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
    const { error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        data: { role: result.data.role, display_name: result.data.displayName },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/onboard');
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between bg-gradient-to-br from-indigo-600 to-blue-700 p-12 text-white">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center gap-3"><img src="/logo.jpg" alt="WriteRight AI" className="h-10 w-10 rounded-full object-cover" /><span className="text-2xl font-bold">WriteRight SG</span></div>
          </Link>
        </div>
        
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            Start your journey<br />to better writing.
          </h2>
          <p className="mt-4 text-lg text-indigo-100 leading-relaxed">
            Join thousands of Singapore students improving their English essays with AI-powered feedback.
          </p>
          
          <div className="mt-10 space-y-4">
            {[
              { emoji: '📊', text: 'MOE 1184 aligned scoring' },
              { emoji: '✏️', text: 'Built-in editor with AI coach' },
              { emoji: '🏆', text: 'Achievement badges & rewards' },
              { emoji: '📈', text: 'Track improvement over time' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="text-xl">{item.emoji}</span>
                <span className="text-indigo-100">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
        
        <p className="text-sm text-indigo-200">
          © {new Date().getFullYear()} WriteRight SG
        </p>
      </div>

      {/* Right panel — register form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center gap-2"><img src="/logo.jpg" alt="WriteRight AI" className="h-8 w-8 rounded-full object-cover" /><span className="text-xl font-bold text-gray-900">WriteRight <span className="text-blue-600">SG</span></span></div>
            </Link>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Create your account</h1>
            <p className="mt-2 text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
                Log in
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

            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700">I am a...</label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {(['parent', 'student'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                      role === r 
                        ? 'border-blue-600 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span>{r === 'parent' ? '👨‍👩‍👧' : '🎓'}</span>
                    <span className="capitalize">{r}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Display Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={role === 'parent' ? 'Your name' : 'Your name or nickname'}
                className={`mt-1.5 block w-full rounded-xl border ${fieldErrors.displayName ? 'border-red-300' : 'border-gray-200'} bg-gray-50 px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
              {fieldErrors.displayName && (
                <p className="mt-1.5 text-xs text-red-500">{fieldErrors.displayName}</p>
              )}
            </div>

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
                className={`mt-1.5 block w-full rounded-xl border ${fieldErrors.email ? 'border-red-300' : 'border-gray-200'} bg-gray-50 px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
              {fieldErrors.email && (
                <p className="mt-1.5 text-xs text-red-500">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className={`mt-1.5 block w-full rounded-xl border ${fieldErrors.password ? 'border-red-300' : 'border-gray-200'} bg-gray-50 px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500`}
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
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>

            <p className="text-center text-xs text-gray-400">
              🎁 Includes 7-day free trial of WriteRight Plus
            </p>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
