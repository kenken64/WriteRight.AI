'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const router = useRouter();

  // Handle recovery session from multiple flows:
  // 1. Hash fragments (#access_token=xxx&type=recovery) — implicit flow
  // 2. Query params (?code=xxx) — PKCE flow
  // 3. Existing session cookies — came via server callback
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    // Listen for auth events (implicit flow hash detection)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        if (!cancelled) setSessionReady(true);
      }
    });

    async function initSession() {
      // Check for PKCE code in URL query params
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && !cancelled) {
          setSessionReady(true);
          // Clean up URL
          window.history.replaceState({}, '', '/reset-password');
          return;
        }
        if (error) console.error('Code exchange failed:', error.message);
      }

      // Check for token_hash in URL query params (server-side redirect passthrough)
      const tokenHash = params.get('token_hash');
      const type = params.get('type');
      if (tokenHash && type === 'recovery') {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
        if (!error && !cancelled) {
          setSessionReady(true);
          window.history.replaceState({}, '', '/reset-password');
          return;
        }
        if (error) console.error('Token verification failed:', error.message);
      }

      // Check for existing session (came via server callback with cookies)
      const { data: { user } } = await supabase.auth.getUser();
      if (user && !cancelled) {
        setSessionReady(true);
        return;
      }

      // If nothing worked after checking everything, wait a bit for hash detection
      // then show error
      setTimeout(() => {
        if (!cancelled) {
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user && !cancelled) {
              setError('Reset link expired or already used. Please request a new one.');
            }
          });
        }
      }, 2000);
    }

    initSession();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!sessionReady) {
      setError('Auth session missing! Please use a fresh reset link from your email.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      // Sign out so they can log in with new password
      await supabase.auth.signOut();
      setTimeout(() => router.push('/login'), 2000);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center gap-3"><img src="/logo.jpg" alt="WriteRight SG" className="h-10 w-10 rounded-full object-cover" /><span className="text-2xl font-bold">WriteRight SG</span></div>
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
        </div>
        
        <p className="text-sm text-blue-200">
          © {new Date().getFullYear()} WriteRight SG
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center gap-2"><img src="/logo.jpg" alt="WriteRight SG" className="h-8 w-8 rounded-full object-cover" /><span className="text-xl font-bold text-gray-900">WriteRight <span className="text-blue-600">SG</span></span></div>
            </Link>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Set new password</h1>
            <p className="mt-2 text-sm text-gray-500">
              Enter your new password below.
            </p>
          </div>

          {success ? (
            <div className="mt-8 space-y-5">
              <div className="flex items-start gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-700">
                <span className="mt-0.5">✅</span>
                <span>Password updated successfully! Redirecting to login...</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  <span className="mt-0.5">⚠️</span>
                  <span>{error}</span>
                </div>
              )}
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  New password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1.5 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-11 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 mt-[3px] text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1.5 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-11 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 mt-[3px] text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
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
                    Updating...
                  </span>
                ) : (
                  'Reset Password'
                )}
              </button>

              <div className="text-center">
                <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  ← Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
