'use client';

import { AuthExperienceThemeToggle } from '@/components/auth/experience/AuthExperienceThemeToggle';
import { AuthExperienceLogo } from '@/components/auth/experience/AuthExperienceLogo';

export function AuthExperienceHeader() {
  return (
    <header className="ax-header">
      <div className="ax-brand">
        <div className="ax-brand-mark">
          <AuthExperienceLogo />
        </div>
        <div className="ax-brand-text">
          <span className="ax-brand-name">
            <span className="ax-brand-profy">PROFY</span>
            <span className="ax-brand-tron">TRON</span>
          </span>
          <span className="ax-brand-tagline">Algo Trading. Intelligently Automated.</span>
        </div>
      </div>
      <AuthExperienceThemeToggle />
    </header>
  );
}
