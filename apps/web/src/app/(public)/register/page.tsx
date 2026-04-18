'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Sparkles, Zap, Lock, Mail, User, Shield, Globe } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { FloatingLabelInput } from '@/components/auth/FloatingLabelInput';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { Button } from '@/components/ui/button';
import { CinematicCursor } from '@/components/ui/CinematicCursor';
import { Magnetic } from '@/components/ui/Interactions';
import { authApi } from '@/lib/api/auth';
import { supabase } from '@/lib/supabase';

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
			alert(`Unable to sign up with ${provider}. Please check the browser console for details.\n\nError: ${error.message}`);
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
 <main className="min-h-screen w-full bg-bg-base overflow-hidden noise relative flex flex-col items-center justify-center p-6 py-20">
 <CinematicCursor />
 
 {/* Immersive Background Environment */}
 <div className="fixed inset-0 pointer-events-none z-0">
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-250 h-250 bg-s/10 blur-[180px] rounded-full opacity-40 animate-pulse" />
 <div className="absolute -top-[10%] -right-[10%] w-150 h-150 bg-p/10 blur-[150px] rounded-full opacity-30" />
 <div className="absolute -bottom-[10%] -left-[10%] w-150 h-150 bg-s/10 blur-[150px] rounded-full opacity-30" />
 </div>

 {/* Header / Branding */}
 <div className="fixed top-12 left-12 z-50">
 <Magnetic strength={0.2}>
 <Link href="/" className="flex items-center gap-4 group">
 <div className="w-10 h-10 rounded-xl bg-bg-card border border-white/10 flex items-center justify-center group-hover:border-s/50 transition-colors shadow-2xl">
 <ArrowLeft className="w-5 h-5 text-white/60 group-hover:text-s transition-colors" />
 </div>
 <span className="text-white/40 group-hover:text-white font-bold tracking-widest text-xs uppercase hidden sm:block">Back to Intelligence</span>
 </Link>
 </Magnetic>
 </div>

 <div className="fixed top-12 right-12 z-50">
 <div className="flex items-center gap-3">
 <Zap className="w-6 h-6 text-s fill-s animate-pulse" />
 <span className="text-xl font-display font-semibold tracking-tight text-white">PROFYTRON</span>
 </div>
 </div>

 {/* Centered Auth Card */}
 <motion.div
 variants={containerVariants}
 initial="hidden"
 animate="visible"
 className="relative z-10 w-full max-w-lg"
 >
 <div className="relative bg-bg-card/40 backdrop-blur-3xl border border-white/10 rounded-[40px] p-10 lg:p-14 shadow-2xl overflow-hidden group">
 <div className="absolute inset-0 noise opacity-20 pointer-events-none" />
 
 <motion.div variants={itemVariants} className="text-center space-y-4 mb-12">
 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
 <Shield className="w-3 h-3 text-s" /> Access Request 02
 </div>
 <h2 className="text-5xl font-display font-bold text-white tracking-tight">
 Join the <span className="text-gradient-s">grid.</span>
 </h2>
 <p className="text-slate-400 font-body text-lg">
 Initialize your algorithmic identity.
 </p>
 </motion.div>

 {/* Social Auth Staggered */}
 <div className="grid grid-cols-2 gap-4 mb-10">
 <motion.div variants={itemVariants}>
 <Magnetic strength={0.1}>
 <button 
   onClick={() => handleSocialLogin('google')}
   className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all group/btn"
 >
 <div className="w-5 h-5 rounded-full bg-white/10" />
 <span className="text-sm font-bold text-white/60 group-hover/btn:text-white">Google</span>
 </button>
 </Magnetic>
 </motion.div>
 <motion.div variants={itemVariants}>
 <Magnetic strength={0.1}>
 <button 
   onClick={() => handleSocialLogin('github')}
   className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all group/btn"
 >
 <div className="w-5 h-5 rounded-full bg-white/10" />
 <span className="text-sm font-bold text-white/60 group-hover/btn:text-white">GitHub</span>
 </button>
 </Magnetic>
 </motion.div>
 </div>

 <motion.div variants={itemVariants} className="relative flex items-center gap-4 mb-10">
 <div className="h-px flex-1 bg-white/10" />
 <span className="text-xs uppercase tracking-widest font-semibold text-white/20">Institutional Entry</span>
 <div className="h-px flex-1 bg-white/10" />
 </motion.div>

 <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
 label="Full Operative Name"
 icon={User}
 {...register('fullName')}
 error={errors.fullName?.message}
 className="bg-white/3"
 />
 </motion.div>

 <motion.div variants={itemVariants}>
 <FloatingLabelInput
 label="Identity Email"
 type="email"
 icon={Mail}
 {...register('email')}
 error={errors.email?.message}
 className="bg-white/3"
 />
 </motion.div>

 <motion.div variants={itemVariants} className="space-y-4">
 <FloatingLabelInput
 label="Initialize Access Key"
 type="password"
 icon={Lock}
 {...register('password')}
 error={errors.password?.message}
 className="bg-white/3"
 />
 <PasswordStrengthMeter password={password} />
 </motion.div>

 <motion.div variants={itemVariants}>
 <FloatingLabelInput
 label="Verify Access Key"
 type="password"
 icon={Shield}
 {...register('confirmPassword')}
 error={errors.confirmPassword?.message}
 className="bg-white/3"
 />
 </motion.div>

 <motion.div variants={itemVariants} className="pt-4">
 <Magnetic strength={0.3}>
 <Button 
 type="submit" 
 disabled={isLoading || !isValid}
 className="w-full h-16 bg-linear-to-r from-s to-s-dark text-white font-semibold text-xl rounded-2xl transition-all shadow-2xl shadow-s/40 group relative overflow-hidden disabled:opacity-50"
 >
 <span className="relative z-10 flex items-center justify-center gap-3">
 {isLoading ? (
 <>
 <Loader2 className="w-6 h-6 animate-spin" />
 Generating ID...
 </>
 ) : (
 <>
 Request Authorization <Sparkles className="w-5 h-5 fill-white" />
 </>
 )}
 </span>
 <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
 </Button>
 </Magnetic>
 </motion.div>
 </form>

 <motion.div variants={itemVariants} className="mt-12 text-center">
 <p className="text-slate-500 text-sm">
 Already authorized?{' '}
 <Link href="/login" className="text-white font-semibold hover:text-s transition-colors underline-offset-4 underline decoration-s/30">
 Sign In to Terminal
 </Link>
 </p>
 </motion.div>
 </div>

 {/* Floating Trust Signals */}
 <motion.div 
 variants={itemVariants}
 className="mt-12 flex justify-center items-center gap-12 text-xs uppercase tracking-[0.3em] font-semibold text-white/20"
 >
 <div className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
 Node Ready
 </div>
 <div className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
 256-Bit
 </div>
 <div className="flex items-center gap-2">
 <Globe className="w-3 h-3" />
 Institutional
 </div>
 </motion.div>
 </motion.div>
 </main>
 );
}
