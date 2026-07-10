'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { SignInFloatingCards } from '@/components/auth/sign-in/SignInFloatingCards';
import { SignInParticles } from '@/components/auth/sign-in/SignInParticles';

const AuthGlobeWebGL = dynamic(
  () => import('@/components/auth/AuthGlobeWebGL').then((m) => m.AuthGlobeWebGL),
  {
    ssr: false,
    loading: () => <div className="sign-in-earth-canvas sign-in-earth-canvas--loading" aria-hidden />,
  },
);

export function SignInEarthStage() {
  return (
    <motion.div
      className="sign-in-stage"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0, 0, 0.2, 1], delay: 0.15 }}
      aria-hidden
    >
      <div className="sign-in-earth-shadow" />
      <div className="sign-in-earth-wrap">
        <AuthGlobeWebGL rotationSpeed={0.000873} showParticles={false} />
      </div>
      <SignInFloatingCards />
      <SignInParticles />
    </motion.div>
  );
}
