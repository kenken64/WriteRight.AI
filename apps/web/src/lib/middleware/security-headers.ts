import { NextResponse } from 'next/server';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https:",
  "font-src 'self'",
  "frame-src 'self' https://*.supabase.co",
  "connect-src 'self' https://*.supabase.co https://api.openai.com https://api.stripe.com",
].join('; ');

/**
 * Apply security headers to the response.
 */
export function applySecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Content-Security-Policy', CSP);

  if (IS_PRODUCTION) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );
  }
}
