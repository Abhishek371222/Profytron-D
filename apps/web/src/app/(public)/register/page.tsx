'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Sparkles, Zap, Lock, Mail, User, Shield, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { RegisterVisualPanel } from '@/components/auth/RegisterVisualPanel';
import { FloatingLabelInput } from '@/components/auth/FloatingLabelInput';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { authApi } from '@/lib/api/auth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { trackEvent, ACTIVATION_EVENTS } from '@/lib/analytics/track';
import { useMounted } from '@/lib/hooks/useMounted';
import { cn } from '@/lib/utils';

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
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
    formState: { errors, isValid },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  const password = watch('password', '');
  const confirmPassword = watch('confirmPassword', '');
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      const referralCode =
        typeof document !== 'undefined'
          ? document.cookie
              .split('; ')
              .find((row) => row.startsWith('referral_code='))
              ?.split('=')[1]
          : undefined;
      const response = await authApi.register({
        ...data,
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
    try {
      if (provider === 'google') {
        window.location.href = '/api/auth/google';
        return;
      }
      if (!supabase) {
        toast.error('Social login is not available right now', {
          description: 'Please sign up with your email and password.',
        });
        return;
      }
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: redirectUrl },
      });
      if (error) {
        toast.error(`Unable to sign up with ${provider}`, { description: error.message });
      }
    } catch (error) {
      console.error(`[${provider}] Signup failed:`, error);
    }
  };

  return (
    <main className="light min-h-screen w-full bg-[#E9EDF5] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1080px] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
        >
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            <RegisterVisualPanel />

            <div className="flex flex-col justify-center bg-white px-7 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
              <div className="mb-8 flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
                  <Zap className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Register</h1>
                  <p className="text-sm text-slate-500">Create your trading workspace</p>
                </div>
              </div>

              {mounted ? (
                <SocialAuthButtons
                  itemVariants={itemVariants}
                  onGoogle={() => handleSocialLogin('google')}
                  onGithub={() => handleSocialLogin('github')}
                  variant="light"
                />
              ) : (
                <div className="mb-6 space-y-3" aria-hidden>
                  <div className="h-12 rounded-xl bg-slate-100" />
                  <div className="h-12 rounded-xl bg-slate-100" />
                </div>
              )}

              <div className="mb-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Or register with email
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {successMessage && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {successMessage}
                  </div>
                )}
                {errorMessage && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {errorMessage}
                  </div>
                )}

                <FloatingLabelInput
                  label="Full Name"
                  icon={User}
                  autoComplete="name"
                  {...register('fullName')}
                  error={errors.fullName?.message}
                  className="!h-14 !rounded-xl !border-slate-200 !bg-slate-50/50 !text-slate-900 focus:!bg-white"
                />

                <FloatingLabelInput
                  label="Email"
                  type="email"
                  icon={Mail}
                  autoComplete="email"
                  {...register('email')}
                  error={errors.email?.message}
                  className="!h-14 !rounded-xl !border-slate-200 !bg-slate-50/50 !text-slate-900 focus:!bg-white"
                />

                <div className="space-y-2">
                  <FloatingLabelInput
                    label="Password"
                    type="password"
                    icon={Lock}
                    autoComplete="new-password"
                    {...register('password')}
                    error={errors.password?.message}
                    className="!h-14 !rounded-xl !border-slate-200 !bg-slate-50/50 !text-slate-900 focus:!bg-white"
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
                      '!h-14 !rounded-xl !border-slate-200 !bg-slate-50/50 !text-slate-900 focus:!bg-white',
                      passwordsMatch && '[&_svg]:!text-emerald-500',
                    )}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !isValid}
                  className="mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-[15px] font-semibold text-white shadow-[0_12px_32px_rgba(79,70,229,0.35)] transition-all hover:shadow-[0_16px_40px_rgba(79,70,229,0.45)] hover:brightness-105 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <Sparkles className="h-4 w-4" aria-hidden />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline underline-offset-4"
                >
                  Sign in
                </Link>
              </p>

              <Link
                href="/"
                className="mt-5 inline-flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-600 lg:hidden"
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
