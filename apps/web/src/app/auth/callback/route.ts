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

  // Determine where to redirect after auth
  const isRecovery = type === 'recovery';
  const redirectTarget = isRecovery ? '/reset-password' : next;

  // Handle token_hash — try verifyOtp first, if that fails with PKCE token,
  // pass it through to the client by appending as query params
  if (tokenHash) {
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

    // If verifyOtp failed (e.g. PKCE token), pass token through to client
    if (isRecovery) {
      const clientUrl = new URL(`${origin}/reset-password`);
      clientUrl.searchParams.set('token_hash', tokenHash);
      clientUrl.searchParams.set('type', 'recovery');
      return NextResponse.redirect(clientUrl.toString());
    }
  }

  // Handle code (PKCE flow or OAuth)
  if (code) {
    const response = NextResponse.redirect(`${origin}${redirectTarget}`);
    const supabase = createSupabaseWithResponse(response);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }
    console.error('exchangeCodeForSession error:', error.message);

    // If server exchange failed, pass code to client to try
    if (isRecovery) {
      return NextResponse.redirect(`${origin}/reset-password?code=${code}`);
    }
  }

  // If we get here with no code/token, redirect with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
