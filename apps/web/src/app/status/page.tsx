'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, RefreshCw, Mail, Clock3, GitCommit, Server } from 'lucide-react';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { BrandGradientText } from '@/components/brand/BrandGradientText';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { SUPPORT_EMAIL, SITE_URL } from '@/lib/seo/constants';
import { cn } from '@/lib/utils';
import {
  SERVICE_STATUS_LABEL,
  SERVICE_STATUS_STYLES,
  buildServices,
  formatStatusTimestamp,
  formatUptime,
  isMaintenanceMode,
  overallFromServices,
  unwrapProbeBody,
  type ServiceStatus,
  type StatusService,
} from '@/lib/status/platform-status';

type ProbeResult = {
  ok: boolean | null;
  body: Record<string, unknown>;
  ms: number | null;
};

async function probe(url: string, timeoutMs = 8_000): Promise<ProbeResult> {
  const started = performance.now();
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
    const ms = Math.round(performance.now() - started);
    const text = await res.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* plain */
    }
    return {
      ok: res.ok,
      body: unwrapProbeBody(json),
      ms,
    };
  } catch {
    return { ok: false, body: {}, ms: null };
  } finally {
    window.clearTimeout(timer);
  }
}

function apiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ||
    '/api'
  );
}

const MAINTENANCE = isMaintenanceMode();

const INITIAL_SERVICES: StatusService[] = buildServices({
  liveOk: null,
  readyOk: null,
  healthOk: null,
  health: null,
  paymentsOk: null,
  marketplaceOk: null,
  checkedAt: null,
  maintenance: MAINTENANCE,
});

const STATUS_LEGEND: ServiceStatus[] = [
  'healthy',
  'degraded',
  'maintenance',
  'offline',
];

function StatusBadge({
  status,
  loading,
}: {
  status: ServiceStatus;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-muted px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" aria-hidden />
        Checking…
      </span>
    );
  }
  const styles = SERVICE_STATUS_STYLES[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
        styles.badge,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', styles.dot)} aria-hidden />
      {SERVICE_STATUS_LABEL[status]}
    </span>
  );
}

export default function StatusPage() {
  const [services, setServices] = React.useState<StatusService[]>(INITIAL_SERVICES);
  const [overall, setOverall] = React.useState<ServiceStatus>(
    MAINTENANCE ? 'maintenance' : 'degraded',
  );
  const [checkedAt, setCheckedAt] = React.useState<string | null>(null);
  const [responseMs, setResponseMs] = React.useState<number | null>(null);
  const [uptimeLabel, setUptimeLabel] = React.useState('Checking…');
  const [version, setVersion] = React.useState('—');
  const [deployment, setDeployment] = React.useState('—');
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const base = apiBase();
      const [live, ready, health, payments, marketplace] = await Promise.all([
        probe(`${base}/live`),
        probe(`${base}/ready`),
        probe(`${base}/health`),
        probe(`${base}/subscriptions/plans`),
        probe(`${base}/marketplace/featured`),
      ]);

      const at = new Date().toISOString();
      const healthBody = health.body as {
        status?: string;
        database?: string;
        redis?: string;
        queue?: string;
        websocket?: string;
        metaApi?: string;
        uptime?: number;
        timestamp?: string;
        version?: string;
        gitSha?: string | null;
      };

      const next = buildServices({
        liveOk: live.ok,
        readyOk: ready.ok,
        healthOk: health.ok,
        health: Object.keys(healthBody).length ? healthBody : null,
        paymentsOk: payments.ok,
        marketplaceOk: marketplace.ok,
        checkedAt: at,
        maintenance: MAINTENANCE,
      });

      setServices(next);
      setOverall(overallFromServices(next));
      setCheckedAt(at);
      setResponseMs(health.ms ?? live.ms);
      setUptimeLabel(
        formatUptime(
          typeof healthBody.uptime === 'number'
            ? healthBody.uptime
            : (live.body.uptime as number | undefined),
        ),
      );
      const reportedVersion =
        (typeof healthBody.version === 'string' && healthBody.version) ||
        (typeof live.body.version === 'string' ? String(live.body.version) : '');
      setVersion(
        reportedVersion && reportedVersion !== 'unknown'
          ? reportedVersion
          : 'Unavailable',
      );
      setDeployment(
        healthBody.gitSha
          ? String(healthBody.gitSha)
          : live.body.gitSha
            ? String(live.body.gitSha)
            : 'Not reported by API',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
    const t = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(t);
  }, [refresh]);

  const overallStyles = SERVICE_STATUS_STYLES[overall];

  return (
    <PublicPageLayout>
      <JsonLd
        type="breadcrumb"
        breadcrumbs={[
          { name: 'Home', url: SITE_URL },
          { name: 'Status', url: `${SITE_URL}/status` },
        ]}
      />

      {/* Static hero (no framer-motion) — same marketing classes, lower JS/CLS. */}
      <section className="marketing-hero exp-lighting">
        <div className="page-container max-w-5xl">
          <span className="landing-eyebrow mb-6">
            <Activity className="h-3.5 w-3.5" aria-hidden />
            System Status
          </span>
          <h1 className="brand-display-heading mb-5 text-4xl sm:text-5xl md:text-[3.25rem]">
            Platform status <BrandGradientText>at a glance.</BrandGradientText>
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Live health snapshot for Profytron services. Probes refresh every 30 seconds from the
            public API.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3" role="status" aria-live="polite">
            <StatusBadge status={overall} loading={loading} />
            {checkedAt ? (
              <span className="text-xs text-muted-foreground">
                Last checked {formatStatusTimestamp(checkedAt)}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="marketing-section pb-20">
        <div className="page-container max-w-5xl">
        <div className="mb-8">
          <Breadcrumbs items={[{ label: 'Status' }]} />
        </div>

        <div className="landing-panel mb-6 min-h-[8.5rem] p-6 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Overall Platform Status</p>
              <p
                className={cn(
                  'mt-1 text-2xl font-semibold tracking-tight',
                  loading ? 'text-muted-foreground' : overallStyles.text,
                )}
              >
                {loading ? 'Checking…' : SERVICE_STATUS_LABEL[overall]}
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Aggregated from API health, database, queue, broker connectivity, and public product
                endpoints.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={refreshing}
              aria-busy={refreshing}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[var(--card-border)] px-3.5 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
            >
              <RefreshCw
                className={cn('h-4 w-4', refreshing && 'animate-spin')}
                aria-hidden
              />
              Refresh
            </button>
          </div>
        </div>

        <ul
          className="mb-8 flex flex-wrap gap-2"
          aria-label="Status legend"
        >
          {STATUS_LEGEND.map((key) => (
            <li key={key}>
              <StatusBadge status={key} />
            </li>
          ))}
        </ul>

        <h2 className="dash-section-title mb-4 text-base">Services</h2>
        <ul className="mb-10 min-h-[28rem] space-y-3" aria-live="polite">
          {services.map((service) => {
            const styles = SERVICE_STATUS_STYLES[service.status];
            return (
              <li key={service.id}>
                <div className="landing-panel min-h-[6.5rem] p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn('h-2 w-2 shrink-0 rounded-full', styles.dot)}
                          aria-hidden
                        />
                        <h3 className="font-semibold text-foreground">{service.name}</h3>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {service.description}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Last updated: {formatStatusTimestamp(service.lastUpdated)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
                        loading
                          ? 'border-[var(--card-border)] bg-muted text-muted-foreground'
                          : styles.badge,
                      )}
                      aria-label={`${service.name} status: ${loading ? 'Checking' : SERVICE_STATUS_LABEL[service.status]}`}
                    >
                      {loading ? 'Checking…' : SERVICE_STATUS_LABEL[service.status]}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <h2 className="dash-section-title mb-4 text-base">Platform details</h2>
        <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="landing-panel min-h-[7rem] p-6 sm:p-7">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <Clock3 className="h-4 w-4" aria-hidden />
              <span className="text-sm font-medium">Response Time</span>
            </div>
            <p className="text-xl font-semibold tabular-nums">
              {responseMs != null ? `${responseMs} ms` : '—'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Client-measured /health probe latency
            </p>
          </div>

          <div className="landing-panel min-h-[7rem] p-6 sm:p-7">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <Server className="h-4 w-4" aria-hidden />
              <span className="text-sm font-medium">Uptime</span>
            </div>
            <p className="text-xl font-semibold tabular-nums">{uptimeLabel}</p>
            <p className="mt-1 text-xs text-muted-foreground">API process uptime from /health</p>
          </div>

          <div className="landing-panel min-h-[7rem] p-6 sm:p-7">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4" aria-hidden />
              <span className="text-sm font-medium">Current Version</span>
            </div>
            <p className="text-xl font-semibold tabular-nums">{version}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Reported by the API health endpoint
            </p>
          </div>

          <div className="landing-panel min-h-[7rem] p-6 sm:p-7">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <GitCommit className="h-4 w-4" aria-hidden />
              <span className="text-sm font-medium">Last Deployment</span>
            </div>
            <p className="text-base font-semibold font-mono sm:text-xl">{deployment}</p>
            <p className="mt-1 text-xs text-muted-foreground">Git SHA from API when available</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="landing-panel p-6 sm:p-7">
            <h3 className="dash-section-title mb-2 text-base">Last Incident</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              No critical incidents (SEV1/SEV2) are currently recorded for the closed-beta
              operations window.
            </p>
          </div>

          <div className="landing-panel p-6 sm:p-7">
            <h3 className="dash-section-title mb-2 text-base">Support Contact</h3>
            <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
              Report outages or ask for status updates.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-flex items-center gap-2 font-semibold text-primary hover:underline underline-offset-4"
              >
                <Mail className="h-4 w-4" aria-hidden />
                {SUPPORT_EMAIL}
              </a>
              <Link
                href="/help"
                className="font-semibold text-primary hover:underline underline-offset-4"
              >
                Help center
              </Link>
              <Link
                href="/settings/support"
                className="font-semibold text-primary hover:underline underline-offset-4"
              >
                Open a ticket
              </Link>
            </div>
          </div>
        </div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
