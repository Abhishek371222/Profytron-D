'use client';

import { Lock } from 'lucide-react';

export function AuthSecurityFooter() {
  return (
    <div className="auth-decorative auth-security-box">
      <div className="auth-security-icon">
        <Lock className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="auth-security-title">Your security is our priority</p>
        <p className="auth-security-desc">256-bit encryption &amp; bank-grade infrastructure</p>
      </div>
    </div>
  );
}
