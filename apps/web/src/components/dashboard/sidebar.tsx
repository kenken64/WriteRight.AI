'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getNavForRole, type UserRole } from '@/lib/utils/roles';
import {
  ClipboardList, FileText, Lightbulb, Trophy, Star, Medal,
  Gift, BarChart3, Settings, LogOut, Menu, X, PenTool,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  'clipboard-list': ClipboardList,
  'file-text': FileText,
  'lightbulb': Lightbulb,
  'trophy': Trophy,
  'star': Star,
  'medal': Medal,
  'gift': Gift,
  'bar-chart-3': BarChart3,
  'settings': Settings,
  'pen-tool': PenTool,
};

interface SidebarProps {
  role: UserRole;
  userEmail: string;
  children?: React.ReactNode;
}

export function DashboardSidebar({ role, userEmail, children }: SidebarProps) {
  const pathname = usePathname();
  const navItems = getNavForRole(role);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">
            WriteRight SG
          </Link>
          {/* Close button - mobile only */}
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-muted md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">{userEmail}</p>
        <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs capitalize text-primary">
          {role}
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon] ?? ClipboardList;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors min-h-[44px] ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t p-3 pb-[env(safe-area-inset-bottom,12px)]">
        <form action="/api/v1/auth/logout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-sm text-red-500 hover:bg-red-50 hover:text-red-700 min-h-[44px]"
          >
            <LogOut className="h-5 w-5" />
            Log out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar - static */}
      <aside className="hidden h-screen sticky top-0 w-64 flex-shrink-0 flex-col border-r bg-white md:flex">
        {sidebarContent}
      </aside>

      {/* Main content area with mobile top bar */}
      <main className="flex-1 overflow-x-hidden bg-muted/30">
        {/* Mobile sticky top bar with hamburger */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b bg-white px-4 py-3 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-muted"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-center text-lg font-bold text-primary">WriteRight SG</h1>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs capitalize text-primary">
            {role}
          </span>
        </div>

        {children}
      </main>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar - slide in */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-72 flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
