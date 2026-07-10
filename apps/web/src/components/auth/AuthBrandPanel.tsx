'use client';

import { Bot, LineChart, Shield } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { AuthTrustLogos } from '@/components/auth/AuthTrustLogos';

const FEATURES = [
  {
    icon: Bot,
    title: 'AI-Powered Strategies',
    description: 'Backtested. Automated. Profitable.',
  },
  {
    icon: LineChart,
    title: 'Real-time Market Intelligence',
    description: 'Live data. Smarter decisions.',
  },
  {
    icon: Shield,
    title: 'Institutional-Grade Security',
    description: '256-bit encryption & advanced protocols.',
  },
] as const;

type AuthBrandPanelProps = {
  variant: 'login' | 'register';
};

export function AuthBrandPanel({ variant }: AuthBrandPanelProps) {
  const welcomeAccent = variant === 'login' ? 'back' : 'aboard';
  const description =
    variant === 'login'
      ? 'Sign in to your Profytron account and continue monitoring live trading intelligence, strategies, and portfolio performance.'
      : 'Create your Profytron account and unlock AI-powered strategies, real-time market intelligence, and institutional-grade security.';

  return (
    <aside className="auth-hero-column" aria-label="Platform overview">
      <div className="auth-hero-inner">
        <header className="auth-hero-head">
          <BrandLogo size="lg" />
        </header>

        <main className="auth-hero-main">
          <div className="auth-secure-badge">
            <Shield className="h-3.5 w-3.5" aria-hidden />
            Secure Login
          </div>

          <h1 className="auth-welcome-title">
            Welcome <span className="auth-welcome-accent">{welcomeAccent}</span>
          </h1>

          <p className="auth-welcome-desc">{description}</p>

          <ul className="auth-features" aria-label="Platform features">
            {FEATURES.map(({ icon: Icon, title, description: desc }) => (
              <li key={title} className="auth-feature-item">
                <div className="auth-feature-icon">
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                </div>
                <div>
                  <p className="auth-feature-title">{title}</p>
                  <p className="auth-feature-desc">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </main>

        <footer className="auth-hero-foot">
          <p className="auth-trust-label">Trusted by professional traders worldwide</p>
          <AuthTrustLogos />
        </footer>
      </div>
    </aside>
  );
}
