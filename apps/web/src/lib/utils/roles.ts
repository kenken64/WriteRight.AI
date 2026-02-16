export type UserRole = 'parent' | 'student';

export interface RoleConfig {
  label: string;
  dashboardNav: NavItem[];
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
}

const parentNav: NavItem[] = [
  { label: 'Assignments', href: '/assignments', icon: 'clipboard-list' },
  { label: 'Submissions', href: '/submissions', icon: 'file-text' },
  { label: 'Topics', href: '/topics', icon: 'lightbulb' },
  { label: 'Rewards', href: '/rewards', icon: 'gift' },
  { label: 'Analytics', href: '/analytics', icon: 'bar-chart-3' },
  { label: 'Settings', href: '/settings', icon: 'settings' },
];

const studentNav: NavItem[] = [
  { label: 'My Performance', href: '/performance', icon: 'bar-chart-3' },
  { label: 'Assignments', href: '/assignments', icon: 'clipboard-list' },
  { label: 'Submissions', href: '/submissions', icon: 'file-text' },
  { label: 'Topics', href: '/topics', icon: 'lightbulb' },
  { label: 'Achievements', href: '/achievements', icon: 'trophy' },
  { label: 'Wishlist', href: '/wishlist', icon: 'star' },
  { label: 'Trophy Case', href: '/trophy-case', icon: 'medal' },
  { label: 'Settings', href: '/settings', icon: 'settings' },
];

export const roleConfig: Record<UserRole, RoleConfig> = {
  parent: { label: 'Parent', dashboardNav: parentNav },
  student: { label: 'Student', dashboardNav: studentNav },
};

export function getNavForRole(role: UserRole): NavItem[] {
  return roleConfig[role]?.dashboardNav ?? [];
}

export function canAccessRoute(role: UserRole, path: string): boolean {
  const parentOnly = ['/rewards', '/analytics'];
  const studentOnly = ['/achievements', '/wishlist', '/trophy-case', '/performance'];

  if (role === 'student' && parentOnly.some((p) => path.startsWith(p))) return false;
  if (role === 'parent' && studentOnly.some((p) => path.startsWith(p))) return false;
  return true;
}
