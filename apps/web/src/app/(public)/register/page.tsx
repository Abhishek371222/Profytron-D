'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Sparkles, Zap, Lock, Mail, User, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { FloatingLabelInput } from '@/components/auth/FloatingLabelInput';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api/auth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { trackEvent, ACTIVATION_EVENTS } from '@/lib/analytics/track';

const registerSchema = z.object({
 fullName: z.string().min(2,"Name must be at least 2 characters"),
 email: z.string().email("Please enter a valid institutional email"),
 password: z.string().min(8,"Password must be at least 8 characters"),
 confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
 message:"Passwords don't match",
 path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
 const router = useRouter();
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
 console.error('Registration failed:', error);
 const fallback = 'Signup failed. Please try again with a different email.';
 const message =
   typeof error === 'object' &&
   error !== null &&
   'response' in error &&
   typeof (error as any).response?.data?.error === 'string'
     ? (error as any).response.data.error
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

		if (!window.location.origin) {
			throw new Error('Unable to determine redirect URL');
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
			toast.error(`Unable to sign up with ${provider}`, {
				description: error.message,
			});
			throw error;
		}
   } catch (error) {
     const message = error instanceof Error ? error.message : String(error);
     console.error(`[${provider.toUpperCase()}] Signup failed:`, message);
   }
 };

 const containerVariants = {
 hidden: { opacity: 0 },
 visible: {
 opacity: 1,
 transition: { 
 staggerChildren: 0.1,
 delayChildren: 0.3
 }
 }
 };

 const itemVariants = {
 hidden: { opacity: 0, y: 30, scale: 0.95 },
 visible: { 
 opacity: 1, 
 y: 0, 
 scale: 1,
 transition: { type: 'spring', damping: 20, stiffness: 100 }
 }
 };

 return (
 <main className="min-h-screen w-full overflow-x-hidden bg-background p-4 sm:p-6">
 <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_20%_20%,color-mix(in_srgb,var(--primary)_20%,transparent),transparent_40%),radial-gradient(circle_at_85%_75%,color-mix(in_srgb,var(--chart-3)_20%,transparent),transparent_45%)]" />

 <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center justify-center sm:min-h-[calc(100vh-3rem)]">
 <motion.div
 variants={containerVariants}
 initial={false}
 animate="visible"
 className="w-full overflow-hidden rounded-card border border-border bg-card shadow-lg"
 >
 <div className="grid min-h-0 lg:min-h-[640px] grid-cols-1 lg:grid-cols-2">
 <div className="relative hidden overflow-hidden border-r border-border bg-gradient-to-b from-card to-secondary p-10 lg:block">
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_30%,color-mix(in_srgb,var(--primary)_20%,transparent),transparent_50%)]" />
 <div className="relative z-10 flex h-full flex-col">
 <Link href="/" className="inline-flex w-fit items-center gap-2 rounded-xl border border-border bg-foreground/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/75 transition-colors hover:text-foreground">
 <ArrowLeft className="h-4 w-4" />
 Back
 </Link>

 <div className="mt-16 max-w-sm space-y-4">
 <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-caption font-semibold uppercase tracking-[0.2em] text-primary">
 <Shield className="h-3.5 w-3.5" />
 New Account
 </div>
 <h2 className="text-4xl font-bold tracking-tight text-foreground">Create your account</h2>
 <p className="text-sm leading-relaxed text-muted-foreground">Set up your Profytron profile to access strategy automation, analytics intelligence, and secure broker connectivity.</p>
 </div>

 <div className="relative mt-auto h-72 rounded-2xl border border-border bg-card/80 p-6">
 <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:20px_20px] opacity-30" />
 <svg viewBox="0 0 320 180" className="relative z-10 h-full w-full" aria-hidden="true">
 <polyline points="24,128 88,102 156,118 220,76 292,54" fill="none" stroke="var(--chart-3)" strokeWidth="2.5" />
 <polyline points="24,66 88,84 156,58 220,94 292,78" fill="none" stroke="var(--primary)" strokeWidth="2.5" opacity="0.85" />
 <circle cx="24" cy="128" r="3" fill="var(--chart-3)" />
 <circle cx="88" cy="102" r="3" fill="var(--chart-3)" />
 <circle cx="156" cy="118" r="3" fill="var(--chart-3)" />
 <circle cx="220" cy="76" r="3" fill="var(--chart-3)" />
 <circle cx="292" cy="54" r="3" fill="var(--chart-3)" />
 </svg>
 </div>
 </div>
 </div>

 <div className="p-7 sm:p-10 lg:p-12">
 <motion.div variants={itemVariants} className="mb-8 flex items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
 <Zap className="h-5 w-5" />
 </div>
 <div>
 <h1 className="text-3xl font-semibold tracking-tight text-foreground">Register</h1>
 <p className="text-sm text-muted-foreground">Create your trading workspace</p>
 </div>
 </motion.div>

 <SocialAuthButtons
 itemVariants={itemVariants}
 onGoogle={() => handleSocialLogin('google')}
 onGithub={() => handleSocialLogin('github')}
 />

 <motion.div variants={itemVariants} className="mb-6 flex items-center gap-3">
 <div className="h-px flex-1 bg-foreground/15" />
 <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">or register with email</span>
 <div className="h-px flex-1 bg-foreground/15" />
 </motion.div>

 <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
 {successMessage && (
 <div className="rounded-xl border border-chart-3/40 bg-chart-3/10 px-4 py-3 text-body-sm text-chart-3">
 {successMessage}
 </div>
 )}
 {errorMessage && (
 <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
 {errorMessage}
 </div>
 )}
 <motion.div variants={itemVariants}>
 <FloatingLabelInput
 label="Full Name"
 icon={User}
 {...register('fullName')}
 error={errors.fullName?.message}
 className="bg-input/70"
 />
 </motion.div>

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

 <motion.div variants={itemVariants} className="space-y-4">
 <FloatingLabelInput
 label="Password"
 type="password"
 icon={Lock}
 {...register('password')}
 error={errors.password?.message}
 className="bg-input/70"
 />
 <PasswordStrengthMeter password={password} />
 </motion.div>

 <motion.div variants={itemVariants}>
 <FloatingLabelInput
 label="Confirm Password"
 type="password"
 icon={Shield}
 {...register('confirmPassword')}
 error={errors.confirmPassword?.message}
 className="bg-input/70"
 />
 </motion.div>

 <motion.div variants={itemVariants} className="pt-2">
 <Button 
 type="submit" 
 disabled={isLoading || !isValid}
 className="relative h-12 w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary to-chart-2 text-base font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-60"
 >
 <span className="relative z-10 flex items-center justify-center gap-2">
 {isLoading ? (
 <>
 <Loader2 className="h-4 w-4 animate-spin" />
 Creating account...
 </>
 ) : (
 <>
 Create account <Sparkles className="h-4 w-4 fill-white" />
 </>
 )}
 </span>
 <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
 </Button>
 </motion.div>
 </form>

 <motion.div variants={itemVariants} className="mt-7 text-center text-sm text-muted-foreground">
 Already have an account?{' '}
 <Link href="/login" className="font-semibold text-primary hover:brightness-110">
 Sign in
 </Link>
 </motion.div>
 </div>
 </div>
 </motion.div>
 </div>
 </main>
 );
}
