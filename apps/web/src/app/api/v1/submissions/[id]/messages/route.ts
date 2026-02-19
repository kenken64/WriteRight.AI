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
    .from('submission_messages')
    .select('id, submission_id, sender_id, content, created_at, sender:users(display_name, role)')
    .eq('submission_id', id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data });
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
  if (content.length < 1 || content.length > 2000) {
    return NextResponse.json(
      { error: 'Content must be between 1 and 2000 characters' },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from('submission_messages')
    .insert({ submission_id: id, sender_id: user.id, content })
    .select('id, submission_id, sender_id, content, created_at, sender:users(display_name, role)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data }, { status: 201 });
}
