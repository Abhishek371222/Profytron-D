'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Mail, Sparkles, CheckCircle2, Zap, ShieldQuestion } from 'lucide-react';
import Link from 'next/link';

import { FloatingLabelInput } from '@/components/auth/FloatingLabelInput';
import { Button } from '@/components/ui/button';
import { CinematicCursor } from '@/components/ui/CinematicCursor';
import { Magnetic } from '@/components/ui/Interactions';

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid institutional email"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    setIsLoading(true);
    try {
      // Simulate reset link sending
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setIsSuccess(true);
    } catch (error) {
      console.error('Reset request failed:', error);
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-s/10 blur-[180px] rounded-full opacity-40 animate-pulse" />
        <div className="absolute -top-[10%] -right-[10%] w-[600px] h-[600px] bg-p/10 blur-[150px] rounded-full opacity-30" />
      </div>

      {/* Header / Branding */}
      <div className="fixed top-12 left-12 z-50">
        <Magnetic strength={0.2}>
          <Link href="/login" className="flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-bg-card border border-white/10 flex items-center justify-center group-hover:border-p/50 transition-colors shadow-2xl">
              <ArrowLeft className="w-5 h-5 text-white/60 group-hover:text-p transition-colors" />
            </div>
            <span className="text-white/40 group-hover:text-white font-bold tracking-widest text-xs uppercase hidden sm:block">Back to Terminal</span>
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
          <div className="absolute inset-0 noise opacity-20 pointer-events-none" />
          
          <motion.div variants={itemVariants} className="flex flex-col items-center text-center space-y-6 mb-12">
            <div className="w-20 h-20 rounded-3xl bg-p/10 border border-p/20 flex items-center justify-center shadow-2xl relative overflow-hidden">
              <ShieldQuestion className="w-10 h-10 text-p" />
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 border-2 border-dashed border-p/20 rounded-3xl"
              />
            </div>

            <div className="space-y-3">
              <h2 className="text-4xl font-display font-bold text-white tracking-tight">
                Recover <span className="text-gradient italic">access.</span>
              </h2>
              <p className="text-slate-400 font-body text-lg">
                Enter your identity email to receive a recovery link.
              </p>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.form 
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleSubmit(onSubmit)} 
                className="space-y-10"
              >
                <div className="space-y-6">
                  <FloatingLabelInput
                    label="Authorized Email"
                    type="email"
                    icon={Mail}
                    {...register('email')}
                    error={errors.email?.message}
                    className="bg-white/[0.03]"
                  />
                </div>

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
                          Sending Link...
                        </>
                      ) : (
                        <>Send Recovery Link <Sparkles className="w-5 h-5 fill-white" /></>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                  </Button>
                </Magnetic>
              </motion.form>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8 py-4"
              >
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-success/10 border border-success/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-success" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-bold text-white">Transmission Sent</h3>
                  <p className="text-slate-400 font-body">Check your inbox for instructions to re-establish access.</p>
                </div>
                <Link href="/login" className="inline-block text-p font-black hover:text-p-light transition-colors">
                  Return to Login
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={itemVariants} className="mt-12 text-center">
            <Link href="/login" className="text-white/40 font-bold hover:text-p transition-colors flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Authorization
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}
