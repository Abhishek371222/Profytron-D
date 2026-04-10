'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Sparkles, Zap, Lock, Mail, Globe, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { FloatingLabelInput } from '@/components/auth/FloatingLabelInput';
import { Button } from '@/components/ui/button';
import { CinematicCursor } from '@/components/ui/CinematicCursor';
import { Magnetic } from '@/components/ui/Interactions';
import { useAuthStore } from '@/lib/stores/useAuthStore';

const loginSchema = z.object({
  email: z.string().email("Please enter a valid institutional email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
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
    <main className="min-h-screen w-full bg-bg-base overflow-hidden noise relative flex flex-col items-center justify-center p-6">
      <CinematicCursor />
      
      {/* Immersive Background Environment */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-p/10 blur-[180px] rounded-full opacity-40 animate-pulse" />
        <div className="absolute -top-[10%] -left-[10%] w-[600px] h-[600px] bg-s/10 blur-[150px] rounded-full opacity-30" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[600px] h-[600px] bg-p/10 blur-[150px] rounded-full opacity-30" />
        
        {/* Subtle Orbital Ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/[0.03] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/[0.02] rounded-full" />
      </div>

      {/* Header / Branding (Detached) */}
      <div className="fixed top-12 left-12 z-50">
        <Magnetic strength={0.2}>
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-bg-card border border-white/10 flex items-center justify-center group-hover:border-p/50 transition-colors shadow-2xl">
              <ArrowLeft className="w-5 h-5 text-white/60 group-hover:text-p transition-colors" />
            </div>
            <span className="text-white/40 group-hover:text-white font-bold tracking-widest text-xs uppercase hidden sm:block">Back to Intelligence</span>
          </Link>
        </Magnetic>
      </div>

      <div className="fixed top-12 right-12 z-50">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-p fill-p animate-pulse" />
          <span className="text-xl font-display font-black tracking-tighter text-white">PROFYTRON</span>
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
          {/* Internal Shimmer / Noise */}
          <div className="absolute inset-0 noise opacity-20 pointer-events-none" />
          
          <motion.div variants={itemVariants} className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
              <Shield className="w-3 h-3 text-p" /> Secure Terminal 01
            </div>
            <h2 className="text-5xl font-display font-bold text-white tracking-tight">
              Welcome <span className="text-gradient italic">back.</span>
            </h2>
            <p className="text-slate-400 font-body text-lg">
              Re-establish your connection to the grid.
            </p>
          </motion.div>

          {/* Social Auth Staggered */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            <motion.div variants={itemVariants}>
              <Magnetic strength={0.1}>
                <button className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all group/btn">
                  <div className="w-5 h-5 rounded-full bg-white/10" />
                  <span className="text-sm font-bold text-white/60 group-hover/btn:text-white">Google</span>
                </button>
              </Magnetic>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Magnetic strength={0.1}>
                <button className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all group/btn">
                  <div className="w-5 h-5 rounded-full bg-white/10" />
                  <span className="text-sm font-bold text-white/60 group-hover/btn:text-white">GitHub</span>
                </button>
              </Magnetic>
            </motion.div>
          </div>

          <motion.div variants={itemVariants} className="relative flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] uppercase tracking-widest font-black text-white/20">Authorized Email</span>
            <div className="h-px flex-1 bg-white/10" />
          </motion.div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <motion.div variants={itemVariants}>
              <FloatingLabelInput
                label="Identity Email"
                type="email"
                icon={Mail}
                {...register('email')}
                error={errors.email?.message}
                className="bg-white/[0.03]"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="space-y-2">
                <FloatingLabelInput
                  label="Access Key"
                  type="password"
                  icon={Lock}
                  {...register('password')}
                  error={errors.password?.message}
                  className="bg-white/[0.03]"
                />
                <div className="flex justify-end">
                  <button type="button" className="text-xs text-p font-bold hover:text-p-light transition-colors">
                    Lost Access?
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="pt-4">
              <Magnetic strength={0.3}>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-16 bg-gradient-to-r from-p to-p-dark text-white font-black text-xl rounded-2xl transition-all shadow-2xl shadow-p/40 group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Synchronizing...
                      </>
                    ) : (
                      <>
                        Initialize Access <Sparkles className="w-5 h-5 fill-white" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                </Button>
              </Magnetic>
            </motion.div>
          </form>

          <motion.div variants={itemVariants} className="mt-12 text-center">
            <p className="text-slate-500 text-sm">
              New operative?{' '}
              <Link href="/register" className="text-white font-black hover:text-p transition-colors underline-offset-4 underline decoration-p/30">
                Join the Network
              </Link>
            </p>
          </motion.div>
        </div>

        {/* Floating Trust Signals */}
        <motion.div 
          variants={itemVariants}
          className="mt-12 flex justify-center items-center gap-12 text-[10px] uppercase tracking-[0.3em] font-black text-white/20"
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            Grid Active
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            AES-256
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-3 h-3" />
            Global Grid
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}
