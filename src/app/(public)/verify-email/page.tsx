'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Mail, Sparkles, CheckCircle2, RotateCcw, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { CinematicCursor } from '@/components/ui/CinematicCursor';
import { Magnetic } from '@/components/ui/Interactions';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return;

    setIsLoading(true);
    try {
      // Simulate verification
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setIsSuccess(true);
      setTimeout(() => router.push('/onboarding'), 1500);
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (otp.join('').length === 6) {
      handleSubmit();
    }
  }, [otp]);

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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-p/10 blur-[180px] rounded-full opacity-40 animate-pulse" />
        <div className="absolute -top-[10%] -left-[10%] w-[600px] h-[600px] bg-s/10 blur-[150px] rounded-full opacity-30" />
      </div>

      {/* Header / Branding */}
      <div className="fixed top-12 left-12 z-50">
        <Magnetic strength={0.2}>
          <Link href="/register" className="flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-bg-card border border-white/10 flex items-center justify-center group-hover:border-p/50 transition-colors shadow-2xl">
              <ArrowLeft className="w-5 h-5 text-white/60 group-hover:text-p transition-colors" />
            </div>
            <span className="text-white/40 group-hover:text-white font-bold tracking-widest text-xs uppercase hidden sm:block">Back to Entry</span>
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
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-p/10 border border-p/20 flex items-center justify-center shadow-2xl">
                {isSuccess ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                    <CheckCircle2 className="w-10 h-10 text-success" />
                  </motion.div>
                ) : (
                  <Mail className="w-10 h-10 text-p" />
                )}
              </div>
              {/* Pulsing rings */}
              <AnimatePresence>
                {!isSuccess && (
                  <>
                    <motion.div 
                      key="r1"
                      animate={{ scale: [1, 1.5], opacity: [0.5, 0] }} 
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-3xl border border-p/30"
                    />
                    <motion.div 
                      key="r2"
                      animate={{ scale: [1, 2], opacity: [0.3, 0] }} 
                      transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                      className="absolute inset-0 rounded-3xl border border-p/10"
                    />
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-3">
              <h2 className="text-4xl font-display font-bold text-white tracking-tight">
                Check your <span className="text-gradient italic">intelligence.</span>
              </h2>
              <p className="text-slate-400 font-body text-lg">
                We've synchronized a verification code to <span className="text-white font-bold opacity-80">demo@profytron.com</span>
              </p>
            </div>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-10">
            <motion.div variants={itemVariants} className="flex justify-between gap-3">
              {otp.map((digit, index) => (
                <div key={index} className="relative group/otp flex-1">
                  <input
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-full h-16 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl text-center text-2xl font-mono font-bold text-white outline-none transition-all focus:bg-white/[0.08] focus:border-p focus:ring-1 focus:ring-p/30"
                  />
                  {/* Shimmer line on focus */}
                  <div className="absolute bottom-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent overflow-hidden">
                    <motion.div 
                      animate={{ x: digit || (typeof document !== 'undefined' && inputRefs.current[index] === document.activeElement) ? '100%' : '-100%' }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-1/2 h-full bg-gradient-to-r from-transparent via-p/40 to-transparent"
                    />
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div variants={itemVariants}>
              <Magnetic strength={0.3}>
                <Button 
                  type="submit" 
                  disabled={isLoading || otp.join('').length < 6}
                  className="w-full h-16 bg-gradient-to-r from-p to-p-dark text-white font-black text-xl rounded-2xl transition-all shadow-2xl shadow-p/40 group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Verifying Node...
                      </>
                    ) : isSuccess ? (
                      <>Access Granted <CheckCircle2 className="w-5 h-5" /></>
                    ) : (
                      <>Verify Authorization <Sparkles className="w-5 h-5 fill-white" /></>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                </Button>
              </Magnetic>
            </motion.div>
          </form>

          <motion.div variants={itemVariants} className="mt-12 flex flex-col items-center gap-4">
            <p className="text-slate-500 text-sm">
              Didn't receive the signal?
            </p>
            <button 
              onClick={() => setTimer(60)}
              disabled={timer > 0}
              className="flex items-center gap-2 text-white font-black hover:text-p disabled:opacity-30 disabled:hover:text-white transition-all group/resend"
            >
              <RotateCcw className={`w-4 h-4 ${timer === 0 ? 'group-hover/resend:rotate-180 transition-transform duration-500' : ''}`} />
              {timer > 0 ? `Resend Signal in ${timer}s` : 'Resend Signal Now'}
            </button>
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}
