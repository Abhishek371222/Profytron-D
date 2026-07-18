'use client';

import React from 'react';
import { Lock, Smartphone, Trash2, Shield, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import {
  SettingsSection,
  SettingsField,
  SettingsInput,
} from '@/components/settings/SettingsUi';
import { DashButton } from '@/components/dashboard/DashboardPrimitives';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type DeleteStep = 'confirm' | 'otp' | 'final' | null;
type PasswordResetStep = 'email' | 'otp' | 'password' | 'success' | null;

const STRONG_PASSWORD =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function SecuritySettingsPage() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [is2faEnabled, setIs2faEnabled] = React.useState(!!user?.twoFactorEnabled);
  const [setupSecret, setSetupSecret] = React.useState<string | null>(null);
  const [setupQr, setSetupQr] = React.useState<string | null>(null);
  const [verifyToken, setVerifyToken] = React.useState('');
  const [disableToken, setDisableToken] = React.useState('');
  const [backupCodes, setBackupCodes] = React.useState<string[]>([]);
  const [is2faSetupLoading, setIs2faSetupLoading] = React.useState(false);
  const [is2faVerifyBusy, setIs2faVerifyBusy] = React.useState(false);
  const [is2faDisableBusy, setIs2faDisableBusy] = React.useState(false);
  const setupInFlightRef = React.useRef(false);

  const [passwordResetStep, setPasswordResetStep] =
    React.useState<PasswordResetStep>(null);
  const [resetEmail, setResetEmail] = React.useState('');
  const [resetOtp, setResetOtp] = React.useState('');
  const [resetNewPassword, setResetNewPassword] = React.useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = React.useState('');
  const [isResetBusy, setIsResetBusy] = React.useState(false);
  const resetBusyRef = React.useRef(false);

  const [deleteStep, setDeleteStep] = React.useState<DeleteStep>(null);
  const [deleteOtp, setDeleteOtp] = React.useState('');
  const [isDeleteBusy, setIsDeleteBusy] = React.useState(false);
  const deleteBusyRef = React.useRef(false);

  React.useEffect(() => {
    setIs2faEnabled(!!user?.twoFactorEnabled);
  }, [user?.twoFactorEnabled]);

  const { data: sessions, isLoading: sessionsLoading, refetch: refreshSessions } = useQuery({
    queryKey: ['userSessions'],
    queryFn: () => usersApi.getSessions(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const apiErrorMessage = (error: unknown, fallback: string) => {
    const payload = (error as { response?: { data?: { message?: unknown; error?: unknown } } })
      ?.response?.data;
    const message = payload?.message ?? payload?.error;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string' && message.trim()) return message;
    return fallback;
  };

  const resetPasswordFlow = () => {
    setPasswordResetStep(null);
    setResetEmail('');
    setResetOtp('');
    setResetNewPassword('');
    setResetConfirmPassword('');
    setIsResetBusy(false);
    resetBusyRef.current = false;
  };

  const openPasswordReset = () => {
    setResetEmail(user?.email ?? '');
    setResetOtp('');
    setResetNewPassword('');
    setResetConfirmPassword('');
    setPasswordResetStep('email');
  };

  const runResetAction = async (action: () => Promise<void>) => {
    if (resetBusyRef.current) return;
    resetBusyRef.current = true;
    setIsResetBusy(true);
    try {
      await action();
    } finally {
      resetBusyRef.current = false;
      setIsResetBusy(false);
    }
  };

  const handleRequestResetOtp = () => {
    const email = resetEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Enter your registered email address');
      return;
    }
    return runResetAction(async () => {
      try {
        await usersApi.requestPasswordResetOtp({ email });
        setResetOtp('');
        setPasswordResetStep('otp');
        toast.success('OTP sent to your registered email');
      } catch (error) {
        toast.error(apiErrorMessage(error, 'Failed to send OTP'));
      }
    });
  };

  const handleVerifyResetOtp = () => {
    if (!/^\d{6}$/.test(resetOtp)) {
      toast.error('Enter the 6-digit OTP from your email');
      return;
    }
    return runResetAction(async () => {
      try {
        await usersApi.verifyPasswordResetOtp({
          email: resetEmail.trim().toLowerCase(),
          otp: resetOtp.trim(),
        });
        setPasswordResetStep('password');
        toast.success('OTP verified');
      } catch (error) {
        toast.error(apiErrorMessage(error, 'Invalid or expired OTP'));
      }
    });
  };

  const handleConfirmPasswordReset = () => {
    if (!STRONG_PASSWORD.test(resetNewPassword)) {
      toast.error(
        'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol',
      );
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    return runResetAction(async () => {
      try {
        await usersApi.confirmPasswordReset({
          email: resetEmail.trim().toLowerCase(),
          newPassword: resetNewPassword,
          confirmPassword: resetConfirmPassword,
        });
        setPasswordResetStep('success');
        toast.success('Password reset successfully');
        clearAuth();
        window.setTimeout(() => {
          window.location.href = '/login?passwordReset=1';
        }, 1500);
      } catch (error) {
        toast.error(apiErrorMessage(error, 'Failed to reset password'));
      }
    });
  };

  const handleResendResetOtp = () =>
    runResetAction(async () => {
      try {
        await usersApi.requestPasswordResetOtp({
          email: resetEmail.trim().toLowerCase(),
        });
        setResetOtp('');
        toast.success('OTP sent to your email');
      } catch (error) {
        toast.error(apiErrorMessage(error, 'Failed to resend OTP'));
      }
    });

  const resetDeleteFlow = () => {
    setDeleteStep(null);
    setDeleteOtp('');
    setIsDeleteBusy(false);
    deleteBusyRef.current = false;
  };

  const runDeleteAction = async (action: () => Promise<void>) => {
    if (deleteBusyRef.current) return;
    deleteBusyRef.current = true;
    setIsDeleteBusy(true);
    try {
      await action();
    } finally {
      deleteBusyRef.current = false;
      setIsDeleteBusy(false);
    }
  };

  const handleConfirmDeleteIntent = () =>
    runDeleteAction(async () => {
      try {
        await usersApi.requestDeleteAccountOtp();
        setDeleteOtp('');
        setDeleteStep('otp');
        toast.success('OTP sent to your registered email');
      } catch (error) {
        toast.error(apiErrorMessage(error, 'Failed to send OTP'));
      }
    });

  const handleVerifyDeleteOtp = () => {
    if (!/^\d{6}$/.test(deleteOtp)) {
      toast.error('Enter the 6-digit OTP from your email');
      return;
    }
    return runDeleteAction(async () => {
      try {
        await usersApi.verifyDeleteAccountOtp(deleteOtp.trim());
        setDeleteStep('final');
        toast.success('OTP verified');
      } catch (error) {
        toast.error(apiErrorMessage(error, 'Invalid or expired OTP'));
      }
    });
  };

  const handleFinalDelete = () =>
    runDeleteAction(async () => {
      try {
        await usersApi.deleteAccount();
        clearAuth();
        toast.success('Your account has been deleted');
        window.location.href = '/login?accountDeleted=1';
      } catch (error) {
        toast.error(apiErrorMessage(error, 'Deletion failed'));
      }
    });

  const handleResendDeleteOtp = () =>
    runDeleteAction(async () => {
      try {
        await usersApi.requestDeleteAccountOtp();
        setDeleteOtp('');
        toast.success('OTP sent to your email');
      } catch (error) {
        toast.error(apiErrorMessage(error, 'Failed to resend OTP'));
      }
    });

  const clear2faSetupUi = () => {
    setSetupSecret(null);
    setSetupQr(null);
    setVerifyToken('');
  };

  const begin2faSetup = async () => {
    if (is2faEnabled || setupInFlightRef.current || setupQr) return;
    setupInFlightRef.current = true;
    setIs2faSetupLoading(true);
    try {
      const result = await authApi.setupTwoFactor();
      setSetupSecret(result.secret);
      setSetupQr(result.qrCode);
      toast.message('Scan the QR code with your authenticator app');
    } catch (error) {
      clear2faSetupUi();
      toast.error(apiErrorMessage(error, 'Could not start 2FA setup'));
    } finally {
      setupInFlightRef.current = false;
      setIs2faSetupLoading(false);
    }
  };

  const cancel2faSetup = async () => {
    setIs2faSetupLoading(true);
    try {
      await authApi.cancelTwoFactorSetup();
    } catch {
    } finally {
      clear2faSetupUi();
      setIs2faSetupLoading(false);
      toast.message('2FA setup cancelled');
    }
  };

  const confirm2faSetup = async () => {
    const code = verifyToken.replace(/\D/g, '').slice(0, 6);
    if (!/^\d{6}$/.test(code)) {
      toast.error('Enter the 6-digit code from your authenticator');
      return;
    }
    setIs2faVerifyBusy(true);
    try {
      const result = await authApi.verifyTwoFactorSetup(code);
      setBackupCodes(result.backupCodes ?? []);
      setIs2faEnabled(true);
      updateUser({ twoFactorEnabled: true });
      clear2faSetupUi();
      toast.success('Two-factor authentication enabled');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Invalid verification code'));
    } finally {
      setIs2faVerifyBusy(false);
    }
  };

  const disable2fa = async () => {
    if (!disableToken.trim()) {
      toast.error('Enter your authenticator or backup code');
      return;
    }
    setIs2faDisableBusy(true);
    try {
      await authApi.disableTwoFactor(disableToken.trim());
      setIs2faEnabled(false);
      updateUser({ twoFactorEnabled: false });
      setDisableToken('');
      setBackupCodes([]);
      toast.success('Two-factor authentication disabled');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not disable 2FA — check your code'));
    } finally {
      setIs2faDisableBusy(false);
    }
  };

  const setupInProgress = Boolean(setupQr) || is2faSetupLoading;
  const canResetPassword =
    user?.hasPassword === true ||
    (user?.hasPassword !== false && !user?.googleId);

  return (
    <div className="space-y-8">
      <SettingsSection
        title="Access credentials"
        description={
          canResetPassword
            ? 'Reset your login password using a one-time code sent to your registered email.'
            : 'This account signs in with Google. Password reset is only available for email and password accounts.'
        }
      >
        {canResetPassword ? (
          <DashButton
            onClick={openPasswordReset}
            className="gap-2"
            data-testid="reset-password-button"
          >
            <Lock className="h-4 w-4" />
            Reset Password
          </DashButton>
        ) : (
          <div
            className="rounded-xl border border-[var(--card-border)] bg-muted/20 p-4 space-y-2 max-w-xl"
            data-testid="google-only-password-message"
          >
            <p className="text-sm font-medium text-foreground">
              Signed in with Google
            </p>
            <p className="text-xs text-muted-foreground">
              Password reset is not available for Google-only accounts. Continue
              signing in with Google. To use email and password instead, register
              a separate email/password account.
            </p>
          </div>
        )}
      </SettingsSection>

      <SettingsSection
        title="Two-factor authentication"
        description="Protect your account with a time-based code from an authenticator app."
      >
        <div className="rounded-xl border border-[var(--card-border)] bg-muted/20 p-4 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-foreground">Authenticator app</p>
                <span
                  className={
                    is2faEnabled
                      ? 'inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400'
                      : setupInProgress
                        ? 'inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-400'
                        : 'inline-flex items-center rounded-full border border-[var(--card-border)] bg-muted/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground'
                  }
                  data-testid="2fa-status-badge"
                >
                  {is2faEnabled ? 'Enabled' : setupInProgress ? 'Setup in progress' : 'Off'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {is2faEnabled
                  ? 'A code from your authenticator app is required at login. Enter a code below to disable 2FA.'
                  : setupInProgress
                    ? 'Scan the QR code, then enter the 6-digit code to finish enabling 2FA.'
                    : 'Use Google Authenticator, Authy, or a similar app. Setup is not complete until you verify a code.'}
              </p>
            </div>

            {!is2faEnabled && !setupInProgress && (
              <DashButton
                onClick={begin2faSetup}
                disabled={is2faSetupLoading}
                className="gap-2 shrink-0"
                data-testid="2fa-setup-button"
              >
                <Shield className="h-4 w-4" />
                {is2faSetupLoading ? 'Starting…' : 'Set up authenticator'}
              </DashButton>
            )}
          </div>

          {is2faSetupLoading && !setupQr && (
            <p className="text-sm text-muted-foreground">Creating your authenticator secret…</p>
          )}

          {setupQr && (
            <div className="space-y-3 rounded-xl border border-[var(--card-border)] bg-card/40 p-4">
              <ol className="list-decimal space-y-1 pl-4 text-sm text-muted-foreground">
                <li>Open your authenticator app</li>
                <li>Scan this QR code (or enter the manual key)</li>
                <li>Enter the 6-digit code below to confirm</li>
              </ol>
              <img src={setupQr} alt="2FA QR code" className="h-40 w-40 rounded-lg bg-white p-2" />
              {setupSecret && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground">Manual setup key</p>
                  <p className="text-xs font-mono text-muted-foreground break-all">{setupSecret}</p>
                </div>
              )}
              <SettingsField label="Verification code">
                <SettingsInput
                  value={verifyToken}
                  onChange={(e) =>
                    setVerifyToken(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="6-digit authenticator code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-label="2FA verification code"
                />
              </SettingsField>
              <div className="flex flex-wrap gap-2">
                <DashButton
                  onClick={confirm2faSetup}
                  disabled={is2faVerifyBusy || verifyToken.length !== 6}
                  className="gap-2"
                  data-testid="2fa-confirm-setup"
                >
                  <Shield className="h-4 w-4" />
                  {is2faVerifyBusy ? 'Verifying…' : 'Confirm and enable'}
                </DashButton>
                <DashButton
                  variant="outline"
                  disabled={is2faVerifyBusy || is2faSetupLoading}
                  onClick={cancel2faSetup}
                  data-testid="2fa-cancel-setup"
                >
                  Cancel setup
                </DashButton>
              </div>
            </div>
          )}

          {is2faEnabled && (
            <div className="space-y-3 max-w-md border-t border-[var(--card-border)] pt-4">
              {backupCodes.length > 0 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs font-mono space-y-1">
                  <p className="font-semibold text-foreground mb-2 font-sans">
                    Save these backup codes now — each works once if you lose your authenticator
                  </p>
                  {backupCodes.map((code) => (
                    <div key={code}>{code}</div>
                  ))}
                  <DashButton
                    variant="outline"
                    className="mt-3 font-sans"
                    onClick={() => setBackupCodes([])}
                  >
                    I saved these codes
                  </DashButton>
                </div>
              )}
              <SettingsField label="Code to disable 2FA">
                <SettingsInput
                  value={disableToken}
                  onChange={(e) => setDisableToken(e.target.value)}
                  placeholder="Authenticator or backup code"
                  aria-label="Code to disable 2FA"
                />
              </SettingsField>
              <DashButton
                variant="outline"
                onClick={disable2fa}
                disabled={is2faDisableBusy || !disableToken.trim()}
                data-testid="2fa-disable-button"
              >
                {is2faDisableBusy ? 'Disabling…' : 'Disable 2FA'}
              </DashButton>
            </div>
          )}
        </div>
      </SettingsSection>

      <SettingsSection title="Active sessions">
        {sessionsLoading ? (
          <p className="text-sm text-muted-foreground">Loading sessions…</p>
        ) : !sessions?.length ? (
          <p className="text-sm text-muted-foreground">No active sessions found.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s: { id: string; device?: string }) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-[var(--card-border)] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{s.device || 'Unknown device'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => usersApi.revokeSession(s.id).then(() => refreshSessions())}
                  className="text-xs text-destructive"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </SettingsSection>

      <SettingsSection title="Delete account">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Permanently remove your account. You will confirm twice and verify a one-time code sent to your email.
          </p>
          <DashButton
            variant="outline"
            className="border-destructive/40 text-destructive"
            onClick={() => setDeleteStep('confirm')}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </DashButton>
        </div>
      </SettingsSection>

      <Dialog
        open={passwordResetStep !== null}
        onOpenChange={(open) => {
          if (!open && !isResetBusy && passwordResetStep !== 'success') {
            resetPasswordFlow();
          }
        }}
      >
        <DialogContent
          className="max-w-md bg-card border border-[var(--card-border)] text-foreground"
          showCloseButton={!isResetBusy && passwordResetStep !== 'success'}
        >
          {passwordResetStep === 'email' && (
            <>
              <DialogHeader>
                <DialogTitle>Reset your password</DialogTitle>
                <DialogDescription>
                  Confirm your registered email. We will send a one-time code to continue.
                </DialogDescription>
              </DialogHeader>
              <SettingsField label="Registered email">
                <SettingsInput
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-label="Registered email for password reset"
                />
              </SettingsField>
              <DialogFooter>
                <DashButton variant="outline" disabled={isResetBusy} onClick={resetPasswordFlow}>
                  Cancel
                </DashButton>
                <DashButton disabled={isResetBusy} onClick={handleRequestResetOtp}>
                  {isResetBusy ? 'Sending OTP…' : 'Send OTP'}
                </DashButton>
              </DialogFooter>
            </>
          )}

          {passwordResetStep === 'otp' && (
            <>
              <DialogHeader>
                <DialogTitle>Enter verification code</DialogTitle>
                <DialogDescription>
                  Enter the 6-digit OTP sent to your email. The code expires in 10 minutes.
                </DialogDescription>
              </DialogHeader>
              <SettingsInput
                value={resetOtp}
                onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit OTP"
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label="Password reset OTP"
              />
              <DialogFooter>
                <DashButton variant="outline" disabled={isResetBusy} onClick={handleResendResetOtp}>
                  {isResetBusy ? 'Please wait…' : 'Resend OTP'}
                </DashButton>
                <DashButton
                  disabled={isResetBusy || resetOtp.length !== 6}
                  onClick={handleVerifyResetOtp}
                >
                  {isResetBusy ? 'Verifying…' : 'Verify OTP'}
                </DashButton>
              </DialogFooter>
            </>
          )}

          {passwordResetStep === 'password' && (
            <>
              <DialogHeader>
                <DialogTitle>Choose a new password</DialogTitle>
                <DialogDescription>
                  Use at least 8 characters with uppercase, lowercase, number, and symbol.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <SettingsField label="New password">
                  <SettingsInput
                    type="password"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    autoComplete="new-password"
                    aria-label="New password"
                  />
                </SettingsField>
                <SettingsField label="Confirm new password">
                  <SettingsInput
                    type="password"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    aria-label="Confirm new password"
                  />
                </SettingsField>
              </div>
              <DialogFooter>
                <DashButton variant="outline" disabled={isResetBusy} onClick={resetPasswordFlow}>
                  Cancel
                </DashButton>
                <DashButton
                  disabled={isResetBusy || !resetNewPassword || !resetConfirmPassword}
                  onClick={handleConfirmPasswordReset}
                  className="gap-2"
                >
                  <KeyRound className="h-4 w-4" />
                  {isResetBusy ? 'Resetting…' : 'Reset password'}
                </DashButton>
              </DialogFooter>
            </>
          )}

          {passwordResetStep === 'success' && (
            <>
              <DialogHeader>
                <DialogTitle>Password updated</DialogTitle>
                <DialogDescription>
                  Your password was reset. You will be signed out and redirected to sign in with your new password.
                </DialogDescription>
              </DialogHeader>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteStep !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleteBusy) resetDeleteFlow();
        }}
      >
        <DialogContent
          className="max-w-md bg-card border border-[var(--card-border)] text-foreground"
          showCloseButton={!isDeleteBusy}
        >
          {deleteStep === 'confirm' && (
            <>
              <DialogHeader>
                <DialogTitle>Delete your account?</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete your account? We will send a one-time code to{' '}
                  <span className="font-medium text-foreground">{user?.email || 'your email'}</span>{' '}
                  to continue.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DashButton variant="outline" disabled={isDeleteBusy} onClick={resetDeleteFlow}>
                  Cancel
                </DashButton>
                <DashButton
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeleteBusy}
                  onClick={handleConfirmDeleteIntent}
                >
                  {isDeleteBusy ? 'Sending OTP…' : 'Yes, send OTP'}
                </DashButton>
              </DialogFooter>
            </>
          )}

          {deleteStep === 'otp' && (
            <>
              <DialogHeader>
                <DialogTitle>Enter verification code</DialogTitle>
                <DialogDescription>
                  Enter the 6-digit OTP sent to your email. Your account will not be deleted until you confirm again.
                </DialogDescription>
              </DialogHeader>
              <SettingsInput
                value={deleteOtp}
                onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit OTP"
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label="Delete account OTP"
              />
              <DialogFooter>
                <DashButton variant="outline" disabled={isDeleteBusy} onClick={handleResendDeleteOtp}>
                  {isDeleteBusy ? 'Please wait…' : 'Resend OTP'}
                </DashButton>
                <DashButton
                  disabled={isDeleteBusy || deleteOtp.length !== 6}
                  onClick={handleVerifyDeleteOtp}
                >
                  {isDeleteBusy ? 'Verifying…' : 'Verify OTP'}
                </DashButton>
              </DialogFooter>
            </>
          )}

          {deleteStep === 'final' && (
            <>
              <DialogHeader>
                <DialogTitle>This cannot be undone</DialogTitle>
                <DialogDescription>
                  Are you sure you want to permanently delete this account? This action is non-recoverable. You will lose access to your profile, bots, and related data.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DashButton variant="outline" disabled={isDeleteBusy} onClick={resetDeleteFlow}>
                  Cancel
                </DashButton>
                <DashButton
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeleteBusy}
                  onClick={handleFinalDelete}
                >
                  {isDeleteBusy ? 'Deleting…' : 'Yes, delete forever'}
                </DashButton>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
