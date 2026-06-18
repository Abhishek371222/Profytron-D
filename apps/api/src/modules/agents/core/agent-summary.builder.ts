import { AgentType } from '@prisma/client';
import { AGENT_EVENTS, EVENT_LABELS } from '../agent.types';
import type { GateResult } from '../agent.types';
import type { AgentJobPayload } from '../agent.types';

function fmtInr(n: unknown): string {
  const v = Number(n ?? 0);
  return `INR ${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function fmtPct(n: unknown): string {
  const s = String(n ?? '0');
  return s.includes('%') ? s : `${s}%`;
}

export function buildCeoSummary(metrics: Record<string, unknown>): string {
  const mrr = metrics.mrr ?? 0;
  const arr = metrics.arr ?? Number(mrr) * 12;
  return [
    `## CEO Daily Brief`,
    ``,
    `### Revenue`,
    `- **MRR:** ${fmtInr(mrr)}`,
    `- **ARR:** ${fmtInr(arr)}`,
    `- **Paying users:** ${metrics.payingUsers ?? 0}`,
    `- **ARPU:** ${fmtInr(metrics.arpu ?? 0)}`,
    ``,
    `### Users & activation`,
    `- **Total users:** ${metrics.totalUsers ?? 0}`,
    `- **New (30d):** ${metrics.newUsers30d ?? 0}`,
    `- **Activation rate:** ${fmtPct(metrics.activationRate)}`,
    `- **Activated users:** ${metrics.activatedUsers ?? 0}`,
    ``,
    `### Deposits (30d)`,
    `- **Volume:** ${fmtInr(metrics.deposits30d)}`,
    `- **Count:** ${metrics.depositCount30d ?? 0}`,
    ``,
    `### Priority actions`,
    `1. Review activation funnel if rate is below 25%`,
    `2. Follow up on users who deposited but did not connect a broker`,
    `3. Monitor MRR trend vs prior week`,
  ].join('\n');
}

export function buildProductSummary(data: Record<string, unknown>): string {
  const raw = data.funnel;
  const rows = Array.isArray(raw) ? raw : [];
  const lines = rows.length
    ? rows.map(
        (r: { event?: string; _count?: { event?: number } }) =>
          `- **${r.event ?? 'unknown'}:** ${r._count?.event ?? 0} events`,
      )
    : ['- No activation events recorded yet'];

  return [
    `## Product Activation Report`,
    ``,
    `### Funnel breakdown`,
    ...lines,
    ``,
    `### Recommendations`,
    `1. Reduce friction on broker-connect step (highest drop-off)`,
    `2. Add in-app checklist on dashboard for first-time users`,
    `3. A/B test onboarding copy for Risk DNA completion`,
  ].join('\n');
}

export function buildMarketingSummary(
  metrics: Record<string, unknown> | null,
): string {
  const m = metrics ?? {};
  return [
    `## Marketing Daily Plan`,
    ``,
    `### Current metrics`,
    `- **MRR:** ${fmtInr(m.mrr)}`,
    `- **New users today:** ${m.newUsers ?? 0}`,
    `- **Activation rate:** ${fmtPct(m.activationRate)}`,
    `- **Open support tickets:** ${m.supportTickets ?? 0}`,
    ``,
    `### Campaign ideas (India market)`,
    `1. **Broker connect push** — retarget signups without MT5 linked`,
    `2. **Paper trading demo** — YouTube/Instagram short showing copy-trading`,
    `3. **Referral boost** — highlight wallet bonus for first deposit`,
    `4. **Pricing page SEO** — target "algo trading India" keywords`,
  ].join('\n');
}

export function buildSeoSummary(): string {
  return [
    `## SEO Weekly Plan`,
    ``,
    `### Content`,
    `- Publish broker landing pages: IC Markets, Pepperstone, Exness, XM, FXTM`,
    `- Add FAQ schema on /pricing and /help pages`,
    ``,
    `### Internal links`,
    `- Link homepage hero → marketplace → strategy detail pages`,
    `- Cross-link blog/help articles to signup CTA`,
    ``,
    `### Target keywords`,
    `- copy trading India`,
    `- MT5 automated trading`,
    `- algo trading platform India`,
    `- XAUUSD bot India`,
    ``,
    `### Technical`,
    `- Verify sitemap.xml and robots.txt indexed`,
    `- Check Core Web Vitals on landing page`,
  ].join('\n');
}

export function buildAnalyticsSummary(
  snapshot: Record<string, unknown>,
): string {
  const delta = snapshot.revenueDeltaPct as number | undefined;
  return [
    `## Analytics Snapshot`,
    ``,
    `### Revenue`,
    `- **MRR:** ${fmtInr(snapshot.mrr)}`,
    `- **ARR:** ${fmtInr(snapshot.arr)}`,
    delta != null
      ? `- **Day-over-day MRR change:** ${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`
      : `- **Day-over-day MRR change:** stable`,
    ``,
    `### Users`,
    `- **New users (period):** ${snapshot.newUsers ?? 0}`,
    `- **Activation rate:** ${fmtPct(snapshot.activationRate)}`,
    ``,
    `### Operations`,
    `- **Deposits (INR):** ${fmtInr(snapshot.depositsInr)}`,
    `- **Open support tickets:** ${snapshot.supportTickets ?? 0}`,
    ``,
    `### Alerts`,
    delta != null && Math.abs(delta) >= 5
      ? `! Revenue moved ${delta.toFixed(1)}% — CEO agent notified`
      : `OK — No significant revenue anomaly detected`,
  ].join('\n');
}

export function buildSecuritySummary(
  job: AgentJobPayload,
  gate: GateResult,
): string {
  const label = EVENT_LABELS[job.eventType] ?? job.eventType;
  const data = gate.data ?? job.payload ?? {};
  return [
    `## Security Event Report`,
    ``,
    `### Event`,
    `- **Type:** ${label}`,
    `- **Entity:** ${job.entityType} / ${job.entityId}`,
    `- **Action taken:** ${gate.action ?? 'logged'}`,
    ``,
    `### Details`,
    '```',
    JSON.stringify(data, null, 2).slice(0, 600),
    '```',
    ``,
    `### Recommended follow-up`,
    job.eventType === AGENT_EVENTS.API_RATE_LIMIT_EXCEEDED
      ? `- Monitor IP ${job.entityId} for repeated abuse\n- Consider temporary block if >10 hits/hour`
      : `- Review account activity\n- Enable 2FA if not already active`,
  ].join('\n');
}

export function buildBillingSummary(
  job: AgentJobPayload,
  gate: GateResult,
): string {
  const label = EVENT_LABELS[job.eventType] ?? job.eventType;
  const amount = job.payload?.amount;
  const amountLine = amount != null ? `- **Amount:** ${fmtInr(amount)}` : null;
  return [
    `## Billing Event Report`,
    ``,
    `### Event`,
    `- **Type:** ${label}`,
    `- **Reference:** ${job.entityId}`,
    amountLine,
    `- **User ID:** ${job.userId ?? 'n/a'}`,
    ``,
    `### Action`,
    `- **Rule:** ${gate.action ?? 'none'}`,
    gate.action === 'send_dunning'
      ? `- Dunning email queued — user prompted to update payment method`
      : gate.action === 'winback_email_scheduled'
        ? `- Win-back sequence scheduled (3-day delay)`
        : `- Logged for finance review`,
    ``,
    `### Next steps`,
    `1. Verify Razorpay webhook delivery`,
    `2. Check wallet balance if payment was for subscription`,
    `3. Retry payment after 24h if transient failure`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildCsSummary(input: {
  userName: string;
  tier: string;
  email: string;
  job: AgentJobPayload;
  gate: GateResult;
  emailBody?: string;
}): string {
  const label = EVENT_LABELS[input.job.eventType] ?? input.job.eventType;
  return [
    `## Customer Success Action`,
    ``,
    `### User`,
    `- **Name:** ${input.userName}`,
    `- **Email:** ${input.email}`,
    `- **Tier:** ${input.tier}`,
    ``,
    `### Trigger`,
    `- **Event:** ${label}`,
    `- **Action:** ${input.gate.action ?? 'retention touchpoint'}`,
    ``,
    input.emailBody
      ? `### Outreach sent\n> ${input.emailBody}`
      : `### Outreach\n- In-app notification created`,
    ``,
    `### Playbook`,
    input.job.eventType === AGENT_EVENTS.USER_INACTIVE_7D
      ? `- Day 7: re-engagement email\n- Day 14: offer paper-trading walkthrough\n- Day 21: personal outreach`
      : `- Guide user to complete Risk DNA onboarding\n- Highlight marketplace free strategies`,
  ].join('\n');
}

export function buildSupportSummary(input: {
  subject: string;
  payload: Record<string, unknown>;
  reply: string;
  source: 'kb' | 'ai' | 'template';
  kbSlug?: string;
}): string {
  return [
    `## Support Ticket Summary`,
    ``,
    `### Ticket`,
    `- **Subject:** ${input.subject || 'General inquiry'}`,
    `- **Category:** ${input.payload.category ?? 'general'}`,
    `- **Reply source:** ${input.source}${input.kbSlug ? ` (${input.kbSlug})` : ''}`,
    ``,
    `### Draft reply`,
    input.reply,
    ``,
    `### Agent notes`,
    `- Verify user tier before suggesting paid features`,
    `- Escalate to human if broker connection issue persists`,
  ].join('\n');
}

export function buildDevopsSummary(
  job: AgentJobPayload,
  gate: GateResult,
  aiText?: string | null,
): string {
  const label = EVENT_LABELS[job.eventType] ?? job.eventType;
  const base = [
    `## DevOps Incident Report`,
    ``,
    `### Incident`,
    `- **Type:** ${label}`,
    `- **Entity:** ${job.entityId}`,
    gate.action ? `- **Rule action:** ${gate.action}` : null,
    ``,
    `### Payload`,
    '```',
    JSON.stringify(job.payload ?? {}, null, 2).slice(0, 400),
    '```',
  ].filter(Boolean) as string[];

  if (aiText) {
    base.push('', `### AI analysis`, aiText);
  } else {
    base.push(
      '',
      `### Checklist`,
      `1. Check API error logs (last 15 min)`,
      `2. Verify Redis and Postgres connectivity`,
      `3. Review Sentry for spike in 5xx responses`,
      `4. Confirm BullMQ workers are consuming queues`,
    );
  }
  return base.join('\n');
}

export function appendAiEnhancement(
  baseSummary: string,
  aiText: string | null | undefined,
  agentType: AgentType,
): string {
  if (!aiText?.trim()) return baseSummary;
  return `${baseSummary}\n\n---\n\n### AI enhancement (${agentType})\n${aiText.trim()}`;
}
