import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> },
) {
  const { noteId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (typeof body.content === 'string') {
    const content = body.content.trim();
    if (content.length < 1 || content.length > 1000) {
      return NextResponse.json(
        { error: 'Content must be between 1 and 1000 characters' },
        { status: 400 },
      );
    }
    updates.content = content;
  }

  if (typeof body.priority === 'string') {
    const validPriorities = ['high', 'medium', 'low'];
    if (!validPriorities.includes(body.priority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
    }
    updates.priority = body.priority;
  }

  if (typeof body.is_done === 'boolean') {
    updates.is_done = body.is_done;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('student_notes')
    .update(updates)
    .eq('id', noteId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ note: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> },
) {
  const { noteId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('student_notes')
    .delete()
    .eq('id', noteId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
