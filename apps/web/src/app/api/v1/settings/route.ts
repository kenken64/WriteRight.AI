import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  notificationPrefs: z.object({
    email: z.boolean(),
    push: z.boolean(),
  }).optional(),
  parentType: z.enum(['parent', 'school_teacher', 'tuition_teacher']).optional(),
});

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, email, notification_prefs, parent_type')
    .eq('id', user.id)
    .single();

  const role = user.user_metadata?.role ?? 'student';

  const response: Record<string, unknown> = {
    displayName: profile?.display_name ?? user.user_metadata?.display_name ?? '',
    email: profile?.email ?? user.email ?? '',
    notificationPrefs: profile?.notification_prefs ?? { email: true, push: true },
    role,
  };

  if (role === 'parent') {
    response.parentType = profile?.parent_type ?? 'parent';

    // Fetch linked children
    const { data: links } = await supabase
      .from('parent_student_links')
      .select('student_id, student_profiles(display_name, level, user_id)')
      .eq('parent_id', user.id);

    if (links) {
      // Get student emails from users table
      const studentUserIds = links
        .map((l: Record<string, unknown>) => {
          const sp = l.student_profiles as { user_id: string } | null;
          return sp?.user_id;
        })
        .filter(Boolean) as string[];

      let emailMap: Record<string, string> = {};
      if (studentUserIds.length > 0) {
        const { data: studentUsers } = await supabase
          .from('users')
          .select('id, email')
          .in('id', studentUserIds);
        if (studentUsers) {
          emailMap = Object.fromEntries(studentUsers.map((u: { id: string; email: string | null }) => [u.id, u.email ?? '']));
        }
      }

      response.linkedChildren = links.map((link: Record<string, unknown>) => {
        const sp = link.student_profiles as { display_name: string; level: string; user_id: string } | null;
        return {
          displayName: sp?.display_name ?? '',
          level: sp?.level ?? '',
          email: sp ? (emailMap[sp.user_id] ?? '') : '',
        };
      });
    } else {
      response.linkedChildren = [];
    }
  } else {
    // Student: fetch linked guardians
    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (studentProfile) {
      const { data: links } = await supabase
        .from('parent_student_links')
        .select('parent_id, users!parent_student_links_parent_id_fkey(display_name, email, parent_type)')
        .eq('student_id', studentProfile.id);

      if (links) {
        response.linkedGuardians = links.map((link: Record<string, unknown>) => {
          const parent = link.users as { display_name: string | null; email: string | null; parent_type: string | null } | null;
          return {
            displayName: parent?.display_name ?? 'Guardian',
            email: parent?.email ?? '',
            parentType: parent?.parent_type ?? 'parent',
          };
        });
      } else {
        response.linkedGuardians = [];
      }
    } else {
      response.linkedGuardians = [];
    }
  }

  return NextResponse.json(response);
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
    if (parsed.parentType !== undefined) updates.parent_type = parsed.parentType;

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

    // Sync display_name to student_profiles so performance page + parent dashboard stay current
    if (parsed.displayName !== undefined) {
      await supabase
        .from('student_profiles')
        .update({ display_name: parsed.displayName })
        .eq('user_id', user.id);
    }

    // Invalidate cached layout so sidebar reflects updated names
    revalidatePath('/', 'layout');

    return NextResponse.json({ updated: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.errors }, { status: 422 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
