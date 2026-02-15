import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { studentOnboardSchema } from '@/lib/validators/schemas';
import { ensureUserRow, markOnboarded } from '@/lib/supabase/ensure-user-row';
import { z } from 'zod';

const INVITE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)];
  }
  return code;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = user.user_metadata?.role;
    if (role !== 'student') {
      return NextResponse.json({ error: 'Only students can use this endpoint' }, { status: 403 });
    }

    const body = await req.json();
    const { level, displayName } = studentOnboardSchema.parse(body);

    // Ensure public.users row exists
    const ensureResult = await ensureUserRow(supabase, user);
    if (ensureResult.error) {
      return NextResponse.json({ error: ensureResult.error }, { status: 500 });
    }

    // Check if student profile already exists
    const { data: existing } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Student profile already exists' }, { status: 409 });
    }

    // Create student profile
    const { data: profile, error: profileError } = await supabase
      .from('student_profiles')
      .insert({
        user_id: user.id,
        display_name: displayName,
        level,
      })
      .select()
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Generate unique invite code with retry on collision
    let code: string = '';
    let codeInserted = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      code = generateCode();
      const { error: codeError } = await supabase
        .from('invite_codes')
        .insert({
          code,
          student_id: profile.id,
          is_active: true,
        });

      if (!codeError) {
        codeInserted = true;
        break;
      }
      // If unique violation, retry with new code
      if (!codeError.message.includes('unique') && !codeError.message.includes('duplicate')) {
        return NextResponse.json({ error: codeError.message }, { status: 500 });
      }
    }

    if (!codeInserted) {
      return NextResponse.json({ error: 'Failed to generate unique invite code' }, { status: 500 });
    }

    // Mark user as onboarded
    const onboardResult = await markOnboarded(supabase, user);
    if (onboardResult.error) {
      return NextResponse.json({ error: onboardResult.error }, { status: 500 });
    }

    return NextResponse.json({ profile, inviteCode: code });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.errors }, { status: 422 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
