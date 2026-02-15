import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SidebarProvider } from '@/components/dashboard/sidebar-context';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { BottomNav } from '@/components/dashboard/bottom-nav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const role = (user.user_metadata?.role as 'parent' | 'student') ?? 'parent';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <DashboardSidebar role={role} userEmail={user.email ?? ''}>
          <div className="px-4 py-4 pb-24 md:px-8 md:py-6 md:pb-6">
            {children}
          </div>
        </DashboardSidebar>
        <BottomNav />
      </div>
    </SidebarProvider>
  );
}
