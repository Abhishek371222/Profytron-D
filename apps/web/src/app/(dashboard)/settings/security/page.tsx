'use client';

import React from 'react';
import { Lock, Smartphone, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import {
  SettingsSection,
  SettingsField,
  SettingsInput,
  SettingsToggle,
} from '@/components/settings/SettingsUi';
import { DashButton } from '@/components/dashboard/DashboardPrimitives';
import { cn } from '@/lib/utils';

const AUDIT_EVENTS = [
  { id: '1', action: 'Login success', device: 'Chrome / Desktop', location: 'Mumbai, IN', time: '2 min ago', level: 'info' as const },
  { id: '2', action: 'API key created', device: 'Chrome / Desktop', location: 'Mumbai, IN', time: '1 hour ago', level: 'warning' as const },
  { id: '3', action: 'Password changed', device: 'Safari / iPhone', location: 'Delhi, IN', time: '2 days ago', level: 'critical' as const },
];

const LEVEL_BADGE = {
  info: 'bg-primary/10 text-primary border-primary/20',
  warning: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function SecuritySettingsPage() {
  const [is2faEnabled, setIs2faEnabled] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState('');

  const { data: sessions, isLoading: sessionsLoading, refetch: refreshSessions } = useQuery({
    queryKey: ['userSessions'],
    queryFn: () => usersApi.getSessions(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const handleRotateKey = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Enter current and new password');
      return;
    }
    setIsChangingPassword(true);
    try {
      await usersApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Password updated');
    } catch {
      toast.error('Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      <SettingsSection title="Access credentials" description="Update your login password.">
        <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
          <SettingsField label="Current password">
            <SettingsInput type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </SettingsField>
          <SettingsField label="New password">
            <SettingsInput type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </SettingsField>
        </div>
        <DashButton onClick={handleRotateKey} disabled={isChangingPassword} className="mt-3 gap-2">
          <Lock className="h-4 w-4" />
          Update Password
        </DashButton>
      </SettingsSection>

      <SettingsSection title="Two-factor authentication">
        <SettingsToggle
          label="Require 2FA on login"
          description="Use a time-based one-time password from your authenticator app."
          checked={is2faEnabled}
          onChange={setIs2faEnabled}
        />
      </SettingsSection>

      <SettingsSection title="Active sessions">
        {sessionsLoading ? (
          <p className="text-sm text-muted-foreground">Loading sessions…</p>
        ) : !sessions?.length ? (
          <p className="text-sm text-muted-foreground">No active sessions found.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s: { id: string; device?: string }) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-[var(--card-border)] px-4 py-3">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{s.device || 'Unknown device'}</p>
                </div>
                <button type="button" onClick={() => usersApi.revokeSession(s.id).then(() => refreshSessions())} className="text-xs text-destructive">
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </SettingsSection>

      <SettingsSection title="Security audit log">
        <div className="dash-table-wrap overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)] bg-muted/40">
                {['Event', 'Device', 'Location', 'Time', 'Level'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {AUDIT_EVENTS.map((evt) => (
                <tr key={evt.id}>
                  <td className="px-4 py-3 font-medium">{evt.action}</td>
                  <td className="px-4 py-3 text-muted-foreground">{evt.device}</td>
                  <td className="px-4 py-3 text-muted-foreground">{evt.location}</td>
                  <td className="px-4 py-3 text-muted-foreground">{evt.time}</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border capitalize', LEVEL_BADGE[evt.level])}>
                      {evt.level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SettingsSection>

      <SettingsSection title="Delete account">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <p className="text-sm text-muted-foreground">Type DELETE to confirm permanent account removal.</p>
          <SettingsInput value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" />
          <DashButton
            variant="outline"
            disabled={deleteConfirm !== 'DELETE'}
            className="border-destructive/40 text-destructive"
            onClick={() => usersApi.deleteAccount(deleteConfirm).then(() => { window.location.href = '/login'; }).catch(() => toast.error('Deletion failed'))}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </DashButton>
        </div>
      </SettingsSection>
    </div>
  );
}
