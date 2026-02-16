'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InviteCodeCard } from '@/components/dashboard/invite-code-card';
import { readCsrfToken } from '@/lib/hooks/use-csrf-token';
import { Eye, EyeOff } from 'lucide-react';

interface LinkedChild {
  displayName: string;
  level: string;
  email: string;
}

interface LinkedGuardian {
  displayName: string;
  email: string;
  parentType: string;
}

interface Settings {
  displayName: string;
  email: string;
  notificationPrefs: { email: boolean; push: boolean };
  role: string;
  parentType?: string;
  linkedChildren?: LinkedChild[];
  linkedGuardians?: LinkedGuardian[];
}

async function fetchSettings(): Promise<Settings> {
  const res = await fetch('/api/v1/settings');
  if (!res.ok) throw new Error('Failed to load settings');
  return res.json();
}

async function saveSettings(data: { displayName?: string; notificationPrefs?: { email: boolean; push: boolean }; parentType?: string }) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const csrfToken = readCsrfToken();
  if (csrfToken) headers['x-csrf-token'] = csrfToken;

  const res = await fetch('/api/v1/settings', {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Save failed' }));
    throw new Error(err.error || 'Save failed');
  }
  return res.json();
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useQuery({ queryKey: ['settings'], queryFn: fetchSettings });

  const [displayName, setDisplayName] = useState('');
  const [parentType, setParentType] = useState('parent');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  useEffect(() => {
    if (settings) {
      setDisplayName(settings.displayName);
      setParentType(settings.parentType ?? 'parent');
      setEmailNotifs(settings.notificationPrefs.email);
      setPushNotifs(settings.notificationPrefs.push);
    }
  }, [settings]);

  const handleSave = () => {
    const data: Parameters<typeof saveSettings>[0] = {
      displayName,
      notificationPrefs: { email: emailNotifs, push: pushNotifs },
    };
    if (settings?.role === 'parent') {
      data.parentType = parentType;
    }
    mutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-2xl font-bold md:text-3xl">Settings</h1>
        <div className="mt-8 space-y-8">
          <div className="h-40 animate-pulse rounded-lg border bg-gray-50" />
          <div className="h-32 animate-pulse rounded-lg border bg-gray-50" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-2xl font-bold md:text-3xl">Settings</h1>

      <div className="mt-8 space-y-8">
        {/* Profile */}
        <section className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold">Profile</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                value={settings?.email ?? ''}
                className="mt-1 w-full rounded-md border bg-gray-50 px-3 py-2 text-sm text-muted-foreground"
                disabled
              />
            </div>
            {settings?.role === 'parent' && (
              <div>
                <label className="block text-sm font-medium">Your Role</label>
                <select
                  value={parentType}
                  onChange={(e) => setParentType(e.target.value)}
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="parent">Parent / Guardian</option>
                  <option value="school_teacher">School Teacher</option>
                  <option value="tuition_teacher">Tuition Centre Teacher</option>
                </select>
              </div>
            )}
          </div>
        </section>

        {/* Invite Code (students only) */}
        {settings?.role === 'student' && <InviteCodeCard />}

        {/* My Guardians (students only) */}
        {settings?.role === 'student' && settings.linkedGuardians && settings.linkedGuardians.length > 0 && (
          <section className="rounded-lg border bg-white p-6">
            <h2 className="text-lg font-semibold">My Guardians</h2>
            <div className="mt-4 space-y-3">
              {settings.linkedGuardians.map((guardian, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{guardian.displayName}</p>
                    <p className="text-xs text-muted-foreground">{guardian.email}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {guardian.parentType === 'school_teacher' ? 'School Teacher'
                      : guardian.parentType === 'tuition_teacher' ? 'Tuition Teacher'
                      : 'Parent'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Linked Children (parents only) */}
        {settings?.role === 'parent' && settings.linkedChildren && settings.linkedChildren.length > 0 && (
          <section className="rounded-lg border bg-white p-6">
            <h2 className="text-lg font-semibold">Linked Children</h2>
            <div className="mt-4 space-y-3">
              {settings.linkedChildren.map((child, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{child.displayName}</p>
                    <p className="text-xs text-muted-foreground">{child.email}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {child.level === 'sec3' ? 'Sec 3'
                      : child.level === 'sec4' ? 'Sec 4'
                      : child.level === 'sec5' ? 'Sec 5'
                      : child.level}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Notifications */}
        <section className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm">Email notifications</span>
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                className="h-4 w-4 rounded"
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm">Push notifications</span>
              <input
                type="checkbox"
                checked={pushNotifs}
                onChange={(e) => setPushNotifs(e.target.checked)}
                className="h-4 w-4 rounded"
              />
            </label>
          </div>
        </section>

        {/* Save */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={mutation.isPending}
            className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
          {saveSuccess && <span className="text-sm text-green-600">Settings saved!</span>}
          {mutation.isError && <span className="text-sm text-destructive">{mutation.error.message}</span>}
        </div>

        {/* Change Password */}
        <ChangePasswordSection />

        {/* Billing */}
        <section className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold">Billing</h2>
          <p className="mt-2 text-sm text-muted-foreground">Current plan: Free</p>
          <button className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90">
            Upgrade to WriteRight Plus
          </button>
        </section>
      </div>
    </div>
  );
}

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChangePassword = async () => {
    setError(null);
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const csrfToken = readCsrfToken();
      if (csrfToken) headers['x-csrf-token'] = csrfToken;

      const res = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers,
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to change password.');
      } else {
        setSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-lg border bg-white p-6">
      <h2 className="text-lg font-semibold">Change Password</h2>
      <div className="mt-4 space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <span>⚠️</span><span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            <span>✅</span><span>Password changed successfully!</span>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium">Current Password</label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 pr-10 text-sm"
              placeholder="••••••••"
            />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 mt-[2px] text-gray-400 hover:text-gray-600" tabIndex={-1}>
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">New Password</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 pr-10 text-sm"
              placeholder="••••••••"
            />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 mt-[2px] text-gray-400 hover:text-gray-600" tabIndex={-1}>
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Confirm New Password</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 pr-10 text-sm"
              placeholder="••••••••"
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 mt-[2px] text-gray-400 hover:text-gray-600" tabIndex={-1}>
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <button
          onClick={handleChangePassword}
          disabled={loading}
          className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Change Password'}
        </button>
      </div>
    </section>
  );
}
