'use client';

import dynamic from 'next/dynamic';
import { AuthOrbitalArcs } from '@/components/auth/AuthOrbitalArcs';

const AuthGlobeWebGL = dynamic(
  () => import('@/components/auth/AuthGlobeWebGL').then((m) => m.AuthGlobeWebGL),
  {
    ssr: false,
    loading: () => <div className="auth-globe-webgl auth-globe-webgl--loading" aria-hidden />,
  },
);

export function AuthHeroComposition() {
  return (
    <div className="auth-hero-composition" aria-hidden>
      <div className="auth-hero-bg-stars" />
      <div className="auth-hero-volumetric" />
      <div className="auth-hero-earth-stage">
        <AuthGlobeWebGL />
      </div>
      <div className="auth-hero-atmosphere" />
      <AuthOrbitalArcs />
    </div>
  );
}
