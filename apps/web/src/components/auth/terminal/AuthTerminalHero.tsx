'use client';

import { AuthTerminalWorldMap } from '@/components/auth/terminal/AuthTerminalWorldMap';
import { AuthTerminalMarketChart } from '@/components/auth/terminal/AuthTerminalMarketChart';
import {
  AuthTerminalFeatures,
  AuthTerminalTelemetry,
  AuthTerminalTrust,
} from '@/components/auth/terminal/AuthTerminalHeroExtras';
import { AuthTerminalLogo } from '@/components/auth/terminal/AuthTerminalLogo';

export function AuthTerminalHero() {
  return (
    <aside className="at-hero" aria-label="Profytron platform overview">
      <div className="at-hero__brand">
        <AuthTerminalLogo />
        <div className="at-hero__brand-text">
          <span className="at-hero__brand-name">PROFYTRON</span>
          <span className="at-hero__brand-tag">Algo Trading. Intelligently Automated.</span>
        </div>
      </div>

      <div className="at-hero__stage">
        <div className="at-hero__atmosphere" aria-hidden />
        <AuthTerminalWorldMap />
        <AuthTerminalMarketChart />
        <AuthTerminalTelemetry />
      </div>

      <AuthTerminalFeatures />
      <AuthTerminalTrust />
    </aside>
  );
}
