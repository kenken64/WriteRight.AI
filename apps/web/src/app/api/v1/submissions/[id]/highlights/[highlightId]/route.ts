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

  if (typeof body.color !== 'string' || !VALID_COLORS.includes(body.color)) {
    return NextResponse.json({ error: 'Invalid color' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('student_highlights')
    .update({ color: body.color })
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
