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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-chart-5/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Animated orbital rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="w-[500px] h-[500px] rounded-full border border-primary/8"
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
            className="w-[700px] h-[700px] rounded-full border border-border"
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
              <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-chart-4/10 border border-chart-4/25 text-chart-4 text-caption font-bold tracking-[0.35em] uppercase">
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-chart-4"
                />
                Positions Opening Soon
              </div>
            </div>

            {/* Headline */}
            <div>
              <h1 className="text-6xl md:text-8xl font-bold tracking-[-0.04em] text-foreground leading-[0.95]">
                We're Building<br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-primary to-chart-5">
                  The Team.
                </span>
              </h1>
              <p className="mt-8 text-lg text-foreground/50 leading-relaxed max-w-xl mx-auto font-medium">
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
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full h-12 pl-11 pr-4 rounded-xl bg-foreground/4 border border-border text-foreground text-sm placeholder:text-foreground/25 focus:outline-none focus:border-primary/60 focus:bg-foreground/6 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-12 px-6 rounded-xl bg-primary hover:bg-primary text-foreground text-sm font-semibold transition-all shadow-[0_0_24px_rgba(99,102,241,0.35)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] flex items-center gap-2 whitespace-nowrap"
                  >
                    Notify Me <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-chart-3/10 border border-chart-3/25 text-chart-3 font-medium text-sm max-w-md mx-auto"
                >
                  <CheckCircle className="w-5 h-5" />
                  You're on the list. We'll be in touch.
                </motion.div>
              )}
              <p className="mt-3 text-foreground/20 text-xs font-mono">No spam. Unsubscribe at any time.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Open application */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-6 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl bg-linear-to-br from-primary/8 to-chart-5/5 border border-primary/20 text-center"
          >
            <h2 className="text-2xl font-bold text-foreground mb-3">Can't Wait?</h2>
            <p className="text-foreground/50 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
              Send us your work now. Exceptional people don't wait for job postings.
            </p>
            <a
              href="mailto:careers@profytron.com"
              className="inline-flex items-center gap-3 px-7 py-3.5 bg-primary hover:bg-primary text-foreground rounded-xl font-semibold text-sm transition-all shadow-[0_0_24px_rgba(99,102,241,0.3)]"
            >
              <Mail className="w-4 h-4" /> careers@profytron.com
            </a>
          </motion.div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
