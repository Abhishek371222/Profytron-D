'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentsApi, type AgentActivityJob } from '@/lib/api/agents';
import { toast } from 'sonner';
import {
  Bot,
  Zap,
  DollarSign,
  Shield,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Play,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: 'text-chart-3 bg-chart-3/10 border-chart-3/30',
  PROCESSING: 'text-chart-4 bg-chart-4/10 border-chart-4/30',
  FAILED: 'text-destructive bg-destructive/10 border-destructive/30',
  SKIPPED_NO_AI: 'text-muted-foreground bg-muted border-[var(--card-border)]',
  PENDING: 'text-primary bg-primary/10 border-primary/30',
  DEAD_LETTER: 'text-destructive bg-destructive/10 border-destructive/30',
};

const AGENT_ORDER = [
  'CEO',
  'PRODUCT',
  'MARKETING',
  'SEO',
  'ANALYTICS',
  'CUSTOMER_SUCCESS',
  'SUPPORT',
  'BILLING',
  'SECURITY',
  'DEVOPS',
] as const;

function extractApiError(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { error?: string; message?: string } } })
      .response?.data;
    return data?.error ?? data?.message;
  }
  return undefined;
}

export default function AdminAgentsPage() {
  const qc = useQueryClient();
  const [batchStartedAt, setBatchStartedAt] = React.useState<number | null>(null);
  const [runningAgent, setRunningAgent] = React.useState<string | null>(null);

  // batchStartedAt is auto-cleared by the effect below (on completion or timeout),
  // so its presence alone indicates an active batch. Avoids an impure Date.now() in render.
  const isBatchRunning = batchStartedAt != null;

  const dashQuery = useQuery({
    queryKey: ['admin', 'agents'],
    queryFn: () => agentsApi.getDashboard(),
    refetchInterval: isBatchRunning ? 3_000 : 15_000,
  });

  const activityQuery = useQuery({
    queryKey: ['admin', 'agents', 'activity'],
    queryFn: () => agentsApi.getActivity(),
    refetchInterval: isBatchRunning ? 3_000 : 10_000,
  });

  const data = dashQuery.data;
  const activity = activityQuery.data;

  const agentSummaries = data?.agentSummaries;
  const sortedSummaries = React.useMemo(() => {
    if (!agentSummaries) return [];
    const byType = new Map(agentSummaries.map((a) => [a.agentType, a]));
    return AGENT_ORDER.map(
      (type) =>
        byType.get(type) ?? {
          agentType: type,
          description: '',
          title: null,
          summary: null,
          updatedAt: null,
        },
    );
  }, [agentSummaries]);

  const reportsReady = sortedSummaries.filter((a) => a.summary?.trim()).length;
  const batchProgress = React.useMemo(() => {
    if (!batchStartedAt) return null;
    const updated = sortedSummaries.filter(
      (a) => a.updatedAt && new Date(a.updatedAt).getTime() >= batchStartedAt,
    ).length;
    return { updated, total: AGENT_ORDER.length };
  }, [batchStartedAt, sortedSummaries]);

  React.useEffect(() => {
    if (!batchStartedAt) return;
    if (batchProgress && batchProgress.updated >= batchProgress.total) {
      const t = setTimeout(() => setBatchStartedAt(null), 5_000);
      return () => clearTimeout(t);
    }
    const timeout = setTimeout(() => setBatchStartedAt(null), 90_000);
    return () => clearTimeout(timeout);
  }, [batchStartedAt, batchProgress]);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'agents'] });
    qc.invalidateQueries({ queryKey: ['admin', 'agents', 'activity'] });
  };

  const toggle = useMutation({
    mutationFn: ({ type, enable }: { type: string; enable: boolean }) =>
      enable ? agentsApi.enableAgent(type) : agentsApi.disableAgent(type),
    onSuccess: () => {
      invalidateAll();
      toast.success('Agent updated');
    },
    onError: () => toast.error('Failed to update agent'),
  });

  const runAll = useMutation({
    mutationFn: () => agentsApi.runAllLow(true),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message ?? 'Agents are disabled');
        return;
      }
      setBatchStartedAt(Date.now());
      invalidateAll();
      toast.success(result.message ?? `Queued ${result.queued?.length ?? 0} agents`);
    },
    onError: (err) => toast.error(extractApiError(err) ?? 'Failed to run agents'),
  });

  const runSingle = useMutation({
    mutationFn: (agentType: string) => agentsApi.runSingle(agentType),
    onSuccess: (result, agentType) => {
      setRunningAgent(null);
      if (!result.ok) {
        toast.error(result.message ?? 'Agent run failed');
        return;
      }
      setBatchStartedAt(Date.now());
      invalidateAll();
      toast.success(result.message ?? `${agentType} queued`);
    },
    onError: (err, agentType) => {
      setRunningAgent(null);
      toast.error(extractApiError(err) ?? `Failed to run ${agentType}`);
    },
  });

  const isRefreshing = dashQuery.isFetching || activityQuery.isFetching;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Bot className="h-7 w-7 text-primary" />
            AI Workforce
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Event-driven agents — low-usage mode (L1, max 80 tokens/call).
            {isBatchRunning ? ' Fast refresh while batch runs.' : ' Auto-refresh every 15s.'}
          </p>
          {data && (
            <p className="text-xs text-muted-foreground mt-1">
              {reportsReady}/{AGENT_ORDER.length} agent reports ready
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isRefreshing}
            onClick={() => invalidateAll()}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-card px-3 py-2 text-sm text-foreground/80 hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            disabled={runAll.isPending || isBatchRunning}
            onClick={() => runAll.mutate()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-foreground hover:bg-primary disabled:opacity-50"
          >
            {runAll.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {runAll.isPending ? 'Starting…' : 'Run all agents'}
          </button>
        </div>
      </div>

      {batchProgress && isBatchRunning && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-indigo-200 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating reports…
            </span>
            <span className="text-muted-foreground">
              {batchProgress.updated}/{batchProgress.total} updated
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(batchProgress.updated / batchProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {activity && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MiniStat
            icon={<Activity className="h-4 w-4" />}
            label="Queue pending"
            value={String(activity.pendingOutbox)}
            hint="Events waiting for poller"
            pulse={activity.pendingOutbox > 0}
          />
          <MiniStat
            icon={<Loader2 className={`h-4 w-4 ${activity.processing > 0 ? 'animate-spin' : ''}`} />}
            label="Processing now"
            value={String(activity.processing)}
            hint="Jobs currently running"
            pulse={activity.processing > 0}
          />
          <MiniStat
            icon={<Zap className="h-4 w-4" />}
            label="Workforce"
            value={activity.agentsEnabled ? 'Active' : 'Disabled'}
            hint={activity.agentsEnabled ? 'AGENTS_ENABLED=true' : 'Set AGENTS_ENABLED=true'}
            pulse={!activity.agentsEnabled}
          />
        </div>
      )}

      {activity && activity.recentJobs.length > 0 && (
        <div className="rounded-xl border border-[var(--card-border)] bg-card p-4">
          <h2 className="text-sm font-medium text-foreground/80 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Live activity
          </h2>
          <div className="space-y-2 max-h-[360px] overflow-y-auto">
            {activity.recentJobs.slice(0, 15).map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatCard label="Invocations (24h)" value={String(data.summary.invocations24h)} icon={<Zap className="h-4 w-4" />} />
            <StatCard label="AI cost (24h)" value={`$${data.summary.costUsd24h.toFixed(4)}`} icon={<DollarSign className="h-4 w-4" />} />
            <StatCard label="Gate skip rate" value={data.summary.gateSkipRate} icon={<Shield className="h-4 w-4" />} />
            <StatCard label="DLQ depth" value={String(data.summary.dlqDepth24h)} icon={<Bot className="h-4 w-4" />} />
          </div>

          <div className="rounded-xl border border-primary/20 bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-medium text-foreground/80">Detailed summaries by agent</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Structured reports — expand any card or run a single agent
                </p>
              </div>
              <span className="text-xs rounded-full bg-muted text-muted-foreground px-3 py-1">
                {reportsReady}/{AGENT_ORDER.length} ready
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {sortedSummaries.map((agent) => (
                <AgentSummaryCard
                  key={agent.agentType}
                  agent={agent}
                  isRunning={runningAgent === agent.agentType}
                  batchStartedAt={batchStartedAt}
                  onRun={() => {
                    setRunningAgent(agent.agentType);
                    runSingle.mutate(agent.agentType);
                  }}
                />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--card-border)] bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-left">
                <tr>
                  <th className="p-3">Agent</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">24h runs</th>
                  <th className="p-3">Tokens</th>
                  <th className="p-3">Cost</th>
                  <th className="p-3">Budget</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.agents
                  .slice()
                  .sort(
                    (a, b) =>
                      AGENT_ORDER.indexOf(a.agentType as (typeof AGENT_ORDER)[number]) -
                      AGENT_ORDER.indexOf(b.agentType as (typeof AGENT_ORDER)[number]),
                  )
                  .map((a) => {
                    const budgetPct =
                      a.tokenCap > 0 ? Math.min(100, (a.tokensUsedToday / a.tokenCap) * 100) : 0;
                    return (
                      <tr key={a.agentType} className="border-t border-[var(--card-border)]">
                        <td className="p-3 text-foreground font-medium">{a.agentType}</td>
                        <td className="p-3 text-muted-foreground text-xs max-w-[200px]">{a.description}</td>
                        <td className="p-3 text-muted-foreground">{a.invocations}</td>
                        <td className="p-3 text-muted-foreground">{a.tokens.toLocaleString()}</td>
                        <td className="p-3 text-muted-foreground">${a.costUsd.toFixed(4)}</td>
                        <td className="p-3">
                          <div className="text-muted-foreground text-xs mb-1">
                            {a.tokensUsedToday}/{a.tokenCap}
                          </div>
                          <div className="h-1 w-20 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${budgetPct >= 90 ? 'bg-destructive' : budgetPct >= 70 ? 'bg-chart-4' : 'bg-chart-3'}`}
                              style={{ width: `${budgetPct}%` }}
                            />
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={runningAgent === a.agentType}
                              onClick={() => {
                                setRunningAgent(a.agentType);
                                runSingle.mutate(a.agentType);
                              }}
                              className="rounded-full px-2.5 py-1 text-micro font-semibold bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-50"
                            >
                              Run
                            </button>
                            <button
                              type="button"
                              onClick={() => toggle.mutate({ type: a.agentType, enable: !a.enabled })}
                              className={`rounded-full px-2.5 py-1 text-micro font-semibold ${
                                a.enabled ? 'bg-chart-3/20 text-chart-3' : 'bg-destructive/20 text-rose-300'
                              }`}
                            >
                              {a.enabled ? 'On' : 'Off'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-[var(--card-border)] bg-card p-4">
            <h2 className="text-sm font-medium text-foreground/80 mb-3">Latest insight log</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.recentInsights.map((ins) => (
                <div key={ins.id} className="rounded-lg border border-[var(--card-border)] bg-muted/40 p-3">
                  <div className="flex items-center gap-2 text-xs text-primary mb-1">
                    {ins.agentType}
                    <span className="text-muted-foreground">{new Date(ins.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{ins.title}</p>
                  <SummaryText text={ins.summary} clamp />
                </div>
              ))}
              {data.recentInsights.length === 0 && (
                <p className="text-sm text-muted-foreground">No insights yet — click Run all agents to generate.</p>
              )}
            </div>
          </div>
        </>
      )}

      {(dashQuery.isLoading || activityQuery.isLoading) && !data && (
        <p className="text-muted-foreground text-sm flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading workforce…
        </p>
      )}
    </div>
  );
}

function AgentSummaryCard({
  agent,
  isRunning,
  batchStartedAt,
  onRun,
}: {
  agent: {
    agentType: string;
    description: string;
    title: string | null;
    summary: string | null;
    updatedAt: string | null;
  };
  isRunning: boolean;
  batchStartedAt: number | null;
  onRun: () => void;
}) {
  const [open, setOpen] = React.useState(Boolean(agent.summary));
  const hasReport = Boolean(agent.summary?.trim());
  const isFresh =
    batchStartedAt &&
    agent.updatedAt &&
    new Date(agent.updatedAt).getTime() >= batchStartedAt;

  return (
    <div
      className={`rounded-lg border bg-muted/40 overflow-hidden transition-colors ${
        isFresh ? 'border-primary/40 ring-1 ring-primary/20' : 'border-[var(--card-border)]'
      }`}
    >
      <div className="flex items-start gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex-1 flex items-start justify-between gap-3 text-left hover:opacity-90"
        >
          <div>
            <p className="text-sm font-semibold text-primary flex items-center gap-2 flex-wrap">
              {agent.agentType}
              {isRunning ? (
                <span className="text-micro font-normal rounded-full bg-chart-4/15 text-chart-4 px-2 py-0.5 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Running
                </span>
              ) : hasReport ? (
                <span className="text-micro font-normal rounded-full bg-chart-3/15 text-chart-3 px-2 py-0.5">
                  {isFresh ? 'Just updated' : 'Report ready'}
                </span>
              ) : (
                <span className="text-micro font-normal rounded-full bg-muted text-muted-foreground px-2 py-0.5">
                  Pending
                </span>
              )}
            </p>
            <p className="text-caption text-muted-foreground mt-0.5">{agent.description}</p>
            {agent.title && <p className="text-xs text-foreground mt-1">{agent.title}</p>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-micro text-muted-foreground">
              {agent.updatedAt ? new Date(agent.updatedAt).toLocaleString() : 'No report'}
            </span>
            {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>
        <button
          type="button"
          disabled={isRunning}
          onClick={onRun}
          title={`Run ${agent.agentType}`}
          className="shrink-0 rounded-md p-1.5 text-primary hover:bg-primary/10 disabled:opacity-50"
        >
          {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        </button>
      </div>
      {open && agent.summary && (
        <div className="px-4 pb-4 border-t border-[var(--card-border)] pt-3 max-h-80 overflow-y-auto">
          <SummaryText text={agent.summary} />
        </div>
      )}
      {open && !agent.summary && (
        <p className="px-4 pb-4 text-xs text-muted-foreground border-t border-[var(--card-border)] pt-3">
          Click the play button to generate a report for this agent.
        </p>
      )}
    </div>
  );
}

function SummaryText({ text, clamp }: { text: string; clamp?: boolean }) {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let inCode = false;
  const codeLines: string[] = [];

  const flushCode = () => {
    if (codeLines.length > 0) {
      nodes.push(
        <pre
          key={`code-${nodes.length}`}
          className="text-micro bg-card border border-[var(--card-border)] rounded-md p-2 overflow-x-auto text-muted-foreground my-1"
        >
          {codeLines.join('\n')}
        </pre>,
      );
      codeLines.length = 0;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('```')) {
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeLines.push(line);
      continue;
    }
    if (line.startsWith('## ')) {
      nodes.push(
        <p key={i} className="text-sm font-semibold text-foreground mt-2 first:mt-0">
          {line.replace(/^##\s*/, '')}
        </p>,
      );
      continue;
    }
    if (line.startsWith('### ')) {
      nodes.push(
        <p key={i} className="text-xs font-semibold text-foreground/80 mt-1.5">
          {line.replace(/^###\s*/, '')}
        </p>,
      );
      continue;
    }
    if (line.startsWith('- **')) {
      const m = line.match(/^- \*\*(.+?)\*\*:?\s*(.*)$/);
      nodes.push(
        <p key={i} className="pl-2 text-xs text-muted-foreground">
          {m ? (
            <>
              <span className="text-foreground/80">{m[1]}:</span> {m[2]}
            </>
          ) : (
            line.replace(/^-\s*/, '• ')
          )}
        </p>,
      );
      continue;
    }
    if (line.startsWith('- ')) {
      nodes.push(
        <p key={i} className="pl-2 text-xs text-muted-foreground">
          • {line.slice(2)}
        </p>,
      );
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      nodes.push(
        <p key={i} className="pl-2 text-xs text-muted-foreground">
          {line}
        </p>,
      );
      continue;
    }
    if (line.startsWith('> ')) {
      nodes.push(
        <p key={i} className="pl-3 border-l-2 border-primary/40 text-muted-foreground italic text-xs">
          {line.slice(2)}
        </p>,
      );
      continue;
    }
    if (line === '---') continue;
    if (!line.trim()) {
      nodes.push(<div key={i} className="h-1" />);
      continue;
    }
    nodes.push(
      <p key={i} className="text-xs text-muted-foreground">
        {line}
      </p>,
    );
  }
  flushCode();

  return (
    <div className={`space-y-0.5 ${clamp ? 'line-clamp-6' : ''}`}>{nodes}</div>
  );
}

function JobRow({ job }: { job: AgentActivityJob }) {
  const style = STATUS_STYLE[job.status] ?? STATUS_STYLE.PENDING;
  const Icon =
    job.status === 'COMPLETED'
      ? CheckCircle2
      : job.status === 'FAILED' || job.status === 'DEAD_LETTER'
        ? XCircle
        : job.status === 'PROCESSING'
          ? Loader2
          : Clock;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-[var(--card-border)] bg-muted/40 px-3 py-2.5">
      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${job.status === 'PROCESSING' ? 'animate-spin text-chart-4' : 'text-muted-foreground'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-primary">{job.agentType}</span>
          <span className={`text-micro font-medium px-2 py-0.5 rounded-full border ${style}`}>{job.status}</span>
          {job.gateSource && (
            <span className="text-micro text-muted-foreground">via {job.gateSource}</span>
          )}
        </div>
        <p className="text-sm text-foreground mt-0.5">{job.eventLabel}</p>
        <p className="text-caption text-muted-foreground mt-0.5">
          {new Date(job.createdAt).toLocaleString()}
          {job.tokens > 0 && ` · ${job.tokens} tokens · $${job.costUsd.toFixed(4)}`}
          {job.latencyMs != null && ` · ${job.latencyMs}ms`}
        </p>
        {job.errorMessage && (
          <p className="text-caption text-destructive mt-1 truncate">{job.errorMessage}</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
        {icon}
        {label}
      </div>
      <p className="text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  hint,
  pulse,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  pulse?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-card px-4 py-3 ${pulse ? 'border-primary/40' : 'border-[var(--card-border)]'}`}
    >
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        {icon}
        {label}
      </div>
      <p className="text-lg font-semibold text-foreground mt-1">{value}</p>
      <p className="text-micro text-muted-foreground mt-0.5">{hint}</p>
    </div>
  );
}
