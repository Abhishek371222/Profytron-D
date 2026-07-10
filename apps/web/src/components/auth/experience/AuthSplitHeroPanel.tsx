'use client';

import { Shield, LineChart, Zap, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthExperienceTrustBar } from '@/components/auth/experience/AuthExperienceTrustBar';

const FEATURES = [
  { icon: Shield, title: 'Institutional Security', desc: '256-bit encryption & bank-grade security' },
  { icon: LineChart, title: 'AI-Powered Trading', desc: 'Advanced algorithms for smarter trades' },
  { icon: Zap, title: 'Real-time Market Data', desc: 'Lightning fast data for better decisions' },
  { icon: Users, title: 'Trusted by Traders', desc: '100K+ active traders worldwide' },
] as const;

const fade = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, delay: 0.1 + i * 0.08, ease: [0, 0, 0.2, 1] },
  }),
};

export function AuthSplitHeroPanel() {
  return (
    <div className="ax-split-hero">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="ax-split-headline">
          Create <span className="ax-accent">your</span> account
        </h1>
        <p className="ax-split-lead">
          Join thousands of traders automating their strategies with institutional-grade technology.
        </p>
      </motion.div>

      <ul className="ax-split-features">
        {FEATURES.map(({ icon: Icon, title, desc }, i) => (
          <motion.li
            key={title}
            className="ax-split-feature"
            custom={i}
            initial="hidden"
            animate="visible"
            variants={fade}
          >
            <div className="ax-split-feature-icon">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="ax-split-feature-title">{title}</p>
              <p className="ax-split-feature-desc">{desc}</p>
            </div>
          </motion.li>
        ))}
      </ul>

      <AuthExperienceTrustBar className="ax-split-trust" />
    </div>
  );
}
