import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserRole } from '@/lib/utils/roles';

export interface AuthUser {
  id: string;
  email?: string;
  role?: UserRole;
}

export interface AuthResult {
  user: AuthUser;
  supabase: SupabaseClient;
}

/**
 * Fetch user role from the users table.
 */
export async function getUserRole(supabase: SupabaseClient, userId: string): Promise<UserRole | null> {
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  return (data?.role as UserRole) ?? null;
}

/**
 * Validates JWT / session, returns user or 401.
 */
export async function requireAuth(_req: NextRequest): Promise<AuthResult | NextResponse> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return { user: { id: user.id, email: user.email }, supabase };
}

/**
 * Validates JWT + checks user role from DB.
 */
export async function requireRole(
  req: NextRequest,
  role: UserRole,
): Promise<AuthResult | NextResponse> {
  const result = await requireAuth(req);
  if (result instanceof NextResponse) return result;

  const userRole = await getUserRole(result.supabase, result.user.id);
  if (userRole !== role) {
    return NextResponse.json(
      { error: `Forbidden: requires ${role} role` },
      { status: 403 },
    );
  }

  result.user.role = userRole;
  return result;
}

/**
 * Validates the authenticated user is a parent linked to the given student.
 */
export async function requireParentOf(
  req: NextRequest,
  studentId: string,
): Promise<AuthResult | NextResponse> {
  const result = await requireRole(req, 'parent');
  if (result instanceof NextResponse) return result;

  const { count } = await result.supabase
    .from('parent_student_links')
    .select('parent_id', { count: 'exact', head: true })
    .eq('parent_id', result.user.id)
    .eq('student_id', studentId);

  if (!count || count === 0) {
    return NextResponse.json(
      { error: 'Forbidden: not linked to this student' },
      { status: 403 },
    );
  }

  return result;
}

/**
 * Validates the authenticated user IS this student (by student_profiles.user_id).
 */
export async function requireStudentOwner(
  req: NextRequest,
  studentId: string,
): Promise<AuthResult | NextResponse> {
  const result = await requireRole(req, 'student');
  if (result instanceof NextResponse) return result;

  const { data: profile } = await result.supabase
    .from('student_profiles')
    .select('user_id')
    .eq('id', studentId)
    .single();

  if (!profile || profile.user_id !== result.user.id) {
    return NextResponse.json(
      { error: 'Forbidden: not this student' },
      { status: 403 },
    );
  }

  return result;
}

/**
 * Validates authenticated user is either the parent of or IS the student.
 */
export async function requireParentOrStudent(
  req: NextRequest,
  studentId: string,
): Promise<AuthResult | NextResponse> {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const role = await getUserRole(authResult.supabase, authResult.user.id);
  authResult.user.role = role ?? undefined;

  if (role === 'student') {
    const { data: profile } = await authResult.supabase
      .from('student_profiles')
      .select('user_id')
      .eq('id', studentId)
      .single();
    if (profile?.user_id === authResult.user.id) return authResult;
  }

  if (role === 'parent') {
    const { count } = await authResult.supabase
      .from('parent_student_links')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', authResult.user.id)
      .eq('student_id', studentId);
    if (count && count > 0) return authResult;
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

/**
 * Helper: check if result is an error response.
 */
export function isAuthError(result: AuthResult | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
