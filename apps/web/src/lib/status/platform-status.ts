export type ServiceStatus = 'healthy' | 'degraded' | 'maintenance' | 'offline';

export type StatusService = {
  id: string;
  name: string;
  description: string;
  status: ServiceStatus;
  lastUpdated: string | null;
};

/** Public labels — Task requires Operational / Degraded / Maintenance / Offline. */
export const SERVICE_STATUS_LABEL: Record<ServiceStatus, string> = {
  healthy: 'Operational',
  degraded: 'Degraded',
  maintenance: 'Maintenance',
  offline: 'Offline',
};

export const SERVICE_STATUS_STYLES: Record<
  ServiceStatus,
  { dot: string; text: string; badge: string }
> = {
  healthy: {
    dot: 'bg-chart-3 shadow-[0_0_10px_rgba(16,185,129,0.45)]',
    text: 'text-chart-3',
    badge: 'border-chart-3/30 bg-chart-3/10 text-chart-3',
  },
  degraded: {
    dot: 'bg-chart-4 shadow-[0_0_10px_rgba(245,158,11,0.4)]',
    text: 'text-chart-4',
    badge: 'border-chart-4/30 bg-chart-4/10 text-chart-4',
  },
  maintenance: {
    dot: 'bg-muted-foreground',
    text: 'text-muted-foreground',
    badge: 'border-[var(--card-border)] bg-muted text-muted-foreground',
  },
  offline: {
    dot: 'bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.35)]',
    text: 'text-destructive',
    badge: 'border-destructive/30 bg-destructive/10 text-destructive',
  },
};

type HealthPayload = {
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

function mapBinary(
  ok: boolean | null,
  checkingFallback: ServiceStatus = 'degraded',
): ServiceStatus {
  if (ok === true) return 'healthy';
  if (ok === false) return 'offline';
  return checkingFallback;
}

function mapHealthField(
  value: string | undefined,
  healthyValues: string[],
  degradedValues: string[] = [],
): ServiceStatus {
  if (!value) return 'degraded';
  if (healthyValues.includes(value)) return 'healthy';
  if (degradedValues.includes(value)) return 'degraded';
  return 'offline';
}

export function unwrapProbeBody(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === 'object') {
    const obj = payload as { data?: unknown };
    if (obj.data && typeof obj.data === 'object') {
      return obj.data as Record<string, unknown>;
    }
    return payload as Record<string, unknown>;
  }
  return {};
}

export function formatUptime(seconds: number | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) {
    return 'Unavailable';
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** Stable UTC timestamp — avoids SSR/client locale hydration mismatches. */
export function formatStatusTimestamp(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
}

export function isMaintenanceMode(): boolean {
  return process.env.NEXT_PUBLIC_STATUS_MAINTENANCE === 'true';
}

export function buildServices(input: {
  liveOk: boolean | null;
  readyOk: boolean | null;
  healthOk: boolean | null;
  health: HealthPayload | null;
  paymentsOk: boolean | null;
  marketplaceOk: boolean | null;
  checkedAt: string | null;
  maintenance?: boolean;
}): StatusService[] {
  const ts = input.checkedAt;
  const health = input.health;
  const forceMaintenance = Boolean(input.maintenance);

  const apiStatus: ServiceStatus = forceMaintenance
    ? 'maintenance'
    : input.liveOk === false
      ? 'offline'
      : input.readyOk === false || input.healthOk === false
        ? 'degraded'
        : input.liveOk === true && input.readyOk === true && input.healthOk === true
          ? 'healthy'
          : 'degraded';

  const withMaintenance = (status: ServiceStatus): ServiceStatus =>
    forceMaintenance ? 'maintenance' : status;

  return [
    {
      id: 'api',
      name: 'API Status',
      description: 'Public API liveness and readiness (/live, /ready, /health).',
      status: apiStatus,
      lastUpdated: ts,
    },
    {
      id: 'trading-engine',
      name: 'Trading Engine',
      description: 'Realtime trading gateway and execution websocket health.',
      status: withMaintenance(
        mapHealthField(health?.websocket, ['healthy'], ['degraded']),
      ),
      lastUpdated: health?.timestamp ?? ts,
    },
    {
      id: 'authentication',
      name: 'Authentication',
      description: 'Auth session cache (Redis) used for token and session checks.',
      status: withMaintenance(
        mapHealthField(health?.redis, ['connected'], ['degraded']),
      ),
      lastUpdated: health?.timestamp ?? ts,
    },
    {
      id: 'payments',
      name: 'Payments',
      description: 'Subscription plans endpoint used by billing checkout.',
      status: withMaintenance(mapBinary(input.paymentsOk)),
      lastUpdated: ts,
    },
    {
      id: 'marketplace',
      name: 'Marketplace',
      description: 'Public marketplace featured strategies catalog.',
      status: withMaintenance(mapBinary(input.marketplaceOk)),
      lastUpdated: ts,
    },
    {
      id: 'ai-coach',
      name: 'AI Coach',
      description:
        'Coach APIs require authentication; availability inferred from API liveness.',
      status: withMaintenance(mapBinary(input.liveOk)),
      lastUpdated: ts,
    },
    {
      id: 'database',
      name: 'Database',
      description: 'Primary application database connectivity.',
      status: withMaintenance(mapHealthField(health?.database, ['connected'], [])),
      lastUpdated: health?.timestamp ?? ts,
    },
    {
      id: 'broker',
      name: 'Broker Connectivity',
      description: 'MetaAPI broker integration configuration and connectivity path.',
      status: withMaintenance(
        mapHealthField(health?.metaApi, ['configured'], ['not_configured']),
      ),
      lastUpdated: health?.timestamp ?? ts,
    },
    {
      id: 'jobs',
      name: 'Background Jobs',
      description: 'Trade execution queue worker connectivity.',
      status: withMaintenance(
        mapHealthField(health?.queue, ['healthy'], ['degraded']),
      ),
      lastUpdated: health?.timestamp ?? ts,
    },
    {
      id: 'system',
      name: 'System Health',
      description: 'Aggregated platform health snapshot from /health.',
      status: withMaintenance(
        health?.status === 'ok'
          ? 'healthy'
          : health?.status === 'degraded'
            ? 'degraded'
            : health?.status === 'unhealthy' || input.liveOk === false
              ? 'offline'
              : 'degraded',
      ),
      lastUpdated: health?.timestamp ?? ts,
    },
  ];
}

export function overallFromServices(services: StatusService[]): ServiceStatus {
  if (services.some((s) => s.status === 'offline')) return 'offline';
  if (services.some((s) => s.status === 'maintenance')) return 'maintenance';
  if (services.some((s) => s.status === 'degraded')) return 'degraded';
  if (services.every((s) => s.status === 'healthy')) return 'healthy';
  return 'degraded';
}
