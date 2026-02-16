import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { parentOnboardSchema } from '@/lib/validators/schemas';
import { ensureUserRow, markOnboarded } from '@/lib/supabase/ensure-user-row';
import { z } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = user.user_metadata?.role;
    if (role !== 'parent') {
      return NextResponse.json({ error: 'Only parents can use this endpoint' }, { status: 403 });
    }

    const body = await req.json();
    const { inviteCode, parentType } = parentOnboardSchema.parse(body);

    // Ensure parent's users row exists first (needed for FK on parent_student_links)
    const ensureResult = await ensureUserRow(supabase, user);
    if (ensureResult.error) {
      console.error('[onboard/parent] ensureUserRow error:', ensureResult.error);
      return NextResponse.json({ error: ensureResult.error }, { status: 500 });
    }

    // Look up the invite code
    const { data: codeRecord, error: lookupError } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', inviteCode.toUpperCase())
      .eq('is_active', true)
      .single();

    if (lookupError || !codeRecord) {
      console.error('[onboard/parent] Code lookup failed:', lookupError?.message);
      return NextResponse.json({ error: 'Invalid or expired invite code' }, { status: 404 });
    }

    // Check if code is expired
    if (new Date(codeRecord.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invite code has expired' }, { status: 410 });
    }

    // Check if already claimed
    if (codeRecord.claimed_by) {
      return NextResponse.json({ error: 'This invite code has already been claimed' }, { status: 409 });
    }

    // Create parent-student link
    const { error: linkError } = await supabase
      .from('parent_student_links')
      .insert({
        parent_id: user.id,
        student_id: codeRecord.student_id,
      });

    if (linkError) {
      console.error('[onboard/parent] Link error:', linkError.message);
      if (linkError.message.includes('duplicate') || linkError.message.includes('unique')) {
        return NextResponse.json({ error: 'You are already linked to this student' }, { status: 409 });
      }
      return NextResponse.json({ error: linkError.message }, { status: 500 });
    }

    // Mark code as claimed
    await supabase
      .from('invite_codes')
      .update({
        claimed_by: user.id,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', codeRecord.id);

    // Save parent type
    if (parentType) {
      await supabase
        .from('users')
        .update({ parent_type: parentType })
        .eq('id', user.id);
    }

    // Mark user as onboarded
    const onboardResult = await markOnboarded(supabase, user);
    if (onboardResult.error) {
      console.error('[onboard/parent] markOnboarded error:', onboardResult.error);
      return NextResponse.json({ error: onboardResult.error }, { status: 500 });
    }

    return NextResponse.json({ linked: true, studentId: codeRecord.student_id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.errors }, { status: 422 });
    }
    console.error('[onboard/parent] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
