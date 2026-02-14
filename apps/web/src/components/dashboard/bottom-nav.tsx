'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PenTool, Lightbulb, Trophy, User } from 'lucide-react';

const tabs = [
  { href: '/assignments', label: 'Home', icon: Home },
  { href: '/submissions/new', label: 'Write', icon: PenTool },
  { href: '/topics', label: 'Topics', icon: Lightbulb },
  { href: '/achievements', label: 'Badges', icon: Trophy },
  { href: '/settings', label: 'Profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/80 backdrop-blur-lg md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around px-2 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : ''}`} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
