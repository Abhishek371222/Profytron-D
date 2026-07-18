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
  onSuggestion,
  onFeedback,
  onEscalate,
  onRetry,
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
}: {
  messages: UiCoachMessage[];
  isTyping: boolean;
  streamingText?: string;
  inputValue: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onSuggestion: (label: string) => void;
  onFeedback?: (message: UiCoachMessage, value: 'up' | 'down') => void;
  onEscalate: () => void;
  onRetry?: () => void;
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

  const lastUserText = React.useMemo(() => {
    for (let i = visibleMessages.length - 1; i >= 0; i--) {
      if (visibleMessages[i].role === 'USER') return visibleMessages[i].content;
    }
    return lastFailedText || null;
  }, [visibleMessages, lastFailedText]);

  const lastAssistantId = React.useMemo(() => {
    for (let i = visibleMessages.length - 1; i >= 0; i--) {
      if (visibleMessages[i].role !== 'USER') return visibleMessages[i].id;
    }
    return null;
  }, [visibleMessages]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
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
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition',
                escalated
                  ? 'bg-[#348398]/12 text-[#348398]'
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

          {empty ? (
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
                        m.id === lastAssistantId && lastUserText && onRetry
                          ? onRetry
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
    >
      <CoachBrandMark size={48} pulse className="mb-5 rounded-2xl" />

      <h1 className="text-[1.75rem] font-semibold tracking-tight text-foreground sm:text-[2rem]">
        Where should we start?
      </h1>
      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">
        {hasBrokerAccount
          ? `Live book ready · ${Math.round(winRate ?? 0)}% WR · ${openTradeCount ?? 0} open`
          : 'Ask a trading question — or connect an account for live coaching.'}
      </p>

      {!hasBrokerAccount && (
        <a
          href="/connected-accounts"
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#348398] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d7284]"
        >
          <Link2 className="h-3.5 w-3.5" />
          Connect account
        </a>
      )}

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
            className="inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-card px-3.5 py-2 text-sm text-foreground/85 transition hover:border-[#348398]/40 hover:bg-muted"
          >
            <s.icon className="h-3.5 w-3.5 text-[#348398]" strokeWidth={1.75} />
            {s.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
