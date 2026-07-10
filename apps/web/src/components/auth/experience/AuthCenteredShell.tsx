'use client';

import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { AuthExperienceBackground } from '@/components/auth/experience/AuthExperienceBackground';
import { AuthExperienceHeader } from '@/components/auth/experience/AuthExperienceHeader';
import { AuthExperienceFeatureStrip } from '@/components/auth/experience/AuthExperienceFeatureStrip';
import { AuthExperienceTrustBar } from '@/components/auth/experience/AuthExperienceTrustBar';

type AuthCenteredShellProps = {
  children: React.ReactNode;
};

export function AuthCenteredShell({ children }: AuthCenteredShellProps) {
  return (
    <div className="ax-page ax-page--centered">
      <AuthExperienceBackground variant="centered" />
      <div className="ax-page-inner">
        <AuthExperienceHeader />

        <main className="ax-centered-main">
          <motion.div
            className="ax-centered-hero"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0, 0, 0.2, 1] }}
          >
            <h1 className="ax-centered-headline">
              Welcome <span className="ax-accent">back</span>
            </h1>
            <p className="ax-centered-lead">Sign in to continue to your trading workspace</p>
            <div className="ax-security-badge">
              <Shield className="h-3.5 w-3.5" aria-hidden />
              Institutional-grade. Built for serious traders.
            </div>
          </motion.div>

          <motion.div
            className="ax-glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06, ease: [0, 0, 0.2, 1] }}
          >
            {children}
          </motion.div>

          <AuthExperienceFeatureStrip />
          <AuthExperienceTrustBar />
        </main>
      </div>
    </div>
  );
}
