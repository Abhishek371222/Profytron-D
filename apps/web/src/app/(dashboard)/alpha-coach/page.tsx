'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  Activity,
  Send,
  History,
  Zap,
  Target,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import {
  DashboardPage,
  DashboardBreadcrumbs,
  DashButton,
} from '@/components/dashboard/DashboardPrimitives';
import { Magnetic } from '@/components/ui/Interactions';
import { aiApi, type CoachingReport } from '@/lib/api/ai';
import { useCoachContext } from '@/hooks/useCoachContext';
import { toast } from 'sonner';

type InsightCard = {
  id: string;
  type: 'good' | 'warning' | 'danger' | 'info';
  icon: typeof TrendingUp;
  title: string;
  body: string;
  stat: string;
  tip?: string;
  color: string;
  border: string;
  bg: string;
  iconBg: string;
  glow: string;
};

const INSIGHT_STYLES = {
  good: {
    color: 'text-chart-3',
    border: 'border-chart-3/20',
    bg: 'bg-chart-3/[0.04]',
    iconBg: 'bg-chart-3/10 border-chart-3/25',
    glow: 'rgba(52,211,153,0.15)',
  },
  warning: {
    color: 'text-chart-4',
    border: 'border-chart-4/20',
    bg: 'bg-chart-4/[0.04]',
    iconBg: 'bg-chart-4/10 border-chart-4/25',
    glow: 'rgba(251,191,36,0.12)',
  },
  danger: {
    color: 'text-destructive',
    border: 'border-destructive/20',
    bg: 'bg-destructive/[0.04]',
    iconBg: 'bg-destructive/10 border-destructive/25',
    glow: 'rgba(248,113,113,0.12)',
  },
  info: {
    color: 'text-chart-5',
    border: 'border-chart-5/20',
    bg: 'bg-chart-5/[0.04]',
    iconBg: 'bg-chart-5/10 border-chart-5/25',
    glow: 'rgba(34,211,238,0.12)',
  },
} as const;

const SUGGESTIONS = [
  { label: 'Analyze exposure', icon: Target },
  { label: 'Review drawdown', icon: TrendingUp },
  { label: 'Optimize stop-loss', icon: ShieldCheck },
  { label: 'Check correlation', icon: Activity },
  { label: 'Validate strategy', icon: Zap },
];

type ChatMessage = { id: string; role: 'ai' | 'user'; text: string };

const SCORE_BARS = [0.4, 0.7, 1, 0.6, 0.8, 0.3, 0.9];

function buildInsights(
  hasBrokerAccount: boolean,
  winRate: number,
  portfolio: { totalProfit?: number; maxDrawdown?: number; totalTrades?: number; sharpeRatio?: number } | null | undefined,
  report: CoachingReport | null,
): InsightCard[] {
  if (!hasBrokerAccount) {
    const style = INSIGHT_STYLES.info;
    return [{
      id: 'connect',
      type: 'info',
      icon: Activity,
      title: 'Connect Your Account',
      body: 'Link a broker or paper account to unlock coaching based on your real trade history and risk metrics.',
      stat: 'Setup',
      ...style,
    }];
  }

  const insights: InsightCard[] = [];
  const profit = portfolio?.totalProfit ?? 0;

  if (winRate >= 50) {
    insights.push({
      id: 'win-rate',
      type: 'good',
      icon: TrendingUp,
      title: 'Win Rate',
      body: `Your closed trades show a ${winRate.toFixed(1)}% win rate on your default account.`,
      stat: `${winRate.toFixed(1)}%`,
      ...INSIGHT_STYLES.good,
    });
  }

  if ((portfolio?.maxDrawdown ?? 0) > 8) {
    insights.push({
      id: 'drawdown',
      type: 'warning',
      icon: AlertTriangle,
      title: 'Drawdown Alert',
      body: `Peak-to-trough drawdown is ${(portfolio?.maxDrawdown ?? 0).toFixed(1)}%. Review position sizing and stop-loss rules.`,
      tip: 'Consider reducing risk per trade until drawdown recovers.',
      stat: `${(portfolio?.maxDrawdown ?? 0).toFixed(1)}% DD`,
      ...INSIGHT_STYLES.warning,
    });
  }

  if (profit !== 0) {
    insights.push({
      id: 'pnl',
      type: profit > 0 ? 'good' : 'danger',
      icon: profit > 0 ? TrendingUp : AlertCircle,
      title: profit > 0 ? 'Net Profit' : 'Net Loss',
      body: `Period P&L on your default account is ${profit >= 0 ? '+' : ''}$${Math.abs(profit).toLocaleString('en-US', { maximumFractionDigits: 0 })}.`,
      stat: profit >= 0 ? `+$${Math.abs(profit).toLocaleString()}` : `-$${Math.abs(profit).toLocaleString()}`,
      ...(profit > 0 ? INSIGHT_STYLES.good : INSIGHT_STYLES.danger),
    });
  }

  if (report?.winRate != null && insights.length < 3) {
    insights.push({
      id: 'report',
      type: 'info',
      icon: Activity,
      title: 'Coaching Snapshot',
      body: 'Coaching metrics loaded from your latest closed-trade sample.',
      stat: `${report.winRate}% WR`,
      ...INSIGHT_STYLES.info,
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: 'empty',
      type: 'info',
      icon: Activity,
      title: 'Building History',
      body: 'Your account is connected. Insights will appear as you close more trades.',
      stat: `${portfolio?.totalTrades ?? 0} trades`,
      ...INSIGHT_STYLES.info,
    });
  }

  return insights.slice(0, 3);
}

export default function AlphaCoachPage() {
  const router = useRouter();
  const { portfolio, winRate, openTrades, hasBrokerAccount } = useCoachContext();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [report, setReport] = React.useState<CoachingReport | null>(null);
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);
  const hasMountedRef = React.useRef(false);

  React.useEffect(() => {
    if (!hasMountedRef.current) {
      // Skip the very first render (welcome message) — don't scroll the page on load.
      hasMountedRef.current = true;
      return;
    }
    // Scroll only the chat container itself, never the page/window.
    const container = messagesContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, isTyping]);

  React.useEffect(() => {
    aiApi.getCoachingReport().then(setReport).catch(() => {
      toast.error("Can't load report right now");
    });
  }, []);

  const insights = React.useMemo(
    () => buildInsights(hasBrokerAccount, winRate, portfolio, report),
    [hasBrokerAccount, winRate, portfolio, report],
  );

  React.useEffect(() => {
    const profit = portfolio?.totalProfit ?? 0;
    const text = hasBrokerAccount
      ? `Your default account shows ${winRate.toFixed(1)}% win rate with ${profit >= 0 ? '+' : ''}$${Math.abs(profit).toLocaleString('en-US', { maximumFractionDigits: 0 })} period P&L. ${openTrades.length} open position(s). What would you like to review?`
      : 'Connect a broker or paper account to get coaching based on your real trading data.';
    setMessages([{ id: 'welcome', role: 'ai', text }]);
  }, [hasBrokerAccount, portfolio?.totalProfit, winRate, openTrades.length]);

  const handleSend = React.useCallback(async (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { id: `${Date.now()}`, role: 'user', text }]);
    setInputValue('');
    setIsTyping(true);
    try {
      const response = await aiApi.chat(text);
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now() + 1}`, role: 'ai', text: response?.reply || 'No response from Alpha Coach.' },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now() + 1}`, role: 'ai', text: 'Alpha Coach is temporarily unavailable. Please retry.' },
      ]);
      toast.error('Alpha Coach unavailable');
    } finally {
      setIsTyping(false);
    }
  }, []);

  return (
    <DashboardPage className="!gap-4">
      <DashboardBreadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Alpha Coach' }]} />

    <div className="flex h-[calc(100dvh-260px)] gap-4 overflow-hidden min-h-[420px]">
      {/* ── LEFT PANEL ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="hidden xl:flex w-[320px] shrink-0 flex-col gap-3 overflow-hidden min-h-0"
      >
        {/* Header card */}
        <div className="relative rounded-2xl border border-[var(--card-border)] bg-card p-5 overflow-hidden">
          {/* Top hairline */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-chart-5/40 to-transparent" />
          {/* Ambient glow */}
          <div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full bg-chart-5/[0.08] blur-2xl" />

          <div className="relative flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-chart-5" />
            <span className="text-xs font-semibold text-muted-foreground">Alpha Signals</span>
          </div>

          <div className="relative flex items-center gap-3 mb-3">
            <div className="relative w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground tracking-tight">Alpha Coach</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Edge · Risk · Performance</p>
            </div>
          </div>

          {report && (
            <div className="flex items-center gap-4 pt-3 border-t border-[var(--card-border)]">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">Win Rate</span>
                <span className="text-base font-bold text-chart-3 mt-0.5">{report.winRate}%</span>
              </div>
              <div className="w-px h-8 bg-muted/6" />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">Avg PnL</span>
                <span className="text-base font-bold text-chart-5 mt-0.5">{report.avgPnl}</span>
              </div>
            </div>
          )}
        </div>

        {/* Insights — natural height, no artificial stretch */}
        <div className="space-y-2">
          {insights.map((insight, idx) => {
            const Icon = insight.icon;
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + idx * 0.09, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className={cn(
                  'group relative rounded-[16px] border p-4 cursor-default overflow-hidden transition-all duration-300',
                  insight.border, insight.bg,
                  'hover:brightness-110',
                )}
              >
                {/* Hover glow */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[16px]"
                  style={{ boxShadow: `inset 0 0 40px ${insight.glow}` }}
                />
                {/* Top hairline */}
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(90deg, transparent, ${insight.glow.replace('0.12', '0.6')}, transparent)` }}
                />

                <div className="relative flex gap-3">
                  <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center shrink-0', insight.iconBg)}>
                    <Icon className={cn('w-4 h-4', insight.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className={cn('text-sm font-semibold', insight.color)}>
                        {insight.title}
                      </p>
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-md shrink-0', insight.bg, insight.color)}>
                        {insight.stat}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{insight.body}</p>
                    {insight.tip && (
                      <div className="mt-2 flex items-start gap-1.5 rounded-xl border border-chart-4/15 bg-chart-4/5 px-2.5 py-2">
                        <Sparkles className="w-3.5 h-3.5 text-chart-4 shrink-0 mt-0.5" />
                        <p className="text-xs text-chart-4 leading-relaxed">{insight.tip}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Score card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="relative rounded-2xl border border-[var(--card-border)] bg-card p-5 overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Alpha Score</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">78<span className="text-sm text-muted-foreground font-normal"> / 100</span></p>
            </div>
            <div className="relative w-14 h-14">
              <svg className="w-full h-full -rotate-90">
                <circle cx="28" cy="28" r="24" stroke="rgba(255,255,255,0.05)" strokeWidth="3.5" fill="none" />
                <motion.circle
                  cx="28" cy="28" r="24"
                  stroke="url(#scoreGrad)"
                  strokeWidth="3.5"
                  strokeDasharray="150.8"
                  initial={{ strokeDashoffset: 150.8 }}
                  animate={{ strokeDashoffset: 150.8 * (1 - 0.78) }}
                  transition={{ duration: 2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  fill="none"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" />
                    <stop offset="100%" stopColor="var(--chart-5)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-body-sm font-bold text-foreground">78</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-chart-3" />
            <span className="text-sm text-chart-3 font-semibold">Good zone</span>
          </div>

          <div className="flex items-end gap-1">
            {SCORE_BARS.map((s, i) => (
              <div key={i} className="flex-1 h-8 bg-muted/4 rounded-full relative overflow-hidden">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${s * 100}%` }}
                  transition={{ delay: 0.9 + i * 0.07, duration: 0.7, ease: 'easeOut' }}
                  className="absolute bottom-0 w-full rounded-full"
                  style={{ background: `linear-gradient(to top, #2D7284, rgba(52,131,152,${s.toFixed(2)}))` }}
                />
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* ── RIGHT PANEL: Chat ── */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--card-border)] bg-card shadow-sm"
      >
        {/* Chat header */}
        <div className="relative flex items-center justify-between border-b border-[var(--card-border)] bg-card px-5 py-4 shrink-0">
          {/* Top hairline */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          {/* Ambient */}
          <div className="pointer-events-none absolute -top-8 left-12 w-32 h-16 rounded-full bg-primary/[0.08] blur-2xl" />

          <div className="relative flex items-center gap-4">
            <div className="relative">
              <div className="w-11 h-11 rounded-[14px] bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-chart-3 border-2 border-card"
                style={{ boxShadow: '0 0 8px rgba(52,211,153,0.7)' }}
              />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-tight">Alpha Coach</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-chart-5"
                />
                <span className="text-xs text-chart-5 font-semibold">Alpha Engine · Live</span>
              </div>
            </div>
          </div>

          <div className="relative flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs text-muted-foreground">Engine</span>
              <span className="text-sm font-semibold text-foreground font-mono">Profytron v2.4</span>
            </div>
            <button
              onClick={() => router.push('/history')}
              className="w-9 h-9 rounded-xl bg-muted border border-[var(--card-border)] hover:border-border hover:bg-muted/6 text-foreground/35 hover:text-foreground transition-all flex items-center justify-center"
            >
              <History className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-5 py-5 no-scrollbar">
          {messages.length <= 1 && !isTyping ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-col items-center justify-start gap-4 pt-1 text-center max-w-md mx-auto"
            >
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-chart-2/15 border border-primary/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-chart-3 border-2 border-card"
                  style={{ boxShadow: '0 0 8px rgba(52,211,153,0.7)' }}
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Ask Alpha Coach anything</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {messages[0]?.text}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {SUGGESTIONS.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15 + i * 0.06 }}
                      onClick={() => handleSend(s.label)}
                      className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-[var(--card-border)] bg-card px-3.5 py-2.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/30 hover:text-primary hover:bg-primary/[0.05]"
                    >
                      <Icon className="w-3 h-3" />
                      {s.label}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
          <div className="space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                className={cn('flex items-start gap-3 max-w-[90%]', msg.role === 'user' && 'ml-auto flex-row-reverse')}
              >
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/15 to-chart-2/15 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}

                <div
                  className={cn(
                    'rounded-[18px] px-4 py-3 text-body-sm leading-relaxed font-medium',
                    msg.role === 'ai'
                      ? 'rounded-tl-md bg-muted/4 border border-[var(--card-border)] text-foreground/80'
                      : 'rounded-tr-md bg-gradient-to-br from-primary/25 to-chart-2/20 border border-primary/25 text-foreground',
                  )}
                  style={msg.role === 'user' ? { boxShadow: '0 4px 20px color-mix(in srgb, var(--primary) 15%, transparent)' } : undefined}
                >
                  {msg.text.split('\n').map((line, i) => {
                    const parts = line.split(/(\$\d+(?:,\d+)*(?:\.\d+)?|\d+(?:\.\d+)?%?)/g);
                    return (
                      <p key={i} className={i > 0 ? 'mt-2' : ''}>
                        {parts.map((part, j) =>
                          part.match(/(\$\d+(?:,\d+)*(?:\.\d+)?|\d+(?:\.\d+)?%?)/) ? (
                            <span
                              key={j}
                              className={cn(
                                'font-mono font-bold mx-0.5 px-1.5 py-0.5 rounded-lg text-caption',
                                msg.role === 'ai' ? 'text-chart-5 bg-chart-5/[0.08]' : 'text-foreground bg-foreground/15',
                              )}
                            >
                              {part}
                            </span>
                          ) : (
                            part
                          ),
                        )}
                      </p>
                    );
                  })}
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-3 max-w-[60%]"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/15 to-chart-2/15 border border-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex items-center gap-1.5 rounded-[18px] rounded-tl-md px-4 py-3 bg-muted/4 border border-[var(--card-border)]">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.18 }}
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-[var(--card-border)] bg-muted/30 p-4 shrink-0">
          {/* Quick suggestions — hidden once the centered empty-state already shows them */}
          {messages.length > 1 && (
          <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-0.5">
            {SUGGESTIONS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.06 }}
                  onClick={() => handleSend(s.label)}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-[var(--card-border)] bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:border-primary/30 hover:text-primary hover:bg-primary/[0.05] shrink-0"
                >
                  <Icon className="w-2.5 h-2.5" />
                  {s.label}
                </motion.button>
              );
            })}
          </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-3 rounded-[14px] border border-[var(--card-border)] bg-muted/25 px-4 py-3 focus-within:border-primary/35 focus-within:bg-primary/[0.025] focus-within:shadow-[0_0_24px_color-mix(in_srgb,var(--primary)_10%,transparent)] transition-all duration-200">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend(inputValue)}
              placeholder="Ask Alpha Coach about your trading..."
              className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none"
            />
            <span className="text-micro text-foreground/15 font-mono hidden md:block">{inputValue.length}/500</span>
            <Magnetic strength={0.2}>
              <motion.button
                onClick={() => handleSend(inputValue)}
                disabled={!inputValue.trim()}
                whileHover={inputValue.trim() ? { scale: 1.05 } : {}}
                whileTap={inputValue.trim() ? { scale: 0.92 } : {}}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-chart-2 disabled:opacity-20 flex items-center justify-center transition-opacity"
                style={{ boxShadow: inputValue.trim() ? '0 0 20px color-mix(in srgb, var(--primary) 50%, transparent)' : 'none' }}
              >
                <Send className="w-3.5 h-3.5 text-foreground" />
              </motion.button>
            </Magnetic>
          </div>

          <p className="text-center mt-2 text-xs text-muted-foreground">
            Encrypted · Alpha Engine v1.0 · Institutional-grade
          </p>
        </div>
      </motion.div>
    </div>
    </DashboardPage>
  );
}

