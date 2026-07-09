'use client';

import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Sparkles, Zap, Lock, Mail, Shield } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

import { FloatingLabelInput } from '@/components/auth/FloatingLabelInput';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { authApi } from '@/lib/api/auth';
import { supabase } from '@/lib/supabase';
import { resolvePostLoginRedirect } from '@/lib/utils';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid institutional email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [twoFaChallenge, setTwoFaChallenge] = React.useState<string | null>(null);
  const [twoFaCode, setTwoFaCode] = React.useState('');

  const authError = searchParams.get('error');
  const expired = searchParams.get('expired');
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const urlErrorMessage =
    authError === 'auth_failed'
      ? 'Sign-in failed. Please try again.'
      : authError === 'database_unavailable'
        ? 'We\'re experiencing a temporary issue. Please try again in a moment.'
        : authError === 'sync_failed'
          ? 'Sign-in succeeded but we hit a snag syncing your account. Please try again.'
          : authError === 'backend_unavailable'
            ? 'Service is temporarily unavailable. Please wait a moment and try again.'
            : expired
              ? 'Your session expired. Please sign in again.'
              : null;

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMessage(null);
    try {
      const response = await authApi.login(data);
      if ('requiresTwoFa' in response && response.requiresTwoFa) {
        setTwoFaChallenge(response.challengeToken);
        return;
      }
      const { accessToken, user } = response as { accessToken: string; user: any };
      login(accessToken, user);
      router.replace(resolvePostLoginRedirect(user, redirectTo));
    } catch (error: unknown) {
      console.error('Login failed:', error);
      const fallback = 'Login failed. Check your credentials and verify your email.';
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { error?: string } } }).response?.data
          ?.error === 'string'
          ? (error as { response: { data: { error: string } } }).response.data.error
          : fallback;
      setErrorMessage(message);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      if (provider === 'google') {
        window.location.href = '/api/auth/google';
        return;
      }

      if (!window.location.origin) {
        throw new Error('Unable to determine redirect URL');
      }

      if (!supabase) {
        toast.error('Social login is not available right now', {
          description: 'Please sign in with your email and password.',
        });
        return;
      }

      const redirectUrl = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error(`[${provider.toUpperCase()}] OAuth error:`, error);
        toast.error(`Unable to sign in with ${provider}`, {
          description: error.message,
        });
        throw error;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${provider.toUpperCase()}] Login failed:`, message);
    }
  };

  const handleForgotPassword = async () => {
    const email = getValues('email');
    if (!email) {
      toast.error('Enter your email first', {
        description: 'Provide your account email, then click Lost Access again.',
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
      const message = err?.response?.data?.error || err?.message || 'Could not send recovery email.';
      toast.error('Recovery request failed', { description: message });
    }
  };

  const handleCompleteTwoFa = async () => {
    if (!twoFaChallenge || !twoFaCode.trim()) {
      toast.error('Enter your authenticator code');
      return;
    }
    setErrorMessage(null);
    try {
      const response = await authApi.completeTwoFactorLogin({
        challengeToken: twoFaChallenge,
        code: twoFaCode.trim(),
      });
      login(response.accessToken, response.user);
      router.replace(resolvePostLoginRedirect(response.user, redirectTo));
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

                <div className="mt-16 max-w-sm space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-caption font-semibold uppercase tracking-[0.2em] text-primary">
                    <Shield className="h-3.5 w-3.5" />
                    Secure Login
                  </div>
                  <h2 className="text-4xl font-bold tracking-tight text-foreground">Welcome back</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Sign in to your Profytron account and continue monitoring live trading
                    intelligence, strategies, and portfolio performance.
                  </p>
                </div>

                <div className="relative mt-auto h-72 rounded-card border border-border bg-card/80 p-6">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--foreground)_10%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--foreground)_10%,transparent)_1px,transparent_1px)] bg-[size:20px_20px] opacity-30" />
                  <svg viewBox="0 0 320 180" className="relative z-10 h-full w-full" aria-hidden="true">
                    <polyline points="24,32 92,114 160,62 224,96 292,40" fill="none" stroke="var(--primary)" strokeWidth="2.5" />
                    <polyline points="24,106 92,72 160,126 224,78 292,136" fill="none" stroke="var(--chart-5)" strokeWidth="2.5" opacity="0.8" />
                    <circle cx="24" cy="32" r="3" fill="var(--chart-5)" />
                    <circle cx="92" cy="114" r="3" fill="var(--chart-5)" />
                    <circle cx="160" cy="62" r="3" fill="var(--chart-5)" />
                    <circle cx="224" cy="96" r="3" fill="var(--chart-5)" />
                    <circle cx="292" cy="40" r="3" fill="var(--chart-5)" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="p-7 sm:p-10 lg:p-12">
              <motion.div variants={itemVariants} className="mb-8 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-input bg-primary/20 text-primary">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground">Sign in</h1>
                  <p className="text-sm text-muted-foreground">Access your trading workspace</p>
                </div>
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
                  <div className="rounded-input border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
                    {urlErrorMessage}
                  </div>
                )}
                {errorMessage && (
                  <div className="rounded-input border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
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
                    disabled={isLoading}
                    className="group relative h-12 w-full overflow-hidden rounded-button bg-gradient-hero text-body font-semibold text-primary-foreground transition-all hover:brightness-110"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isLoading ? (
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

              <motion.div variants={itemVariants} className="mt-7 text-center text-sm text-muted-foreground">
                New to Profytron?{' '}
                <Link href="/register" prefetch={false} className="font-semibold text-primary hover:brightness-110">
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
