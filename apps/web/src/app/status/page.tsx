'use client';

import React from 'react';
import Link from 'next/link';

type Probe = {
  name: string;
  ok: boolean | null;
  detail: string;
};

async function probe(url: string): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    const text = await res.text();
    let status = `${res.status}`;
    try {
      const json = JSON.parse(text);
      const s = json?.data?.status ?? json?.status;
      if (s) status = `${res.status} · ${s}`;
    } catch {
      /* plain */
    }
    return { ok: res.ok, detail: status };
  } catch (e) {
    return { ok: false, detail: String((e as Error)?.message || e) };
  }
}

export default function StatusPage() {
  const [probes, setProbes] = React.useState<Probe[]>([
    { name: 'API /live', ok: null, detail: '…' },
    { name: 'API /ready', ok: null, detail: '…' },
    { name: 'API /health', ok: null, detail: '…' },
  ]);
  const [at, setAt] = React.useState<string>('');

  const refresh = React.useCallback(async () => {
    const base =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ||
      '';
    const paths = ['/live', '/ready', '/health'];
    const names = ['API /live', 'API /ready', 'API /health'];
    const next: Probe[] = [];
    for (let i = 0; i < paths.length; i++) {
      if (!base) {
        next.push({
          name: names[i],
          ok: null,
          detail: 'Set NEXT_PUBLIC_API_URL to enable live probes',
        });
        continue;
      }
      const r = await probe(`${base}${paths[i]}`);
      next.push({ name: names[i], ok: r.ok, detail: r.detail });
    }
    setProbes(next);
    setAt(new Date().toISOString());
  }, []);

  React.useEffect(() => {
    void refresh();
    const t = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(t);
  }, [refresh]);

  const overall =
    probes.every((p) => p.ok === true)
      ? 'Operational'
      : probes.some((p) => p.ok === false)
        ? 'Degraded / partial outage'
        : 'Checking…';

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#348398]">
          Profytron
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">System status</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Public health snapshot for operators and beta users. For incidents, see
          support or the ops dashboard.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--card-border)] bg-card p-5">
        <p className="text-sm text-muted-foreground">Overall</p>
        <p className="mt-1 text-xl font-semibold">{overall}</p>
        {at ? (
          <p className="mt-1 text-xs text-muted-foreground">Checked {at}</p>
        ) : null}
      </div>

      <ul className="space-y-3">
        {probes.map((p) => (
          <li
            key={p.name}
            className="flex items-center justify-between rounded-xl border border-[var(--card-border)] bg-card px-4 py-3"
          >
            <span className="font-medium">{p.name}</span>
            <span
              className={
                p.ok === true
                  ? 'text-emerald-600'
                  : p.ok === false
                    ? 'text-destructive'
                    : 'text-muted-foreground'
              }
            >
              {p.detail}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-3 text-sm">
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 hover:bg-muted"
        >
          Refresh
        </button>
        <Link href="/help" className="rounded-lg px-3 py-1.5 text-primary hover:underline">
          Help center
        </Link>
        <a
          href="mailto:support@profytron.com"
          className="rounded-lg px-3 py-1.5 text-primary hover:underline"
        >
          support@profytron.com
        </a>
      </div>
    </main>
  );
}
