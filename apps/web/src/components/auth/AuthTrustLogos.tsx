'use client';

const PARTNERS = ['Bloomberg', 'Reuters', 'CNBC', 'Nasdaq'] as const;

export function AuthTrustLogos() {
  return (
    <div className="auth-trust-logos" aria-label="Trusted partners">
      {PARTNERS.map((name) => (
        <span key={name} className="auth-trust-logo">
          {name}
        </span>
      ))}
    </div>
  );
}
