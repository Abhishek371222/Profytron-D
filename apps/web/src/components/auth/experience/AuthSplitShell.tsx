'use client';

import { motion } from 'framer-motion';
import { AuthExperienceBackground } from '@/components/auth/experience/AuthExperienceBackground';
import { AuthExperienceHeader } from '@/components/auth/experience/AuthExperienceHeader';
import { AuthSplitHeroPanel } from '@/components/auth/experience/AuthSplitHeroPanel';

type AuthSplitShellProps = {
  children: React.ReactNode;
};

export function AuthSplitShell({ children }: AuthSplitShellProps) {
  return (
    <div className="ax-page ax-page--split">
      <AuthExperienceBackground variant="split" />
      <div className="ax-page-inner">
        <AuthExperienceHeader />

        <main className="ax-split-main">
          <AuthSplitHeroPanel />

          <motion.div
            className="ax-split-card-wrap"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0, 0, 0.2, 1] }}
          >
            <div className="ax-glass-card ax-glass-card--split">{children}</div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
