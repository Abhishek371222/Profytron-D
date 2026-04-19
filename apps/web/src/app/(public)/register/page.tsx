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
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api/auth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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

function GoogleLogo() {
 return (
 <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0">
 <path fill="#EA4335" d="M12 10.2v3.95h5.62c-.24 1.28-.97 2.37-2.07 3.1v2.58h3.35c1.96-1.8 3.1-4.45 3.1-7.58 0-.73-.07-1.42-.2-2.05H12Z" />
 <path fill="#34A853" d="M6.64 14.34 6.04 14l-2.35 1.83C5.1 19.14 8.18 21 12 21c2.64 0 4.86-.87 6.48-2.37l-3.35-2.58c-.92.62-2.1.98-3.13.98-2.4 0-4.43-1.62-5.16-3.79Z" />
 <path fill="#4A90E2" d="M12 5.02c1.44 0 2.73.5 3.75 1.48l2.81-2.81C17.11 2.13 14.93 1 12 1 8.18 1 5.1 2.86 3.69 5.83L6.97 8.3C7.7 6.14 9.6 5.02 12 5.02Z" />
 <path fill="#FBBC05" d="M6.64 9.66c.22-.68.53-1.3.93-1.86L4.29 5.33A11.92 11.92 0 0 0 1 12c0 1.19.22 2.34.65 3.43L6.64 9.66Z" />
 </svg>
 );
}

function GitHubLogo() {
 return (
 <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0 fill-current">
 <path d="M12 2C6.48 2 2 6.58 2 12.24c0 4.52 2.87 8.36 6.84 9.71.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.37-3.37-1.37-.45-1.17-1.1-1.48-1.1-1.48-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.34-1.11.62-1.37-2.22-.26-4.56-1.13-4.56-5.02 0-1.11.39-2.02 1.03-2.73-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.04a9.24 9.24 0 0 1 5 0c1.9-1.31 2.74-1.04 2.74-1.04.55 1.42.2 2.47.1 2.73.64.71 1.03 1.62 1.03 2.73 0 3.9-2.35 4.76-4.58 5.01.35.31.66.92.66 1.86 0 1.34-.01 2.42-.01 2.75 0 .26.18.58.69.48A10.06 10.06 0 0 0 22 12.24C22 6.58 17.52 2 12 2Z" />
 </svg>
 );
}

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
 mode: 'onChange'
 });

 const password = watch('password', '');

 const onSubmit = async (data: RegisterFormValues) => {
 setIsLoading(true);
 setErrorMessage(null);
 setSuccessMessage(null);
 try {
 const response = await authApi.register(data);
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
		if (!window.location.origin) {
			throw new Error('Unable to determine redirect URL');
		}
		
		const redirectUrl = `${window.location.origin}/auth/callback`;
		console.log(`[${provider.toUpperCase()}] Initiating OAuth flow...`);
		console.log(`[${provider.toUpperCase()}] Redirect URL: ${redirectUrl}`);
		
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
		
		console.log(`[${provider.toUpperCase()}] OAuth flow initiated successfully`);
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
 <main className="min-h-screen w-full overflow-hidden bg-[#020617] p-4 sm:p-6">
 <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.2),transparent_40%),radial-gradient(circle_at_85%_75%,rgba(34,197,94,0.2),transparent_45%)]" />

 <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center justify-center sm:min-h-[calc(100vh-3rem)]">
 <motion.div
 variants={containerVariants}
 initial="hidden"
 animate="visible"
 className="w-full overflow-hidden rounded-3xl border border-white/10 bg-[#030b1f]/95 shadow-[0_20px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl"
 >
 <div className="grid min-h-[700px] grid-cols-1 lg:grid-cols-2">
 <div className="relative hidden overflow-hidden border-r border-white/10 bg-gradient-to-b from-[#07192a] to-[#0d283d] p-10 lg:block">
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_30%,rgba(52,211,153,0.2),transparent_50%)]" />
 <div className="relative z-10 flex h-full flex-col">
 <Link href="/" className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/75 transition-colors hover:text-white">
 <ArrowLeft className="h-4 w-4" />
 Back
 </Link>

 <div className="mt-16 max-w-sm space-y-4">
 <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
 <Shield className="h-3.5 w-3.5" />
 New Account
 </div>
 <h2 className="text-4xl font-bold tracking-tight text-white">Create your account</h2>
 <p className="text-sm leading-relaxed text-slate-300">Set up your Profytron profile to access strategy automation, analytics intelligence, and secure broker connectivity.</p>
 </div>

 <div className="relative mt-auto h-72 rounded-2xl border border-white/10 bg-[#092238]/80 p-6">
 <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:20px_20px] opacity-30" />
 <svg viewBox="0 0 320 180" className="relative z-10 h-full w-full" aria-hidden="true">
 <polyline points="24,128 88,102 156,118 220,76 292,54" fill="none" stroke="#22c55e" strokeWidth="2.5" />
 <polyline points="24,66 88,84 156,58 220,94 292,78" fill="none" stroke="#34d399" strokeWidth="2.5" opacity="0.85" />
 <circle cx="24" cy="128" r="3" fill="#34d399" />
 <circle cx="88" cy="102" r="3" fill="#34d399" />
 <circle cx="156" cy="118" r="3" fill="#34d399" />
 <circle cx="220" cy="76" r="3" fill="#34d399" />
 <circle cx="292" cy="54" r="3" fill="#34d399" />
 </svg>
 </div>
 </div>
 </div>

 <div className="p-7 sm:p-10 lg:p-12">
 <motion.div variants={itemVariants} className="mb-8 flex items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
 <Zap className="h-5 w-5" />
 </div>
 <div>
 <h1 className="text-3xl font-semibold tracking-tight text-white">Register</h1>
 <p className="text-sm text-slate-400">Create your trading workspace</p>
 </div>
 </motion.div>

 <div className="mb-6 space-y-3">
 <motion.button
 type="button"
 variants={itemVariants}
 onClick={() => handleSocialLogin('google')}
 className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10"
 >
 <GoogleLogo />
 Continue with Google
 </motion.button>
 <motion.button
 type="button"
 variants={itemVariants}
 onClick={() => handleSocialLogin('github')}
 className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10"
 >
 <GitHubLogo />
 Continue with GitHub
 </motion.button>
 </div>

 <motion.div variants={itemVariants} className="mb-6 flex items-center gap-3">
 <div className="h-px flex-1 bg-white/15" />
 <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">or register with email</span>
 <div className="h-px flex-1 bg-white/15" />
 </motion.div>

 <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
 {successMessage && (
 <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
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
 className="bg-[#0b1430]/70"
 />
 </motion.div>

 <motion.div variants={itemVariants}>
 <FloatingLabelInput
 label="Email"
 type="email"
 icon={Mail}
 {...register('email')}
 error={errors.email?.message}
 className="bg-[#0b1430]/70"
 />
 </motion.div>

 <motion.div variants={itemVariants} className="space-y-4">
 <FloatingLabelInput
 label="Password"
 type="password"
 icon={Lock}
 {...register('password')}
 error={errors.password?.message}
 className="bg-[#0b1430]/70"
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
 className="bg-[#0b1430]/70"
 />
 </motion.div>

 <motion.div variants={itemVariants} className="pt-2">
 <Button 
 type="submit" 
 disabled={isLoading || !isValid}
 className="relative h-12 w-full overflow-hidden rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 text-base font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
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

 <motion.div variants={itemVariants} className="mt-7 text-center text-sm text-slate-400">
 Already have an account?{' '}
 <Link href="/login" className="font-semibold text-emerald-300 hover:text-emerald-200">
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
