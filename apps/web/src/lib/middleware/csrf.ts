import { NextRequest, NextResponse } from 'next/server';

const CSRF_COOKIE = 'csrf-token';
const CSRF_HEADER = 'x-csrf-token';
const TOKEN_LENGTH = 32;

function generateToken(): string {
  const bytes = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * CSRF middleware for Next.js Edge middleware.
 *
 * - On GET requests: sets a CSRF cookie if not present.
 * - On POST/PUT/PATCH/DELETE: validates the X-CSRF-Token header matches the cookie.
 * - Skips Stripe webhooks (signature-verified) and Supabase auth callbacks.
 */
export function csrfProtection(
  req: NextRequest,
  response: NextResponse,
): NextResponse | null {
  const path = req.nextUrl.pathname;

  // Skip paths that use their own verification or are form-submitted
  if (path.startsWith('/api/v1/webhooks/stripe')) return null;
  if (path.startsWith('/auth/callback')) return null;
  if (path.startsWith('/api/auth/callback')) return null;
  if (path.startsWith('/api/v1/auth/')) return null; // login, register, logout, forgot-password, reset-password

  const method = req.method.toUpperCase();

  // Set CSRF cookie on any GET request (page loads + API GETs) if not present
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    if (!req.cookies.get(CSRF_COOKIE)?.value) {
      const token = generateToken();
      response.cookies.set(CSRF_COOKIE, token, {
        httpOnly: false, // Must be readable by JS
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
    }
    return null; // Continue
  }

  // Only validate CSRF on API routes
  if (!path.startsWith('/api/')) return null;

  // Mutating request — validate token
  const cookieToken = req.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = req.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return NextResponse.json(
      { error: 'CSRF token missing or invalid' },
      { status: 403 },
    );
  }

  return null; // Valid — continue
}
