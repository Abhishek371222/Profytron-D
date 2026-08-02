'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  Headset,
  Menu,
  PanelRight,
  Target,
  ShieldCheck,
  TrendingUp,
  Activity,
  Zap,
  Link2,
} from 'lucide-react';
import type { CoachEscalationStatus } from '@/lib/api/coach';
import { MVP_FOLLOW_UPS } from '@profytron/ai-coach';
import { COACH_EVENTS, trackCoachEvent } from '@/lib/analytics/track-coach';
import { ExecutiveWaitBar } from '@/components/alpha-coach/ExecutiveWaitBar';
import { CoachComposer } from '@/components/alpha-coach/CoachComposer';
import {
  CoachErrorBanner,
  CoachMessageRow,
  CoachTypingRow,
  type UiCoachMessage,
} from '@/components/alpha-coach/CoachMessageRow';
import {
  CoachBrandMark,
  CoachWordmark,
} from '@/components/alpha-coach/CoachBrandMark';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const SUGGESTIONS = MVP_FOLLOW_UPS.map((label) => ({
  label,
  icon:
    /drawdown/i.test(label)
      ? TrendingUp
      : /trade/i.test(label)
        ? Activity
        : /strategy/i.test(label)
          ? Zap
          : /week/i.test(label)
            ? ShieldCheck
            : Target,
}));

export function CoachChatPanel({
  messages,
  isTyping,
  streamingText,
  inputValue,
  onInputChange,
  onSend,
  onStop,
  isGenerating,
  onSuggestion,
  onFeedback,
  onEscalate,
  onRetry,
  onRegenerateMessage,
  onNewChat,
  onOpenHistory,
  onOpenDesk,
  creatingChat,
  lastFailedText,
  escalating,
  canEscalate,
  escalated,
  escalationStatus,
  slaDeadline,
  escalationCreatedAt,
  claimedBy,
  disabled,
  errorText,
  hasBrokerAccount,
  winRate,
  openTradeCount,
  bootstrapLoading,
}: {
  messages: UiCoachMessage[];
  isTyping: boolean;
  streamingText?: string;
  inputValue: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onStop?: () => void;
  isGenerating?: boolean;
  onSuggestion: (label: string) => void;
  onFeedback?: (message: UiCoachMessage, value: 'up' | 'down') => void;
  onEscalate: () => void;
  onRetry?: () => void;
  onRegenerateMessage?: (userText: string) => void;
  onNewChat?: () => void;
  onOpenHistory?: () => void;
  onOpenDesk?: () => void;
  creatingChat?: boolean;
  lastFailedText?: string | null;
  escalating?: boolean;
  canEscalate: boolean;
  escalated: boolean;
  escalationStatus?: CoachEscalationStatus | null;
  slaDeadline?: string | null;
  escalationCreatedAt?: string | null;
  claimedBy?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  } | null;
  disabled?: boolean;
  errorText?: string | null;
  hasBrokerAccount?: boolean;
  winRate?: number;
  openTradeCount?: number;
  /** True while conversation list is bootstrapping */
  bootstrapLoading?: boolean;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const hasUserMsgs = messages.some((m) => m.role === 'USER');
  const showWait =
    escalated &&
    (escalationStatus === 'OPEN' || escalationStatus === 'CLAIMED');
  const empty = !hasUserMsgs && !streamingText && !isTyping;

  const visibleMessages = React.useMemo(() => {
    const hideEscalationSystem = (content: string) =>
      /executive requested|admin has been notified|typical response window|chat with executive/i.test(
        content,
      );

    return messages.filter((m, i) => {
      if (i === 0 && m.role === 'SYSTEM' && hasUserMsgs) return false;
      if (m.role === 'SYSTEM' && hideEscalationSystem(m.content)) return false;
      return true;
    });
  }, [messages, hasUserMsgs]);

  const precedingUserTextById = React.useMemo(() => {
    const map = new Map<string, string>();
    let lastUser: string | null = null;
    for (const m of visibleMessages) {
      if (m.role === 'USER') {
        lastUser = m.content;
      } else if (lastUser) {
        map.set(m.id, lastUser);
      }
    }
    return map;
  }, [visibleMessages]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const shouldStick = distanceFromBottom < 160;
    if (!shouldStick) return;
    el.scrollTo({ top: el.scrollHeight, behavior: streamingText ? 'auto' : 'smooth' });
  }, [messages, isTyping, streamingText]);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-background">
      <header className="relative z-[1] flex shrink-0 items-center justify-between gap-2 border-b border-[var(--card-border)] px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-1">
          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground lg:hidden"
              aria-label="Open chats"
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </button>
          )}
          <button
            type="button"
            onClick={onNewChat}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-muted"
          >
            <CoachBrandMark size={26} pulse={isTyping || Boolean(streamingText)} />
            <CoachWordmark className="text-sm sm:text-[15px]" />
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
        <div className="flex items-center gap-0.5">
          {onOpenDesk && (
            <button
              type="button"
              onClick={onOpenDesk}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground xl:hidden"
              aria-label="Live desk"
            >
              <PanelRight className="h-4 w-4" />
            </button>
          )}
          {canEscalate && (
            <motion.button
              type="button"
              onClick={onEscalate}
              disabled={escalating || escalated}
              whileTap={{ scale: 0.97 }}
              aria-label={
                escalated
                  ? escalationStatus === 'CLAIMED'
                    ? 'Live desk — executive connected'
                    : 'Waiting for executive'
                  : 'Chat with executive'
              }
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                escalated
                  ? 'bg-primary/12 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Headset className="h-4 w-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">
                {escalated
                  ? escalationStatus === 'CLAIMED'
                    ? 'Live'
                    : 'Waiting'
                  : 'Executive'}
              </span>
            </motion.button>
          )}
        </div>
      </header>

      <AnimatePresence>
        {showWait && escalationStatus && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            className="relative z-[1] overflow-hidden px-3 sm:px-4"
          >
            <div className="mx-auto max-w-3xl pb-2">
              <ExecutiveWaitBar
                status={escalationStatus}
                slaDeadline={slaDeadline}
                createdAt={escalationCreatedAt}
                claimedBy={claimedBy}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Coach conversation"
        className="relative z-[1] min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div
          className={cn(
            'mx-auto flex w-full max-w-3xl flex-col gap-7 px-4 py-5 sm:px-6 sm:py-7',
            empty && 'h-full min-h-full',
          )}
        >
          {/* ERROR_GUIDE — keep Retry visible after failed first send (empty conversation) */}
          {errorText && (
            <CoachErrorBanner
              text={errorText}
              onRetry={onRetry && lastFailedText ? onRetry : undefined}
            />
          )}

          {bootstrapLoading ? (
            <div className="flex h-full min-h-[240px] flex-col gap-3" aria-busy="true">
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted/60" />
              <div className="h-16 animate-pulse rounded-xl bg-muted/50" />
              <div className="h-16 animate-pulse rounded-xl bg-muted/40" />
              <div className="h-16 animate-pulse rounded-xl bg-muted/30" />
            </div>
          ) : empty ? (
            <EmptyState
              hasBrokerAccount={Boolean(hasBrokerAccount)}
              onSuggestion={onSuggestion}
              winRate={winRate}
              openTradeCount={openTradeCount}
            />
          ) : (
            <>
              <AnimatePresence initial={false}>
                {visibleMessages.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.28,
                      delay: Math.min(i * 0.02, 0.12),
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <CoachMessageRow
                      message={m}
                      onRegenerate={
                        onRegenerateMessage && precedingUserTextById.has(m.id)
                          ? () => onRegenerateMessage(precedingUserTextById.get(m.id)!)
                          : undefined
                      }
                      onFeedback={
                        onFeedback
                          ? (value) => onFeedback(m, value)
                          : undefined
                      }
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {streamingText && (
                <CoachMessageRow
                  isStreaming
                  message={{
                    id: 'stream',
                    conversationId: '',
                    role: 'ASSISTANT',
                    source: 'AI',
                    content: streamingText,
                    createdAt: new Date().toISOString(),
                  }}
                />
              )}

              {isTyping && !streamingText && <CoachTypingRow />}
            </>
          )}
        </div>
      </div>

      <CoachComposer
        value={inputValue}
        onChange={onInputChange}
        onSend={onSend}
        onStop={onStop}
        isGenerating={isGenerating}
        disabled={disabled}
        placeholder="Ask Alpha Coach anything…"
      />
    </div>
  );
}

function EmptyState({
  hasBrokerAccount,
  onSuggestion,
  winRate,
  openTradeCount,
}: {
  hasBrokerAccount: boolean;
  onSuggestion: (label: string) => void;
  winRate?: number;
  openTradeCount?: number;
}) {
  React.useEffect(() => {
    trackCoachEvent(COACH_EVENTS.SUGGESTION_IMPRESSION, {
      metadata: {
        labels: SUGGESTIONS.map((s) => s.label).join('|'),
        count: SUGGESTIONS.length,
      },
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex min-h-full flex-1 flex-col items-center justify-center py-10 text-center"
      role="status"
    >
      <CoachBrandMark size={48} pulse className="mb-5 rounded-2xl" />

      <h1 className="text-[1.75rem] font-semibold tracking-tight text-foreground sm:text-[2rem]">
        {hasBrokerAccount ? 'Where should we start?' : 'Start your first coaching session'}
      </h1>
      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">
        {hasBrokerAccount
          ? `Live book ready · ${Math.round(winRate ?? 0)}% WR · ${openTradeCount ?? 0} open — ask about a trade, week, or drawdown.`
          : 'Ask anything about risk, sessions, or strategy. Connect a broker for live book coaching on your open positions.'}
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {!hasBrokerAccount && (
          <Link
            href="/connected-accounts"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Link2 className="h-3.5 w-3.5" />
            Connect broker
          </Link>
        )}
        <Link
          href="/help#help-alpha-coach"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--card-border)] bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Coach help
        </Link>
        {hasBrokerAccount && (
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--card-border)] bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Browse marketplace
          </Link>
        )}
      </div>

      <div className="mt-10 flex w-full max-w-xl flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s.label}
            type="button"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.04 }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSuggestion(s.label)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-card px-3.5 py-2 text-sm text-foreground/85 transition hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <s.icon className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
            {s.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
