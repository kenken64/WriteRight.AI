import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = user.user_metadata?.role;
  if (role !== 'student') {
    return NextResponse.json({ error: 'Only students can view invite codes' }, { status: 403 });
  }

  // Get student profile
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
  }

  // Get active invite code
  const { data: code, error } = await supabase
    .from('invite_codes')
    .select('*')
    .eq('student_id', profile.id)
    .eq('is_active', true)
    .single();

  if (error || !code) {
    return NextResponse.json({ error: 'No active invite code found' }, { status: 404 });
  }

  return NextResponse.json({ inviteCode: code });
}
