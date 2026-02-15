import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { markOnboarded } from '@/lib/supabase/ensure-user-row';

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = user.user_metadata?.role;
    if (role !== 'parent') {
      return NextResponse.json({ error: 'Only parents can use this endpoint' }, { status: 403 });
    }

    const result = await markOnboarded(supabase, user);
    if (result.error) {
      console.error('[onboard/parent/skip]', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ skipped: true });
  } catch (err) {
    console.error('[onboard/parent/skip] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
