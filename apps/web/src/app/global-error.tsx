'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

/**
 * global-error replaces the ROOT layout when the layout itself throws, so it
 * renders outside every provider and without globals.css/fonts. Everything here
 * must therefore be fully self-contained: its own <html>/<body> and inline,
 * theme-aware styles (via a scoped <style> using prefers-color-scheme).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          background: '#0a0a0a',
          color: '#fafafa',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        <style>{`
          @media (prefers-color-scheme: light) {
            body { background: #ffffff !important; color: #121212 !important; }
            .ge-sub { color: #52525b !important; }
            .ge-btn-secondary { color: #52525b !important; border-color: rgba(0,0,0,0.12) !important; }
          }
          .ge-btn:focus-visible { outline: 2px solid #368B9D; outline-offset: 2px; }
        `}</style>
        <main
          role="alert"
          style={{ maxWidth: '28rem', textAlign: 'center' }}
        >
          <div
            aria-hidden="true"
            style={{
              width: '4rem',
              height: '4rem',
              margin: '0 auto 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '1rem',
              border: '1px solid rgba(239,68,68,0.2)',
              background: 'rgba(239,68,68,0.1)',
              fontSize: '1.75rem',
            }}
          >
            ⚠️
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.5rem' }}>
            Something went wrong
          </h1>
          <p className="ge-sub" style={{ fontSize: '0.875rem', color: '#a1a1aa', margin: '0 0 0.25rem' }}>
            {error?.message || 'A critical error occurred. Please reload the page.'}
          </p>
          {error?.digest ? (
            <p style={{ fontSize: '0.75rem', color: '#71717a', margin: '0 0 1.5rem' }}>
              Reference: {error.digest}
            </p>
          ) : (
            <div style={{ height: '1rem' }} />
          )}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              justifyContent: 'center',
              marginTop: '1.25rem',
            }}
          >
            <button
              type="button"
              className="ge-btn"
              onClick={reset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                background: '#368B9D',
                color: '#ffffff',
              }}
            >
              Try again
            </button>
            {/* Intentionally a plain <a>, not next/link: a global error means the
                React tree/router is broken, so we want a full-document reload to
                escape the crashed state rather than a client-side transition. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="ge-btn ge-btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                borderRadius: '0.75rem',
                border: '1px solid rgba(255,255,255,0.15)',
                textDecoration: 'none',
                color: '#a1a1aa',
              }}
            >
              Return home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
