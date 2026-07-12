'use client';

import React from 'react';
import {
  DashboardPage,
} from '@/components/dashboard/DashboardPrimitives';
import { ChatHistorySidebar } from '@/components/alpha-coach/ChatHistorySidebar';
import { CoachChatPanel } from '@/components/alpha-coach/CoachChatPanel';
import { LiveTradesRail } from '@/components/alpha-coach/LiveTradesRail';
import {
  coachApi,
  type CoachConversationSummary,
  type CoachMessage,
} from '@/lib/api/coach';
import { useCoachContext } from '@/hooks/useCoachContext';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import {
  acquireCoachSocket,
  joinCoachConversation,
  onCoachEvent,
} from '@/lib/realtime/coach-socket';
import { acquireTradingSocket, onTradingEvent } from '@/lib/realtime/trading-socket';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { aiApi, type CoachingReport } from '@/lib/api/ai';

type FeedItem = { id: string; text: string; tone?: 'info' | 'good' | 'warn' };

function computeAlphaScore(
  winRate: number,
  openCount: number,
  maxDrawdown: number,
): number {
  let score = 55;
  score += Math.min(25, winRate * 0.25);
  score -= Math.min(20, maxDrawdown * 1.2);
  score -= Math.min(10, Math.max(0, openCount - 3) * 2);
  return Math.max(20, Math.min(95, Math.round(score)));
}

export default function AlphaCoachPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const {
    portfolio,
    winRate,
    openTrades,
    hasBrokerAccount,
  } = useCoachContext();

  const [conversations, setConversations] = React.useState<
    CoachConversationSummary[]
  >([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<CoachMessage[]>([]);
  const [inputValue, setInputValue] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [streamingText, setStreamingText] = React.useState('');
  const [listLoading, setListLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [escalating, setEscalating] = React.useState(false);
  const [escalated, setEscalated] = React.useState(false);
  const [escalationStatus, setEscalationStatus] =
    React.useState<import('@/lib/api/coach').CoachEscalationStatus | null>(null);
  const [slaDeadline, setSlaDeadline] = React.useState<string | null>(null);
  const [escalationCreatedAt, setEscalationCreatedAt] = React.useState<
    string | null
  >(null);
  const [claimedBy, setClaimedBy] = React.useState<{
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  } | null>(null);
  const [creatingChat, setCreatingChat] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [deskOpen, setDeskOpen] = React.useState(false);
  const [report, setReport] = React.useState<CoachingReport | null>(null);
  const [feed, setFeed] = React.useState<FeedItem[]>([]);
  const [errorText, setErrorText] = React.useState<string | null>(null);
  const [lastFailedText, setLastFailedText] = React.useState<string | null>(null);
  const activeIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const refreshList = React.useCallback(async () => {
    try {
      const list = await coachApi.listConversations();
      setConversations(list);
      return list;
    } catch {
      toast.error("Can't load chat history");
      return [] as CoachConversationSummary[];
    }
  }, []);

  const loadConversation = React.useCallback(async (id: string) => {
    try {
      const detail = await coachApi.getConversation(id);
      setActiveId(id);
      setMessages(detail.messages || []);
      const openEsc = detail.escalations?.find(
        (e) => e.status === 'OPEN' || e.status === 'CLAIMED',
      );
      setEscalated(Boolean(openEsc) || detail.status === 'ESCALATED');
      setEscalationStatus(openEsc?.status ?? null);
      setSlaDeadline(openEsc?.slaDeadline ?? null);
      setEscalationCreatedAt(openEsc?.createdAt ?? null);
      setClaimedBy(openEsc?.claimedBy ?? null);
      joinCoachConversation(id);
    } catch {
      toast.error("Can't open conversation");
    }
  }, []);

  const ensureConversation = React.useCallback(async () => {
    if (activeIdRef.current) return activeIdRef.current;
    const created = await coachApi.createConversation();
    await refreshList();
    await loadConversation(created.id);
    return created.id;
  }, [loadConversation, refreshList]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setListLoading(true);
      const list = await refreshList();
      if (cancelled) return;
      setListLoading(false);
      if (list.length > 0) {
        await loadConversation(list[0].id);
      } else {
        try {
          const created = await coachApi.createConversation();
          await refreshList();
          await loadConversation(created.id);
        } catch {
          toast.error("Can't start Alpha Coach session");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadConversation, refreshList]);

  React.useEffect(() => {
    aiApi
      .getCoachingReport()
      .then(setReport)
      .catch(() => {
        /* non-blocking */
      });
  }, []);

  React.useEffect(() => {
    const items: FeedItem[] = [
      {
        id: 'live',
        text: 'Alpha Engine live — Gemini + knowledge bank ready.',
        tone: 'info',
      },
    ];
    if (!hasBrokerAccount) {
      items.push({
        id: 'broker',
        text: 'No broker linked yet. Connect an account for live book coaching.',
        tone: 'warn',
      });
    } else {
      items.push({
        id: 'wr',
        text: `Win rate ${winRate.toFixed(1)}% · ${openTrades.length} open position(s).`,
        tone: winRate >= 50 ? 'good' : 'info',
      });
    }
    if ((portfolio?.maxDrawdown ?? 0) > 8) {
      items.push({
        id: 'dd',
        text: `Drawdown ${(portfolio?.maxDrawdown ?? 0).toFixed(1)}% — review sizing before adding risk.`,
        tone: 'warn',
      });
    }
    if (report?.suggestions?.[0]) {
      items.push({
        id: 'tip',
        text: report.suggestions[0],
        tone: 'info',
      });
    }
    setFeed(items);
  }, [hasBrokerAccount, winRate, openTrades.length, portfolio?.maxDrawdown, report]);

  // Coach websocket
  React.useEffect(() => {
    if (!accessToken) return;
    const release = acquireCoachSocket(accessToken);

    const offMessage = onCoachEvent('message', (payload) => {
      const data = payload as {
        conversationId?: string;
        message?: CoachMessage;
      };
      if (!data?.message || !data.conversationId) return;
      if (data.conversationId !== activeIdRef.current) {
        void refreshList();
        return;
      }
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message!.id)) return prev;
        return [...prev, data.message!];
      });
      void refreshList();
    });

    const offTyping = onCoachEvent('typing', (payload) => {
      const data = payload as {
        conversationId?: string;
        userId?: string;
        isTyping?: boolean;
      };
      if (data.conversationId !== activeIdRef.current) return;
      if (data.userId === 'assistant') setIsTyping(Boolean(data.isTyping));
    });

    const offEscalation = onCoachEvent('escalation:new', (payload) => {
      const data = payload as {
        conversationId?: string;
        status?: import('@/lib/api/coach').CoachEscalationStatus;
        slaDeadline?: string | null;
        createdAt?: string;
      };
      if (data.conversationId === activeIdRef.current) {
        setEscalated(true);
        setEscalationStatus(data.status || 'OPEN');
        setSlaDeadline(data.slaDeadline ?? null);
        setEscalationCreatedAt(data.createdAt ?? new Date().toISOString());
        setClaimedBy(null);
      }
      void refreshList();
    });

    const offClaimed = onCoachEvent('escalation:claimed', (payload) => {
      const data = payload as {
        conversationId?: string;
        status?: import('@/lib/api/coach').CoachEscalationStatus;
        claimedBy?: {
          id: string;
          fullName: string;
          avatarUrl?: string | null;
        } | null;
      };
      if (data.conversationId !== activeIdRef.current) return;
      setEscalated(true);
      setEscalationStatus(data.status || 'CLAIMED');
      setClaimedBy(data.claimedBy ?? null);
      toast.success(
        data.claimedBy?.fullName
          ? `${data.claimedBy.fullName} joined your chat`
          : 'Executive joined your chat',
      );
    });

    const offResolved = onCoachEvent('escalation:resolved', (payload) => {
      const data = payload as { conversationId?: string };
      if (data.conversationId === activeIdRef.current) {
        setEscalated(false);
        setEscalationStatus(null);
        setClaimedBy(null);
        setSlaDeadline(null);
      }
      void refreshList();
    });

    return () => {
      offMessage();
      offTyping();
      offEscalation();
      offClaimed();
      offResolved();
      release();
    };
  }, [accessToken, refreshList]);

  // Trading socket → refresh open trades + feed
  React.useEffect(() => {
    if (!accessToken) return;
    const release = acquireTradingSocket(accessToken);
    const bump = (label: string) => {
      queryClient.invalidateQueries({ queryKey: ['open-trades'] });
      setFeed((prev) => [
        {
          id: `${Date.now()}`,
          text: label,
          tone: 'info',
        },
        ...prev.slice(0, 8),
      ]);
    };
    const offs = [
      onTradingEvent('trade_opened', () => bump('New trade opened — positions updated.')),
      onTradingEvent('trade_closed', () => bump('Trade closed — P&L refreshed.')),
      onTradingEvent('trade_modified', () => bump('Trade modified.')),
    ];
    return () => {
      offs.forEach((off) => off());
      release();
    };
  }, [accessToken, queryClient]);

  const handleNew = async () => {
    if (creatingChat) return;
    setCreatingChat(true);
    try {
      const created = await coachApi.createConversation();
      await refreshList();
      await loadConversation(created.id);
      toast.success('New coach session started');
    } catch (err: unknown) {
      const ax = err as { message?: string };
      toast.error(ax?.message || "Can't create chat");
    } finally {
      setCreatingChat(false);
    }
  };

  const handleDeleteChat = async (id: string) => {
    if (deletingId) return;
    const ok = window.confirm('Delete this chat? This can’t be undone.');
    if (!ok) return;
    setDeletingId(id);
    try {
      await coachApi.deleteConversation(id);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);

      if (activeIdRef.current === id) {
        setActiveId(null);
        setMessages([]);
        setEscalated(false);
        setEscalationStatus(null);
        setClaimedBy(null);
        setSlaDeadline(null);
        setEscalationCreatedAt(null);
        if (remaining.length > 0) {
          await loadConversation(remaining[0].id);
        } else {
          const created = await coachApi.createConversation();
          await refreshList();
          await loadConversation(created.id);
        }
      } else {
        await refreshList();
      }
      toast.success('Chat deleted');
    } catch {
      toast.error("Can't delete chat");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSend = async (override?: string) => {
    const text = (override ?? inputValue).trim();
    if (!text || sending) return;
    setSending(true);
    setInputValue('');
    setErrorText(null);
    setLastFailedText(null);
    setStreamingText('');
    let optimisticId: string | null = null;
    try {
      const id = await ensureConversation();
      if (!id) throw new Error('No active conversation');
      const optimistic: CoachMessage = {
        id: `tmp-${Date.now()}`,
        conversationId: id,
        role: 'USER',
        content: text,
        source: 'SYSTEM',
        createdAt: new Date().toISOString(),
      };
      optimisticId = optimistic.id;
      setMessages((prev) => [...prev, optimistic]);
      setIsTyping(true);

      let streamBuf = '';
      await coachApi.sendMessageStream(id, text, (event) => {
        if (event.type === 'user' && event.message) {
          setMessages((prev) => {
            const withoutTmp = prev.filter((m) => m.id !== optimisticId);
            if (withoutTmp.some((m) => m.id === event.message!.id)) return withoutTmp;
            return [...withoutTmp, event.message!];
          });
        } else if (event.type === 'token' && event.text) {
          setIsTyping(false);
          streamBuf += event.text;
          setStreamingText(streamBuf);
        } else if (event.type === 'faq' && event.message) {
          setIsTyping(false);
          setStreamingText('');
          setMessages((prev) => {
            const withoutTmp = prev.filter((m) => m.id !== optimisticId);
            if (withoutTmp.some((m) => m.id === event.message!.id)) return withoutTmp;
            return [...withoutTmp, event.message!];
          });
        } else if (event.type === 'done' && event.message) {
          setIsTyping(false);
          setStreamingText('');
          setMessages((prev) => {
            const withoutTmp = prev.filter((m) => m.id !== optimisticId);
            const next = [...withoutTmp];
            if (!next.some((m) => m.id === event.message!.id)) {
              next.push(event.message!);
            }
            return next;
          });
        } else if (event.type === 'error') {
          setErrorText(event.text || 'AI stream error');
          setLastFailedText(text);
        }
      });

      await refreshList();
    } catch (err: unknown) {
      if (optimisticId) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      }
      setStreamingText('');
      setLastFailedText(text);
      const ax = err as {
        response?: { data?: { error?: string; message?: string } };
        code?: string;
        message?: string;
      };
      const apiMsg =
        ax?.response?.data?.error ||
        ax?.response?.data?.message ||
        (ax?.code === 'ECONNABORTED' ? 'Request timed out — try again' : null) ||
        ax?.message ||
        'Gemini unavailable — try again';
      setErrorText(apiMsg);
      toast.error(`Can't send message — ${apiMsg}`);
    } finally {
      setIsTyping(false);
      setSending(false);
    }
  };

  const handleEscalate = async () => {
    if (!activeId || escalating || escalated) return;
    setEscalating(true);
    try {
      const esc = await coachApi.escalate(activeId);
      setEscalated(true);
      setEscalationStatus(esc.status || 'OPEN');
      setSlaDeadline(esc.slaDeadline ?? null);
      setEscalationCreatedAt(esc.createdAt ?? new Date().toISOString());
      setClaimedBy(esc.claimedBy ?? null);
      toast.success('Request sent — an executive usually joins within 15 minutes');
      await refreshList();
      await loadConversation(activeId);
    } catch {
      toast.error("Can't escalate right now");
    } finally {
      setEscalating(false);
    }
  };

  const periodPnl = portfolio?.totalProfit ?? 0;
  const alphaScore = computeAlphaScore(
    winRate,
    openTrades.length,
    portfolio?.maxDrawdown ?? 0,
  );

  return (
    <DashboardPage className="!gap-0 !pb-0 !pt-0 flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--card-border)] bg-card shadow-sm">
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_272px]">
          {/* Desktop history */}
          <div className="hidden min-h-0 overflow-hidden border-r border-[var(--card-border)] lg:block">
            <ChatHistorySidebar
              conversations={conversations}
              activeId={activeId}
              onSelect={(id) => void loadConversation(id)}
              onNew={() => void handleNew()}
              onDelete={(id) => void handleDeleteChat(id)}
              loading={listLoading}
              creating={creatingChat}
              deletingId={deletingId}
            />
          </div>

          <div className="min-h-0 min-w-0 overflow-hidden bg-background">
            <CoachChatPanel
              messages={messages}
              isTyping={isTyping}
              streamingText={streamingText}
              inputValue={inputValue}
              onInputChange={setInputValue}
              onSend={() => void handleSend()}
              onSuggestion={(label) => void handleSend(label)}
              onEscalate={() => void handleEscalate()}
              onNewChat={() => void handleNew()}
              onOpenHistory={() => setHistoryOpen(true)}
              onOpenDesk={() => setDeskOpen(true)}
              creatingChat={creatingChat}
              onRetry={() => lastFailedText && void handleSend(lastFailedText)}
              lastFailedText={lastFailedText}
              escalating={escalating}
              canEscalate={Boolean(activeId)}
              escalated={escalated}
              escalationStatus={escalationStatus}
              slaDeadline={slaDeadline}
              escalationCreatedAt={escalationCreatedAt}
              claimedBy={claimedBy}
              disabled={sending}
              errorText={errorText}
              hasBrokerAccount={hasBrokerAccount}
              winRate={winRate}
              openTradeCount={openTrades.length}
            />
          </div>

          {/* Desktop live desk */}
          <div className="hidden min-h-0 overflow-hidden border-l border-[var(--card-border)] xl:block">
            <LiveTradesRail
              openTrades={openTrades as any[]}
              winRate={winRate}
              periodPnl={periodPnl}
              alphaScore={alphaScore}
              feed={feed}
              hasBrokerAccount={hasBrokerAccount}
            />
          </div>
        </div>

        {historyOpen && (
          <div className="absolute inset-0 z-50 flex lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
              aria-label="Dismiss history"
              onClick={() => setHistoryOpen(false)}
            />
            <div className="relative z-10 h-full w-[min(100%,18.5rem)] max-w-[85vw] bg-card shadow-xl">
              <ChatHistorySidebar
                conversations={conversations}
                activeId={activeId}
                onSelect={(id) => {
                  void loadConversation(id);
                  setHistoryOpen(false);
                }}
                onNew={() => {
                  void handleNew();
                  setHistoryOpen(false);
                }}
                onDelete={(id) => void handleDeleteChat(id)}
                loading={listLoading}
                creating={creatingChat}
                deletingId={deletingId}
                onClose={() => setHistoryOpen(false)}
              />
            </div>
          </div>
        )}

        {deskOpen && (
          <div className="absolute inset-0 z-50 flex justify-end xl:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
              aria-label="Dismiss live desk"
              onClick={() => setDeskOpen(false)}
            />
            <div className="relative z-10 h-full w-[min(100%,20rem)] max-w-[85vw] border-l border-[var(--card-border)] bg-card shadow-xl">
              <LiveTradesRail
                openTrades={openTrades as any[]}
                winRate={winRate}
                periodPnl={periodPnl}
                alphaScore={alphaScore}
                feed={feed}
                hasBrokerAccount={hasBrokerAccount}
                onClose={() => setDeskOpen(false)}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardPage>
  );
}
