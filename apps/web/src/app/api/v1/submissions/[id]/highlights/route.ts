import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const VALID_COLORS = ['yellow', 'green', 'blue', 'pink', 'orange'];

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
    .from('student_highlights')
    .select('*')
    .eq('submission_id', id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ highlights: data });
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
  const highlightedText = typeof body.highlighted_text === 'string' ? body.highlighted_text : '';
  if (highlightedText.length < 1 || highlightedText.length > 5000) {
    return NextResponse.json(
      { error: 'Highlighted text must be between 1 and 5000 characters' },
      { status: 400 },
    );
  }

  if (!VALID_COLORS.includes(body.color)) {
    return NextResponse.json({ error: 'Invalid color' }, { status: 400 });
  }

  const occurrenceIndex = typeof body.occurrence_index === 'number' ? body.occurrence_index : 0;

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
    .from('student_highlights')
    .insert({
      submission_id: id,
      student_id: profile.id,
      highlighted_text: highlightedText,
      color: body.color,
      occurrence_index: occurrenceIndex,
    })
    .select()
    .single();

  if (error) {
    // Unique constraint violation → duplicate highlight
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Highlight already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ highlight: data }, { status: 201 });
}
