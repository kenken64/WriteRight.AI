import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('student_notes')
    .select('*')
    .eq('submission_id', id)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notes: data });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (content.length < 1 || content.length > 1000) {
    return NextResponse.json(
      { error: 'Content must be between 1 and 1000 characters' },
      { status: 400 },
    );
  }

  const validPriorities = ['high', 'medium', 'low'];
  const priority = validPriorities.includes(body.priority) ? body.priority : 'medium';

  // Look up the student profile for the current user
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Student profile not found' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('student_notes')
    .insert({ submission_id: id, student_id: profile.id, content, priority })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ note: data }, { status: 201 });
}
