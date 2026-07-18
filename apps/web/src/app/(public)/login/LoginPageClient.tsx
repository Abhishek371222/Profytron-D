'use client';

import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { z } from '@/lib/zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Sparkles, Lock, Mail, Shield } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

import { FloatingLabelInput } from '@/components/auth/FloatingLabelInput';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { AuthChartPanel } from '@/components/auth/AuthChartPanel';
import { BrandGradientText } from '@/components/brand/BrandGradientText';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { authApi } from '@/lib/api/auth';
import { startSocialOAuth } from '@/lib/auth/social-oauth';
import { resolvePostLoginRedirect } from '@/lib/utils';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid institutional email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function resolveUrlErrorMessage(searchParams: URLSearchParams): string | null {
  const authError = searchParams.get('error');
  const expired = searchParams.get('expired');
  const accountDeleted = searchParams.get('accountDeleted');
  const idle = searchParams.get('idle');
  const superseded = searchParams.get('superseded');

  if (accountDeleted === '1' || accountDeleted === 'true') {
    return 'This account was deleted. No account exists with that email — create a new account to continue.';
  }
  if (idle === 'true') {
    return 'You were logged out after 24 hours of inactivity. Please sign in again.';
  }
  if (superseded === 'true' || authError === 'session_limit') {
    return 'This account is already signed in on 2 devices. Sign out somewhere else, or continue here (the oldest session will be signed out).';
  }
  if (authError === 'auth_failed') return 'Sign-in failed. Please try again.';
  if (authError === 'oauth_failed') {
    return 'Google/GitHub sign-in could not finish. Please try again.';
  }
  if (authError === 'database_unavailable') {
    return "We're experiencing a temporary issue. Please try again in a moment.";
  }
  if (authError === 'sync_failed') {
    return 'Sign-in almost completed, but session setup failed. Please try signing in again.';
  }
  if (authError === 'rate_limited') {
    return 'Too many sign-in attempts. Please wait a minute and try again.';
  }
  if (authError === 'backend_unavailable') {
    return 'Service is temporarily unavailable. Please wait a moment and try again.';
  }
  if (expired === 'true' || expired === '1') {
    return 'Your session expired. Please sign in again.';
  }
  if (searchParams.get('reset') === 'success') {
    return 'Password updated. Sign in with your new password.';
  }
  const oauthDetail = searchParams.get('error_description');
  if (oauthDetail && (authError === 'oauth_failed' || authError === 'auth_failed')) {
    return decodeURIComponent(oauthDetail).slice(0, 200);
  }
  return null;
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { login, clearAuth } = useAuthStore();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [urlErrorMessage, setUrlErrorMessage] = React.useState<string | null>(null);
  const [twoFaChallenge, setTwoFaChallenge] = React.useState<string | null>(null);
  const [twoFaCode, setTwoFaCode] = React.useState('');
  const [is2faSubmitting, setIs2faSubmitting] = React.useState(false);

  const redirectTo = searchParams.get('redirect') || '/dashboard';

  React.useEffect(() => {
    const notice = resolveUrlErrorMessage(searchParams);
    const challenge = searchParams.get('twoFaChallenge');
    if (challenge) setTwoFaChallenge(challenge);
    if (notice) {
      setUrlErrorMessage(notice);
      try {
        sessionStorage.setItem('profytron_force_login', '1');
      } catch {
      }
      clearAuth();
    }

    const keysToStrip = [
      'expired',
      'idle',
      'superseded',
      'error',
      'accountDeleted',
      'twoFaChallenge',
    ] as const;
    const hasStripKey = keysToStrip.some((key) => searchParams.has(key));
    if (!hasStripKey) return;

    const next = new URLSearchParams(searchParams.toString());
    for (const key of keysToStrip) next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, clearAuth, router, pathname]);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMessage(null);
    setUrlErrorMessage(null);
    try {
      const response = await authApi.login(data);
      if ('requiresTwoFa' in response && response.requiresTwoFa) {
        setTwoFaChallenge(response.challengeToken);
        return;
      }
      const { accessToken, user } = response as { accessToken: string; user: any };
      const dest = resolvePostLoginRedirect(user, redirectTo);
      login(accessToken, user);
      window.location.href = dest;
    } catch (error: unknown) {
      const payload =
        typeof error === 'object' &&
        error !== null &&
        'response' in error
          ? (error as {
              response?: {
                data?: {
                  error?: string | string[];
                  code?: string;
                  message?: string | string[];
                };
              };
            }).response?.data
          : undefined;
      const raw =
        payload?.error ??
        payload?.message ??
        'Login failed. Check your credentials and verify your email.';
      const message = Array.isArray(raw) ? raw.join(', ') : String(raw);
      setErrorMessage(message);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    await startSocialOAuth(provider, 'login');
  };

  const handleForgotPassword = async () => {
    const email = getValues('email');
    if (!email) {
      toast.error('Enter your email first', {
        description: 'Provide your account email, then click Forgot password? again.',
      });
      return;
    }

    try {
      await authApi.forgotPassword(email);
      toast.success('Recovery link sent', {
        description: 'Check your inbox for reset instructions.',
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      const message =
        err?.response?.data?.error || err?.message || 'Could not send recovery email.';
      toast.error('Recovery request failed', { description: message });
    }
  };

  const handleCompleteTwoFa = async () => {
    if (!twoFaChallenge || !twoFaCode.trim()) {
      toast.error('Enter your authenticator code');
      return;
    }
    setErrorMessage(null);
    setUrlErrorMessage(null);
    setIs2faSubmitting(true);
    try {
      const response = await authApi.completeTwoFactorLogin({
        challengeToken: twoFaChallenge,
        code: twoFaCode.trim(),
      });
      login(response.accessToken, response.user);
      const dest = resolvePostLoginRedirect(response.user, redirectTo);
      window.location.href = dest;
    } catch (error: unknown) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { error?: string } } }).response?.data
          ?.error === 'string'
          ? (error as { response: { data: { error: string } } }).response.data.error
          : 'Invalid 2FA code';
      setErrorMessage(message);
    } finally {
      setIs2faSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', damping: 20, stiffness: 100 },
    },
  };

  const alertClassName =
    'flex w-full items-start gap-2 rounded-xl border px-3.5 py-2.5 text-sm leading-snug';

  return (
    <main className="min-h-[100dvh] w-full min-w-0 overflow-x-hidden bg-background p-4 pb-safe pt-safe sm:p-6">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_20%_20%,color-mix(in_srgb,var(--primary)_25%,transparent),transparent_45%),radial-gradient(circle_at_80%_80%,color-mix(in_srgb,var(--primary)_20%,transparent),transparent_40%)]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center justify-center sm:min-h-[calc(100vh-3rem)]">
        <motion.div
          variants={containerVariants}
          initial={false}
          animate="visible"
          className="w-full overflow-hidden rounded-card border border-border bg-card shadow-lg"
        >
          <div className="grid min-h-0 lg:min-h-[640px] grid-cols-1 lg:grid-cols-2">
            <div className="relative hidden overflow-hidden border-r border-border bg-gradient-to-b from-card to-secondary p-10 lg:block">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_35%,color-mix(in_srgb,var(--accent)_35%,transparent),transparent_50%)]" />
              <div className="relative z-10 flex h-full flex-col">
                <Link
                  href="/"
                  className="inline-flex w-fit items-center gap-2 rounded-button border border-border bg-foreground/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/75 transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>

                <AuthChartPanel
                  badgeLabel="Secure Login"
                  badgeIcon={Shield}
                  headline={
                    <>
                      Welcome <BrandGradientText>back.</BrandGradientText>
                    </>
                  }
                  description="Sign in to your Profytron account and continue monitoring live trading intelligence, bots, and portfolio performance."
                />
              </div>
            </div>

            <div className="p-7 sm:p-10 lg:p-12 [color-scheme:light]">
              <motion.div variants={itemVariants} className="mb-6 lg:hidden">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-button border border-border bg-foreground/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/75 transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Back
                </Link>
              </motion.div>

              <motion.div variants={itemVariants} className="mb-8">
                <BrandLogo size="xl" className="mb-6" />
                <h1 className="brand-display-heading text-3xl sm:text-4xl">
                  Sign <BrandGradientText>in.</BrandGradientText>
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">Access your trading workspace</p>
              </motion.div>

              <SocialAuthButtons
                itemVariants={itemVariants}
                onGoogle={() => handleSocialLogin('google')}
                onGithub={() => handleSocialLogin('github')}
              />

              <motion.div variants={itemVariants} className="mb-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-foreground/15" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  or use email
                </span>
                <div className="h-px flex-1 bg-foreground/15" />
              </motion.div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {urlErrorMessage && (
                  <div
                    role="alert"
                    className={`${alertClassName} border-destructive/35 bg-destructive/[0.08] text-destructive`}
                  >
                    {urlErrorMessage}
                  </div>
                )}
                {errorMessage && (
                  <div
                    role="alert"
                    className={`${alertClassName} border-destructive/35 bg-destructive/[0.08] text-destructive`}
                  >
                    {errorMessage}
                  </div>
                )}
                <motion.div variants={itemVariants}>
                  <FloatingLabelInput
                    label="Email"
                    type="email"
                    icon={Mail}
                    {...register('email')}
                    error={errors.email?.message}
                    className="bg-input/70"
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <div className="space-y-2">
                    <FloatingLabelInput
                      label="Password"
                      type="password"
                      icon={Lock}
                      {...register('password')}
                      error={errors.password?.message}
                      className="bg-input/70"
                      disabled={!!twoFaChallenge}
                    />
                    {!twoFaChallenge && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-caption font-semibold text-primary transition-colors hover:brightness-110"
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>

                {twoFaChallenge && (
                  <motion.div variants={itemVariants}>
                    <FloatingLabelInput
                      label="Authenticator code"
                      type="text"
                      inputMode="numeric"
                      icon={Shield}
                      value={twoFaCode}
                      onChange={(e) => setTwoFaCode(e.target.value)}
                      className="bg-input/70"
                    />
                  </motion.div>
                )}

                <motion.div variants={itemVariants} className="pt-2">
                  <Button
                    type={twoFaChallenge ? 'button' : 'submit'}
                    onClick={twoFaChallenge ? handleCompleteTwoFa : undefined}
                    disabled={isSubmitting || is2faSubmitting}
                    aria-busy={isSubmitting || is2faSubmitting}
                    className="group relative h-12 w-full overflow-hidden rounded-button bg-gradient-hero text-body font-semibold text-primary-foreground transition-all hover:brightness-110"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isSubmitting || is2faSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : twoFaChallenge ? (
                        <>
                          Verify 2FA <Shield className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Sign in <Sparkles className="h-4 w-4 fill-primary-foreground" />
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                  </Button>
                </motion.div>
              </form>

              <motion.div
                variants={itemVariants}
                className="mt-7 text-center text-sm text-muted-foreground"
              >
                New to Profytron?{' '}
                <Link
                  href="/register"
                  prefetch={false}
                  className="font-semibold text-primary hover:brightness-110"
                >
                  Create an account
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

export default function LoginPageClient() {
  return (
    <Suspense fallback={<main className="min-h-screen w-full bg-background" />}>
      <LoginPageContent />
    </Suspense>
  );
}
