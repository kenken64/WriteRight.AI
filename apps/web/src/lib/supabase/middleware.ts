import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users from dashboard routes
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/assignments') ||
    request.nextUrl.pathname.startsWith('/submissions') ||
    request.nextUrl.pathname.startsWith('/topics') ||
    request.nextUrl.pathname.startsWith('/achievements') ||
    request.nextUrl.pathname.startsWith('/wishlist') ||
    request.nextUrl.pathname.startsWith('/rewards') ||
    request.nextUrl.pathname.startsWith('/analytics') ||
    request.nextUrl.pathname.startsWith('/settings') ||
    request.nextUrl.pathname.startsWith('/trophy-case') ||
    request.nextUrl.pathname.startsWith('/performance');

  const isOnboardRoute = request.nextUrl.pathname === '/onboard';

  // Redirect unauthenticated users from protected routes (dashboard + onboard)
  if (!user && (isDashboardRoute || isOnboardRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages (but allow reset-password and forgot-password)
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
    // Don't redirect if coming from a password reset flow
    const isResetFlow = request.nextUrl.searchParams.get('redirect')?.includes('reset-password');
    if (!isResetFlow) {
      const url = request.nextUrl.clone();
      url.pathname = '/assignments';
      return NextResponse.redirect(url);
    }
  }

  // Onboarding gate: check if authenticated user has completed onboarding
  if (user && (isDashboardRoute || isOnboardRoute)) {
    const { data: userData } = await supabase
      .from('users')
      .select('onboarded')
      .eq('id', user.id)
      .single();

    const onboarded = userData?.onboarded ?? false;

    // Un-onboarded user hitting dashboard → redirect to /onboard
    if (!onboarded && isDashboardRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/onboard';
      return NextResponse.redirect(url);
    }

    // Already-onboarded user hitting /onboard → redirect to /assignments
    if (onboarded && isOnboardRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/assignments';
      return NextResponse.redirect(url);
    }
  }

  return response;
}
