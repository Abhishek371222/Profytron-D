'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel';
import { AuthHeroComposition } from '@/components/auth/AuthHeroComposition';

type AuthPageShellProps = {
  variant: 'login' | 'register';
  children: React.ReactNode;
};

export function AuthPageShell({ variant, children }: AuthPageShellProps) {
  return (
    <div className="auth-page relative flex min-h-dvh flex-col">
      <AuthHeroComposition />

      <header className="auth-topbar">
        <Link href="/" className="auth-back-btn">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Link>
        <ThemeToggle size="sm" />
      </header>

      <div className="auth-grid flex-1">
        <AuthBrandPanel variant={variant} />

        <section className="auth-form-column">
          <div className="auth-form-inner">
            <div className="auth-mobile-brand">
              <BrandLogo size="md" showTagline taglineVariant="algo" variant="auth" />
            </div>
            <div className="auth-card">{children}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
