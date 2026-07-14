'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sparkles, Lock, Mail, User, Shield, Check, Tag } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { BrandGradientText } from '@/components/brand/BrandGradientText';
import { RegisterVisualPanel } from '@/components/auth/RegisterVisualPanel';
import { FloatingLabelInput } from '@/components/auth/FloatingLabelInput';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { authApi } from '@/lib/api/auth';
import { startSocialOAuth } from '@/lib/auth/social-oauth';
import { toast } from 'sonner';
import { trackEvent, ACTIVATION_EVENTS } from '@/lib/analytics/track';
import { useMounted } from '@/lib/hooks/useMounted';
import { cn } from '@/lib/utils';

function readReferralFromCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const raw = document.cookie
    .split('; ')
    .find((row) => row.startsWith('referral_code='))
    ?.split('=')
    .slice(1)
    .join('=');
  if (!raw) return undefined;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function readReferralFromUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const params = new URLSearchParams(window.location.search);
  return params.get('ref') || params.get('referral') || undefined;
}

function persistReferralCookie(code: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `referral_code=${encodeURIComponent(code)}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
}

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    referralCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, damping: 24, stiffness: 140 },
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const mounted = useMounted();
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      referralCode: '',
    },
  });

  const password = watch('password', '');
  const confirmPassword = watch('confirmPassword', '');
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  React.useEffect(() => {
    const referralCode = readReferralFromUrl() || readReferralFromCookie();
    if (!referralCode) return;
    setValue('referralCode', referralCode, { shouldDirty: false });
    persistReferralCookie(referralCode);
  }, [setValue]);

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      const manualReferral = data.referralCode?.trim();
      const referralCode =
        manualReferral || readReferralFromUrl() || readReferralFromCookie();
      if (referralCode) {
        persistReferralCookie(referralCode);
      }
      const { referralCode: _referralField, ...registerPayload } = data;
      const response = await authApi.register({
        ...registerPayload,
        referralCode: referralCode || undefined,
        plan: params.get('plan') || undefined,
      });
      trackEvent(ACTIVATION_EVENTS.SIGNUP, { plan: params.get('plan') || 'free' });
      setSuccessMessage('Signup successful. Enter the OTP sent to your email.');
      sessionStorage.setItem('verificationEmail', data.email);
      if (response?.devOtp) {
        sessionStorage.setItem('verificationOtp', String(response.devOtp));
      }
      router.push('/verify-email');
    } catch (error: unknown) {
      const fallback = 'Signup failed. Please try again with a different email.';
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error ===
          'string'
          ? (error as { response: { data: { error: string } } }).response.data.error
          : fallback;
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    await startSocialOAuth(provider, 'register');
  };

  return (
    <main className="min-h-[100dvh] w-full min-w-0 bg-background p-4 pb-safe pt-safe sm:p-6 lg:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1080px] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full overflow-hidden rounded-card border border-card-border bg-card shadow-[var(--shadow-lg)]"
        >
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            <RegisterVisualPanel />

            <div className="flex flex-col justify-center bg-card px-7 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
              <div className="mb-8">
                <BrandLogo size="xl" className="mb-6" />
                <h1 className="brand-display-heading text-2xl sm:text-3xl">
                  Create your <BrandGradientText>account.</BrandGradientText>
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">Create your trading workspace</p>
              </div>

              {mounted ? (
                <SocialAuthButtons
                  itemVariants={itemVariants}
                  onGoogle={() => handleSocialLogin('google')}
                  onGithub={() => handleSocialLogin('github')}
                />
              ) : (
                <div className="mb-6 space-y-3" aria-hidden>
                  <div className="h-12 rounded-input bg-muted" />
                  <div className="h-12 rounded-input bg-muted" />
                </div>
              )}

              <div className="mb-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  Or register with email
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {successMessage && (
                  <div role="status" className="rounded-input border border-success/20 bg-success/[0.08] px-4 py-3 text-sm text-success">
                    {successMessage}
                  </div>
                )}
                {errorMessage && (
                  <div role="alert" className="rounded-input border border-destructive/20 bg-destructive/[0.08] px-4 py-3 text-sm text-destructive">
                    {errorMessage}
                  </div>
                )}

                <FloatingLabelInput
                  label="Full Name"
                  icon={User}
                  autoComplete="name"
                  {...register('fullName')}
                  error={errors.fullName?.message}
                  className="!h-12 !rounded-input !border-input-border !bg-input !text-foreground focus:!bg-input"
                />

                <FloatingLabelInput
                  label="Email"
                  type="email"
                  icon={Mail}
                  autoComplete="email"
                  {...register('email')}
                  error={errors.email?.message}
                  className="!h-12 !rounded-input !border-input-border !bg-input !text-foreground focus:!bg-input"
                />

                <div className="space-y-2">
                  <FloatingLabelInput
                    label="Password"
                    type="password"
                    icon={Lock}
                    autoComplete="new-password"
                    {...register('password')}
                    error={errors.password?.message}
                    className="!h-12 !rounded-input !border-input-border !bg-input !text-foreground focus:!bg-input"
                  />
                  {password.length > 0 && <PasswordStrengthMeter password={password} />}
                </div>

                <div className="relative">
                  <FloatingLabelInput
                    label="Confirm Password"
                    type="password"
                    icon={passwordsMatch ? Check : Shield}
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                    error={errors.confirmPassword?.message}
                    className={cn(
                      '!h-12 !rounded-input !border-input-border !bg-input !text-foreground focus:!bg-input',
                      passwordsMatch && '[&_svg]:!text-success',
                    )}
                  />
                </div>

                <div className="space-y-1">
                  <FloatingLabelInput
                    label="Referral code (optional)"
                    icon={Tag}
                    autoComplete="off"
                    spellCheck={false}
                    {...register('referralCode')}
                    error={errors.referralCode?.message}
                    className="!h-12 !rounded-input !border-input-border !bg-input !text-foreground focus:!bg-input"
                  />
                  <p className="px-1 text-xs text-muted-foreground">
                    Optional. Use a friend&apos;s code or open their referral link — both work the same way.
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading || !isValid}
                  isLoading={isLoading}
                  className="mt-2 h-12 w-full text-[15px]"
                >
                  {isLoading ? (
                    'Creating account...'
                  ) : (
                    <>
                      Create account
                      <Sparkles className="h-4 w-4" aria-hidden />
                    </>
                  )}
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-primary hover:text-primary-hover hover:underline underline-offset-4"
                >
                  Sign in
                </Link>
              </p>

              <Link
                href="/"
                className="mt-5 inline-flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground lg:hidden"
              >
                ← Back to home
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
