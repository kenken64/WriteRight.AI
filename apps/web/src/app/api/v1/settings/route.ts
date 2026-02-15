import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  notificationPrefs: z.object({
    email: z.boolean(),
    push: z.boolean(),
  }).optional(),
});

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, email, notification_prefs')
    .eq('id', user.id)
    .single();

  return NextResponse.json({
    displayName: profile?.display_name ?? user.user_metadata?.display_name ?? '',
    email: profile?.email ?? user.email ?? '',
    notificationPrefs: profile?.notification_prefs ?? { email: true, push: true },
    role: user.user_metadata?.role ?? 'student',
  });
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = updateSettingsSchema.parse(body);

    const updates: Record<string, unknown> = {};
    if (parsed.displayName !== undefined) updates.display_name = parsed.displayName;
    if (parsed.notificationPrefs !== undefined) updates.notification_prefs = parsed.notificationPrefs;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ updated: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.errors }, { status: 422 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
