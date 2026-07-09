'use client';

import React, { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Lock, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { useRouter, useSearchParams } from 'next/navigation';

import { FloatingLabelInput } from '@/components/auth/FloatingLabelInput';
import { Button } from '@/components/ui/button';
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
 strength >= step ? (strength <= 2 ? 'bg-error' : strength === 3 ? 'bg-primary' : 'bg-success') : 'bg-foreground/5'
 }`} 
 />
 ))}
 </div>
 <div className="grid grid-cols-2 gap-x-4 gap-y-1">
 {checks.map((check) => (
 <div key={check.label} className="flex items-center gap-2">
 <div className={`w-1 h-1 rounded-full ${check.met ? 'bg-primary shadow-[0_0_8px_rgba(var(--p-rgb),0.5)]' : 'bg-foreground/10'}`} />
 <span className={`text-xs uppercase tracking-widest font-bold ${check.met ? 'text-foreground' : 'text-foreground/20'}`}>
 {check.label}
 </span>
 </div>
 ))}
 </div>
 </div>
 );
}

function ResetPasswordPageInner() {
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
 defaultValues: { password: '', confirmPassword: '' },
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
 <main className="min-h-screen w-full bg-bg-base overflow-hidden relative flex flex-col items-center justify-center p-6">

 <div className="fixed top-12 left-12 z-50">
 <Magnetic strength={0.2}>
 <Link href="/login" className="flex items-center gap-4 group">
 <div className="w-10 h-10 rounded-xl bg-bg-card border border-border flex items-center justify-center group-hover:border-primary/50 transition-colors shadow-2xl">
 <ArrowLeft className="w-5 h-5 text-foreground/60 group-hover:text-primary transition-colors" />
 </div>
 <span className="text-foreground/40 group-hover:text-foreground font-bold tracking-widest text-xs uppercase hidden sm:block">Back to Login</span>
 </Link>
 </Magnetic>
 </div>

 <div className="fixed top-12 right-12 z-50">
 <BrandLogo size="xl" />
 </div>

 {/* Centered Auth Card */}
 <motion.div
 variants={containerVariants}
 initial={false}
 animate="visible"
 className="relative z-10 w-full max-w-lg"
 >
 <div className="relative bg-bg-card/40 backdrop-blur-3xl border border-border rounded-[40px] p-10 lg:p-14 shadow-2xl overflow-hidden group">
 
 <motion.div variants={itemVariants} className="flex flex-col items-center text-center space-y-6 mb-12">
 <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-2xl relative">
 <ShieldCheck className="w-10 h-10 text-primary" />
 </div>

 <div className="space-y-3">
 <h2 className="brand-display-heading text-3xl sm:text-4xl">
 Secure <span className="brand-gradient-text">vault.</span>
 </h2>
 <p className="text-muted-foreground font-sans text-lg">
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
 className="bg-foreground/3"
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
 className="bg-foreground/3"
 />
 </motion.div>

 <motion.div variants={itemVariants}>
 <Magnetic strength={0.3}>
 <Button 
 type="submit" 
 disabled={isLoading}
 className="w-full h-16 bg-linear-to-r from-primary to-primary-dark text-foreground font-semibold text-xl rounded-2xl transition-all shadow-2xl shadow-p/40 group relative overflow-hidden"
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

 <motion.div variants={itemVariants} className="mt-12 text-center text-foreground/20 text-xs font-bold uppercase tracking-[0.2em]">
 Your Grade Security Active
 </motion.div>
 </div>
 </motion.div>
 </main>
 );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-screen w-full bg-background" />}>
      <ResetPasswordPageInner />
    </Suspense>
  );
}
