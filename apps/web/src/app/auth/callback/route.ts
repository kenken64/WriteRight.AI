import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const next = searchParams.get('next') ?? '/assignments';
  const type = searchParams.get('type');

  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost || request.headers.get('host') || '';
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const origin = `${protocol}://${host}`;

  const createSupabaseWithResponse = (response: NextResponse) => {
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: '', ...options });
          },
        },
      },
    );
  };

  // Handle token_hash (implicit flow - recovery or email confirmation)
  if (tokenHash) {
    const redirectTarget = type === 'recovery' ? '/reset-password' : next;
    const response = NextResponse.redirect(`${origin}${redirectTarget}`);
    const supabase = createSupabaseWithResponse(response);
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: (type as 'recovery' | 'signup' | 'email') || 'recovery',
    });
    if (!error) {
      return response;
    }
    console.error('verifyOtp error:', error.message);
  }

  // Handle code (PKCE flow or OAuth)
  if (code) {
    const redirectTarget = type === 'recovery' ? '/reset-password' : next;
    const response = NextResponse.redirect(`${origin}${redirectTarget}`);
    const supabase = createSupabaseWithResponse(response);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }
    console.error('exchangeCodeForSession error:', error.message);
  }

  // If we get here with no code/token, redirect with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
