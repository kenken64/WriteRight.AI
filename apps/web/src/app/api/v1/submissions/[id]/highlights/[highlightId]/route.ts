import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const VALID_COLORS = ['yellow', 'green', 'blue', 'pink', 'orange'];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; highlightId: string }> },
) {
  const { highlightId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  // Build the update payload — at least one of color or note_id must be provided
  const updates: Record<string, unknown> = {};

  if (body.color !== undefined) {
    if (typeof body.color !== 'string' || !VALID_COLORS.includes(body.color)) {
      return NextResponse.json({ error: 'Invalid color' }, { status: 400 });
    }
    updates.color = body.color;
  }

  if (body.note_id !== undefined) {
    if (body.note_id !== null && (typeof body.note_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.note_id))) {
      return NextResponse.json({ error: 'Invalid note_id' }, { status: 400 });
    }
    updates.note_id = body.note_id;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('student_highlights')
    .update(updates)
    .eq('id', highlightId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ highlight: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; highlightId: string }> },
) {
  const { highlightId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('student_highlights')
    .delete()
    .eq('id', highlightId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
