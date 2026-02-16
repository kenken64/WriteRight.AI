import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SidebarProvider } from '@/components/dashboard/sidebar-context';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { BottomNav } from '@/components/dashboard/bottom-nav';

const PARENT_TYPE_LABELS: Record<string, string> = {
  parent: 'Parent',
  school_teacher: 'School Teacher',
  tuition_teacher: 'Tuition Teacher',
};

const LEVEL_LABELS: Record<string, string> = {
  sec3: 'Sec 3',
  sec4: 'Sec 4',
  sec5: 'Sec 5',
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const role = (user.user_metadata?.role as 'parent' | 'student') ?? 'parent';

  // Fetch linked family members
  let linkedMembers: { name: string; detail: string }[] = [];

  if (role === 'parent') {
    // Parent → get linked children via parent_student_links → student_profiles
    const { data: links } = await supabase
      .from('parent_student_links')
      .select('student_id, student_profiles(display_name, level)')
      .eq('parent_id', user.id);

    if (links) {
      linkedMembers = links
        .map((link: Record<string, unknown>) => {
          const profile = link.student_profiles as { display_name: string; level: string } | null;
          if (!profile) return null;
          return {
            name: profile.display_name,
            detail: LEVEL_LABELS[profile.level] ?? profile.level,
          };
        })
        .filter(Boolean) as { name: string; detail: string }[];
    }
  } else {
    // Student → get linked guardians via student_profiles → parent_student_links → users
    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (studentProfile) {
      const { data: links } = await supabase
        .from('parent_student_links')
        .select('parent_id, users!parent_student_links_parent_id_fkey(display_name, parent_type)')
        .eq('student_id', studentProfile.id);

      if (links) {
        linkedMembers = links
          .map((link: Record<string, unknown>) => {
            const parent = link.users as { display_name: string | null; parent_type: string | null } | null;
            if (!parent) return null;
            return {
              name: parent.display_name ?? 'Guardian',
              detail: PARENT_TYPE_LABELS[parent.parent_type ?? 'parent'] ?? 'Parent',
            };
          })
          .filter(Boolean) as { name: string; detail: string }[];
      }
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <DashboardSidebar role={role} userEmail={user.email ?? ''} linkedMembers={linkedMembers}>
          <div className="px-4 py-4 pb-24 md:px-8 md:py-6 md:pb-6">
            {children}
          </div>
        </DashboardSidebar>
        <BottomNav />
      </div>
    </SidebarProvider>
  );
}
