'use client';

import React from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type CheckResult = {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  details: string;
};

export default function OauthDiagnosticsPage() {
  const [checks, setChecks] = React.useState<CheckResult[]>([]);
  const [running, setRunning] = React.useState(false);

  const runDiagnostics = async () => {
    setRunning(true);
    const results: CheckResult[] = [];

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const redirectUrl = `${window.location.origin}/auth/callback`;

    if (supabaseUrl && supabaseAnonKey) {
      results.push({
        name: 'Environment Variables',
        status: 'pass',
        details: 'Supabase URL and anonymous key are present.',
      });
    } else {
      results.push({
        name: 'Environment Variables',
        status: 'fail',
        details: 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      });
    }

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        results.push({
          name: 'Supabase Session Check',
          status: 'warn',
          details: `Session check returned error: ${error.message}`,
        });
      } else {
        const hasSession = !!data.session;
        results.push({
          name: 'Supabase Session Check',
          status: 'pass',
          details: hasSession
            ? 'Session exists. OAuth callback likely succeeded previously.'
            : 'No active session found. This is expected before login.',
        });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      results.push({
        name: 'Supabase Session Check',
        status: 'fail',
        details: `Session check failed: ${message}`,
      });
    }

    results.push({
      name: 'Redirect URI',
      status: 'pass',
      details: `Current callback URI: ${redirectUrl}`,
    });

    setChecks(results);
    setRunning(false);
  };

  const triggerGoogleOauth = async () => {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      alert(`Google OAuth init failed: ${error.message}`);
    }
  };

  return (
    <main className="min-h-screen bg-bg-base p-6 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">OAuth Diagnostics</h1>
          <p className="mt-2 text-sm text-white/70">
            Run checks and validate Google OAuth setup for this environment.
          </p>
        </div>

        <Card className="space-y-3 border-white/10 bg-black/40 p-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={runDiagnostics} disabled={running}>
              {running ? 'Running...' : 'Run Diagnostics'}
            </Button>
            <Button variant="outline" onClick={triggerGoogleOauth}>
              Test Google OAuth
            </Button>
            <Link href="/login" className="inline-flex items-center rounded-md border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10">
              Back to Login
            </Link>
          </div>
        </Card>

        <Card className="space-y-3 border-white/10 bg-black/40 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/70">Checks</h2>
          {checks.length === 0 ? (
            <p className="text-sm text-white/60">No checks run yet.</p>
          ) : (
            <ul className="space-y-2">
              {checks.map((check) => (
                <li key={check.name} className="rounded-md border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{check.name}</span>
                    <span
                      className={`rounded px-2 py-0.5 text-xs uppercase ${
                        check.status === 'pass'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : check.status === 'warn'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {check.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-white/70">{check.details}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="space-y-2 border-white/10 bg-black/40 p-4 text-sm text-white/80">
          <p className="font-semibold">Required provider configuration</p>
          <p>1. Enable Google provider in Supabase Auth providers.</p>
          <p>2. Configure Google OAuth credentials (client id and secret) in Supabase.</p>
          <p>3. Add redirect URIs in Google Cloud:</p>
          <p className="pl-2">- http://localhost:3000/auth/callback</p>
          <p className="pl-2">- https://nghlhhsdtewrchdeyean.supabase.co/auth/v1/callback</p>
        </Card>
      </div>
    </main>
  );
}
