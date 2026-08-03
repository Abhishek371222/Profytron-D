'use client';

/**
 * PT — API keys security UX review (Day 39)
 * Secrets stay server-managed. This surface explains what exists (or not)
 * and points users at safer paths (broker / profile / docs).
 */
import Link from 'next/link';
import { KeyRound, Shield, ExternalLink, ArrowRight } from 'lucide-react';

export default function APIKeysPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
          <KeyRound className="h-6 w-6 text-primary" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">API access</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Profytron does not currently issue personal API keys in the app. Bot execution and
          account data use authenticated sessions (Bearer + refresh cookies). Third-party
          webhook integrations, when available, are configured by the operations team.
        </p>
      </div>

      <div
        className="rounded-2xl border border-[var(--card-border)] bg-card p-5 space-y-3"
        role="status"
      >
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="space-y-1 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Security defaults</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>Never paste broker investor passwords into chat or email.</li>
              <li>Rotate MT5 credentials only from Connected Accounts.</li>
              <li>Enable 2FA under Security when available on your plan.</li>
              <li>No secrets are stored or displayed on this page.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href="/settings/security"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          Security settings
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/settings/profile"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[var(--card-border)] px-4 text-sm font-semibold"
        >
          Profile
        </Link>
        <Link
          href="/api-reference"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[var(--card-border)] px-4 text-sm font-semibold"
        >
          Public API docs
          <ExternalLink className="h-4 w-4" />
        </Link>
        <Link
          href="/connected-accounts"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[var(--card-border)] px-4 text-sm font-semibold"
        >
          Connected accounts
        </Link>
      </div>
    </div>
  );
}
