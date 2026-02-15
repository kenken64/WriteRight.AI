import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { StudentOnboardFlow } from '@/components/onboarding/student-onboard-flow';
import { ParentOnboardFlow } from '@/components/onboarding/parent-onboard-flow';

export default async function OnboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const role = (user.user_metadata?.role as 'parent' | 'student') ?? 'parent';
  const displayName = (user.user_metadata?.display_name as string) ?? 'there';

  if (role === 'student') {
    return <StudentOnboardFlow displayName={displayName} />;
  }

  return <ParentOnboardFlow displayName={displayName} />;
}
