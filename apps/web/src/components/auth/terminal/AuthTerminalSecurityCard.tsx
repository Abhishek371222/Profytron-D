'use client';

import { ArrowRight, Shield } from 'lucide-react';

export function AuthTerminalSecurityCard() {
  return (
    <div className="at-security-card">
      <div className="at-security-card__icon">
        <Shield className="h-5 w-5" aria-hidden />
      </div>
      <div className="at-security-card__body">
        <p className="at-security-card__title">Secure. Reliable. Professional.</p>
        <p className="at-security-card__desc">
          Your data and assets are protected with enterprise-grade security.
        </p>
      </div>
      <ArrowRight className="at-security-card__arrow h-4 w-4" aria-hidden />
    </div>
  );
}
