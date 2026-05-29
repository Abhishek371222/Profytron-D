'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Lock, Sparkles, CheckCircle2, Zap, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { FloatingLabelInput } from '@/components/auth/FloatingLabelInput';
import { Button } from '@/components/ui/button';
import { CinematicCursor } from '@/components/ui/CinematicCursor';
import { Magnetic } from '@/components/ui/Interactions';
import { authApi } from '@/lib/api/auth';
import { toast } from 'sonner';

const resetPasswordSchema = z.object({
 password: z.string().min(8,"Minimum 8 characters"),
 confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
 message:"Passwords must match",
 path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function PasswordStrength({ password }: { password?: string }) {
 if (!password) return null;
 const checks = [
 { label: '8+ Characters', met: password.length >= 8 },
 { label: 'Number', met: /[0-9]/.test(password) },
 { label: 'Special', met: /[^A-Za-z0-9]/.test(password) },
 { label: 'Uppercase', met: /[A-Z]/.test(password) },
 ];
 const strength = checks.filter(c => c.met).length;
 
 return (
 <div className="space-y-3 mt-2">
 <div className="flex gap-1 h-1">
 {[1, 2, 3, 4].map((step) => (
 <div 
 key={step} 
 className={`flex-1 rounded-full transition-all duration-500 ${
 strength >= step ? (strength <= 2 ? 'bg-error' : strength === 3 ? 'bg-p' : 'bg-success') : 'bg-white/5'
 }`} 
 />
 ))}
 </div>
 <div className="grid grid-cols-2 gap-x-4 gap-y-1">
 {checks.map((check) => (
 <div key={check.label} className="flex items-center gap-2">
 <div className={`w-1 h-1 rounded-full ${check.met ? 'bg-p shadow-[0_0_8px_rgba(var(--p-rgb),0.5)]' : 'bg-white/10'}`} />
 <span className={`text-xs uppercase tracking-widest font-bold ${check.met ? 'text-white' : 'text-white/20'}`}>
 {check.label}
 </span>
 </div>
 ))}
 </div>
 </div>
 );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
 
 const {
 register,
 handleSubmit,
 formState: { errors },
 } = useForm<ResetPasswordValues>({
 resolver: zodResolver(resetPasswordSchema),
 });

  const onSubmit = async (data: ResetPasswordValues) => {
    if (!token) {
      console.error('No reset token found in URL');
      toast.error('Invalid reset link', {
        description: 'Reset token is missing. Request a fresh recovery email.',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword: data.password });
      toast.success('Password updated', {
        description: 'Your access key has been updated. Redirecting to login.',
      });
      router.push('/login?reset=success');
    } catch (error: any) {
      console.error('Reset failed:', error);
      const message = error?.response?.data?.error || error?.message || 'Unable to reset password.';
      toast.error('Password reset failed', { description: message });
    } finally {
      setIsLoading(false);
    }
  };

 const containerVariants = {
 hidden: { opacity: 0 },
 visible: {
 opacity: 1,
 transition: { staggerChildren: 0.1, delayChildren: 0.3 }
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
 <main className="min-h-screen w-full bg-bg-base overflow-hidden noise relative flex flex-col items-center justify-center p-6">
 <CinematicCursor />
 
 {/* Immersive Background Environment */}
 <div className="fixed inset-0 pointer-events-none z-0">
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-250 h-250 bg-p/10 blur-[180px] rounded-full opacity-40 animate-pulse" />
 <div className="absolute -bottom-[10%] -left-[10%] w-150 h-150 bg-s/10 blur-[150px] rounded-full opacity-30" />
 </div>

 <div className="fixed top-12 right-12 z-50">
 <div className="flex items-center gap-3">
 <Zap className="w-6 h-6 text-p fill-p animate-pulse" />
 <span className="text-xl font-display font-semibold tracking-tight text-white">PROFYTRON</span>
 </div>

 <div className="fixed top-12 left-12 z-50">
 <Magnetic strength={0.2}>
 <Link href="/login" className="flex items-center gap-4 group">
 <div className="w-10 h-10 rounded-xl bg-bg-card border border-white/10 flex items-center justify-center group-hover:border-p/50 transition-colors shadow-2xl">
 <ArrowLeft className="w-5 h-5 text-white/60 group-hover:text-p transition-colors" />
 </div>
 <span className="text-white/40 group-hover:text-white font-bold tracking-widest text-xs uppercase hidden sm:block">Back to Login</span>
 </Link>
 </Magnetic>
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
 
 <motion.div variants={itemVariants} className="flex flex-col items-center text-center space-y-6 mb-12">
 <div className="w-20 h-20 rounded-3xl bg-p/10 border border-p/20 flex items-center justify-center shadow-2xl relative">
 <ShieldCheck className="w-10 h-10 text-p" />
 <div className="absolute inset-[-10px] bg-p/20 blur-2xl rounded-full -z-10 animate-pulse" />
 </div>

 <div className="space-y-3">
 <h2 className="text-4xl font-display font-bold text-white tracking-tight">
 Secure <span className="text-gradient">vault.</span>
 </h2>
 <p className="text-slate-400 font-body text-lg">
 Establish a new high-security access key for your terminal.
 </p>
 </div>
 </motion.div>

 <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
 <motion.div variants={itemVariants} className="space-y-2">
 <FloatingLabelInput
 label="New Access Key"
 type="password"
 icon={Lock}
 {...register('password')}
 onChange={(e) => {
 register('password').onChange(e);
 setPassword(e.target.value);
 }}
 error={errors.password?.message}
 className="bg-white/3"
 />
 <PasswordStrength password={password} />
 </motion.div>

 <motion.div variants={itemVariants}>
 <FloatingLabelInput
 label="Confirm Access Key"
 type="password"
 icon={Lock}
 {...register('confirmPassword')}
 error={errors.confirmPassword?.message}
 className="bg-white/3"
 />
 </motion.div>

 <motion.div variants={itemVariants}>
 <Magnetic strength={0.3}>
 <Button 
 type="submit" 
 disabled={isLoading}
 className="w-full h-16 bg-linear-to-r from-p to-p-dark text-white font-semibold text-xl rounded-2xl transition-all shadow-2xl shadow-p/40 group relative overflow-hidden"
 >
 <span className="relative z-10 flex items-center justify-center gap-3">
 {isLoading ? (
 <>
 <Loader2 className="w-6 h-6 animate-spin" />
 Synchronizing...
 </>
 ) : (
 <>Update Access Key <CheckCircle2 className="w-5 h-5" /></>
 )}
 </span>
 <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
 </Button>
 </Magnetic>
 </motion.div>
 </form>

 <motion.div variants={itemVariants} className="mt-12 text-center text-white/20 text-xs font-bold uppercase tracking-[0.2em]">
 Your Grade Security Active
 </motion.div>
 </div>
 </motion.div>
 </main>
 );
}
