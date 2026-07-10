'use client';

import { SignInHeroPanel } from '@/components/auth/sign-in/SignInHeroPanel';
import { SignInEarthStage } from '@/components/auth/sign-in/SignInEarthStage';

type SignInPageShellProps = {
  children: React.ReactNode;
};

export function SignInPageShell({ children }: SignInPageShellProps) {
  return (
    <div className="sign-in-page">
      <div className="sign-in-grid-bg" aria-hidden />
      <div className="sign-in-globe-glow" aria-hidden />

      <div className="sign-in-container">
        <SignInHeroPanel />

        <div className="sign-in-right">
          <SignInEarthStage />
          <div className="sign-in-login-wrap">
            <div className="sign-in-login-card">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
