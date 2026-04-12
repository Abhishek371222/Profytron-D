'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { ArrowRight, Mail, CheckCircle } from 'lucide-react';

export default function CareersPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <PublicPageLayout>
      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center justify-center py-28 overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Animated orbital rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="w-[500px] h-[500px] rounded-full border border-indigo-500/8"
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
            className="w-[700px] h-[700px] rounded-full border border-white/3"
          />
        </div>

        <div className="container mx-auto px-6 max-w-3xl relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-8"
          >
            {/* Status badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[11px] font-bold tracking-[0.35em] uppercase">
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-amber-400"
                />
                Positions Opening Soon
              </div>
            </div>

            {/* Headline */}
            <div>
              <h1 className="text-6xl md:text-8xl font-bold tracking-[-0.04em] text-white leading-[0.95]">
                We're Building<br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 via-indigo-300 to-cyan-400">
                  The Team.
                </span>
              </h1>
              <p className="mt-8 text-lg text-white/50 leading-relaxed max-w-xl mx-auto font-medium">
                Profytron is assembling an elite group of engineers, quants, and builders. Formal job listings are coming soon — get notified the moment we go live.
              </p>
            </div>

            {/* Email capture */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {!submitted ? (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto">
                  <div className="relative flex-1 w-full">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/4 border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-indigo-500/60 focus:bg-white/6 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-12 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-[0_0_24px_rgba(99,102,241,0.35)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] flex items-center gap-2 whitespace-nowrap"
                  >
                    Notify Me <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-medium text-sm max-w-md mx-auto"
                >
                  <CheckCircle className="w-5 h-5" />
                  You're on the list. We'll be in touch.
                </motion.div>
              )}
              <p className="mt-3 text-white/20 text-xs font-mono">No spam. Unsubscribe at any time.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Open application */}
      <section className="py-20 border-t border-white/5">
        <div className="container mx-auto px-6 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl bg-linear-to-br from-indigo-600/8 to-cyan-600/5 border border-indigo-500/20 text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-3">Can't Wait?</h2>
            <p className="text-white/50 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
              Send us your work now. Exceptional people don't wait for job postings.
            </p>
            <a
              href="mailto:careers@profytron.com"
              className="inline-flex items-center gap-3 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-all shadow-[0_0_24px_rgba(99,102,241,0.3)]"
            >
              <Mail className="w-4 h-4" /> careers@profytron.com
            </a>
          </motion.div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
