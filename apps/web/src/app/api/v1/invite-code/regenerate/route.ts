import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const INVITE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)];
  }
  return code;
}

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = user.user_metadata?.role;
  if (role !== 'student') {
    return NextResponse.json({ error: 'Only students can regenerate invite codes' }, { status: 403 });
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

  // Deactivate current active code
  await supabase
    .from('invite_codes')
    .update({ is_active: false })
    .eq('student_id', profile.id)
    .eq('is_active', true);

  // Generate new code with retry on collision
  let code = '';
  let inserted = false;
  for (let attempt = 0; attempt < 10; attempt++) {
    code = generateCode();
    const { error } = await supabase
      .from('invite_codes')
      .insert({
        code,
        student_id: profile.id,
        is_active: true,
      });

    if (!error) {
      inserted = true;
      break;
    }
    if (!error.message.includes('unique') && !error.message.includes('duplicate')) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (!inserted) {
    return NextResponse.json({ error: 'Failed to generate unique invite code' }, { status: 500 });
  }

  return NextResponse.json({ inviteCode: code });
}
