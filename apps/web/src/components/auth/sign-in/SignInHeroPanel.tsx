'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Bot, LineChart, Shield } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';

const FEATURES = [
  {
    icon: Bot,
    title: 'AI Powered Strategies',
    description: 'Backtested. Automated. Profitable.',
  },
  {
    icon: LineChart,
    title: 'Real-time Intelligence',
    description: 'Live data. Smarter decisions.',
  },
  {
    icon: Shield,
    title: 'Institutional Security',
    description: '256-bit encryption & advanced protocols.',
  },
] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0, 0, 0.2, 1] as const },
  },
};

const featureStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export function SignInHeroPanel() {
  return (
    <aside className="sign-in-left" aria-label="Platform overview">
      <Link href="/" className="sign-in-back-btn">
        <ArrowLeft className="sign-in-back-icon" aria-hidden />
        Back
      </Link>

      <motion.div
        className="sign-in-brand-block"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
      >
        <BrandLogo
          size="lg"
          showTagline={false}
          variant="auth"
          className="sign-in-logo"
        />
        <p className="sign-in-tagline">Algo Trading · Intelligently Automated</p>
      </motion.div>

      <motion.div
        className="sign-in-hero-content"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.12 } } }}
      >
        <motion.div variants={fadeUp} className="sign-in-badge">
          <Shield className="h-3.5 w-3.5" aria-hidden />
          Secure Login
        </motion.div>

        <motion.h1 variants={fadeUp} className="sign-in-headline">
          Welcome <span className="sign-in-headline-accent">back</span>
        </motion.h1>

        <motion.p variants={fadeUp} className="sign-in-lead">
          Sign in to your Profytron account and continue monitoring live trading intelligence,
          strategies, and portfolio performance.
        </motion.p>

        <motion.ul
          className="sign-in-features"
          variants={featureStagger}
          initial="hidden"
          animate="visible"
        >
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <motion.li key={title} variants={fadeUp} className="sign-in-feature-card">
              <div className="sign-in-feature-icon">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="sign-in-feature-title">{title}</p>
                <p className="sign-in-feature-desc">{description}</p>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>
    </aside>
  );
}
