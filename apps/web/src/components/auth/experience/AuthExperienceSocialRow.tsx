'use client';

import React from 'react';
import { motion, type Variants } from 'framer-motion';

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 shrink-0">
      <path fill="#EA4335" d="M12 10.2v3.95h5.62c-.24 1.28-.97 2.37-2.07 3.1v2.58h3.35c1.96-1.8 3.1-4.45 3.1-7.58 0-.73-.07-1.42-.2-2.05H12Z" />
      <path fill="#34A853" d="M6.64 14.34 6.04 14l-2.35 1.83C5.1 19.14 8.18 21 12 21c2.64 0 4.86-.87 6.48-2.37l-3.35-2.58c-.92.62-2.1.98-3.13.98-2.4 0-4.43-1.62-5.16-3.79Z" />
      <path fill="#4A90E2" d="M12 5.02c1.44 0 2.73.5 3.75 1.48l2.81-2.81C17.11 2.13 14.93 1 12 1 8.18 1 5.1 2.86 3.69 5.83L6.97 8.3C7.7 6.14 9.6 5.02 12 5.02Z" />
      <path fill="#FBBC05" d="M6.64 9.66c.22-.68.53-1.3.93-1.86L4.29 5.33A11.92 11.92 0 0 0 1 12c0 1.19.22 2.34.65 3.43L6.64 9.66Z" />
    </svg>
  );
}

function GitHubLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 shrink-0 fill-current">
      <path d="M12 2C6.48 2 2 6.58 2 12.24c0 4.52 2.87 8.36 6.84 9.71.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.37-3.37-1.37-.45-1.17-1.1-1.48-1.1-1.48-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.34-1.11.62-1.37-2.22-.26-4.56-1.13-4.56-5.02 0-1.11.39-2.02 1.03-2.73-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.04a9.24 9.24 0 0 1 5 0c1.9-1.31 2.74-1.04 2.74-1.04.55 1.42.2 2.47.1 2.73.64.71 1.03 1.62 1.03 2.73 0 3.9-2.35 4.76-4.58 5.01.35.31.66.92.66 1.86 0 1.34-.01 2.42-.01 2.75 0 .26.18.58.69.48A10.06 10.06 0 0 0 22 12.24C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

type Props = {
  onGoogle: () => void;
  onGithub: () => void;
  itemVariants?: Variants;
};

export function AuthExperienceSocialRow({ onGoogle, onGithub, itemVariants }: Props) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="ax-social-row" aria-hidden>
        <div className="ax-social-btn ax-social-btn--ghost" />
        <div className="ax-social-btn ax-social-btn--ghost" />
      </div>
    );
  }

  const Btn = itemVariants ? motion.button : 'button';

  return (
    <div className="ax-social-row">
      <Btn
        type="button"
        {...(itemVariants ? { variants: itemVariants } : {})}
        onClick={onGoogle}
        className="ax-social-btn"
      >
        <GoogleLogo />
        Google
      </Btn>
      <Btn
        type="button"
        {...(itemVariants ? { variants: itemVariants } : {})}
        onClick={onGithub}
        className="ax-social-btn"
      >
        <GitHubLogo />
        GitHub
      </Btn>
    </div>
  );
}
