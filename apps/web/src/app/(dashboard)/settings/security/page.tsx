'use client';

import React from 'react';
import { Lock, Smartphone, Trash2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/useAuthStore';
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
  const user = useAuthStore((s) => s.user);
  const [is2faEnabled, setIs2faEnabled] = React.useState(!!user?.twoFactorEnabled);
  const [setupSecret, setSetupSecret] = React.useState<string | null>(null);
  const [setupQr, setSetupQr] = React.useState<string | null>(null);
  const [verifyToken, setVerifyToken] = React.useState('');
  const [disableToken, setDisableToken] = React.useState('');
  const [backupCodes, setBackupCodes] = React.useState<string[]>([]);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState('');

  React.useEffect(() => {
    setIs2faEnabled(!!user?.twoFactorEnabled);
  }, [user?.twoFactorEnabled]);

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

  const begin2faSetup = async () => {
    try {
      const result = await authApi.setupTwoFactor();
      setSetupSecret(result.secret);
      setSetupQr(result.qrCode);
      toast.message('Scan the QR code with your authenticator app');
    } catch {
      toast.error('Could not start 2FA setup');
    }
  };

  const confirm2faSetup = async () => {
    if (!verifyToken.trim()) {
      toast.error('Enter the code from your authenticator');
      return;
    }
    try {
      const result = await authApi.verifyTwoFactorSetup(verifyToken.trim());
      setBackupCodes(result.backupCodes ?? []);
      setIs2faEnabled(true);
      setSetupSecret(null);
      setSetupQr(null);
      setVerifyToken('');
      toast.success('Two-factor authentication enabled');
    } catch {
      toast.error('Invalid verification code');
    }
  };

  const disable2fa = async () => {
    if (!disableToken.trim()) {
      toast.error('Enter your authenticator or backup code');
      return;
    }
    try {
      await authApi.disableTwoFactor(disableToken.trim());
      setIs2faEnabled(false);
      setDisableToken('');
      setBackupCodes([]);
      toast.success('Two-factor authentication disabled');
    } catch {
      toast.error('Could not disable 2FA — check your code');
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
          onChange={(enabled) => {
            if (enabled && !is2faEnabled) void begin2faSetup();
            if (!enabled && is2faEnabled) {
              toast.message('Enter a code below to disable 2FA');
            }
          }}
        />
        {setupQr && (
          <div className="mt-4 space-y-3 rounded-xl border border-[var(--card-border)] p-4">
            <p className="text-sm text-muted-foreground">Scan this QR code, then enter the 6-digit code.</p>
            <img src={setupQr} alt="2FA QR code" className="h-40 w-40 rounded-lg bg-white p-2" />
            {setupSecret && (
              <p className="text-xs font-mono text-muted-foreground break-all">Manual key: {setupSecret}</p>
            )}
            <SettingsInput
              value={verifyToken}
              onChange={(e) => setVerifyToken(e.target.value)}
              placeholder="Authenticator code"
            />
            <DashButton onClick={confirm2faSetup} className="gap-2">
              <Shield className="h-4 w-4" />
              Confirm setup
            </DashButton>
          </div>
        )}
        {is2faEnabled && (
          <div className="mt-4 space-y-3 max-w-md">
            <SettingsField label="Code to disable 2FA">
              <SettingsInput
                value={disableToken}
                onChange={(e) => setDisableToken(e.target.value)}
                placeholder="TOTP or backup code"
              />
            </SettingsField>
            <DashButton variant="outline" onClick={disable2fa}>
              Disable 2FA
            </DashButton>
            {backupCodes.length > 0 && (
              <div className="rounded-lg border border-[var(--card-border)] p-3 text-xs font-mono space-y-1">
                <p className="font-semibold text-foreground mb-2">Backup codes (save securely)</p>
                {backupCodes.map((code) => (
                  <div key={code}>{code}</div>
                ))}
              </div>
            )}
          </div>
        )}
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
