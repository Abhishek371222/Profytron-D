'use client';

import Link from 'next/link';

export function AuthPageFooter() {
  return (
    <footer className="auth-page-footer auth-footer-span">
      <p>© {new Date().getFullYear()} Profytron Technologies Inc.</p>
      <nav className="auth-footer-links auth-decorative" aria-label="Legal">
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms of Service</Link>
        <Link href="/support">Support</Link>
      </nav>
    </footer>
  );
}
