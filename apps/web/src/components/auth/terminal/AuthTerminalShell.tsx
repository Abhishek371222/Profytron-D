'use client';

import { motion } from 'framer-motion';
import { AuthTerminalHero } from '@/components/auth/terminal/AuthTerminalHero';
import { AuthTerminalThemeToggle } from '@/components/auth/terminal/AuthTerminalThemeToggle';

type AuthTerminalShellProps = {
  children: React.ReactNode;
};

export function AuthTerminalShell({ children }: AuthTerminalShellProps) {
  return (
    <div className="at-page">
      <AuthTerminalHero />

      <section className="at-auth" aria-label="Sign in">
        <motion.div
          className="at-auth__panel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0, 0, 0.2, 1] }}
        >
          <div className="at-auth__panel-top">
            <AuthTerminalThemeToggle />
          </div>
          {children}
        </motion.div>
      </section>
    </div>
  );
}
