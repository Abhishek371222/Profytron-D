'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  coachApi,
  type CoachEscalation,
  type CoachMessage,
} from '@/lib/api/coach';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import {
  acquireCoachSocket,
  joinCoachConversation,
  onCoachEvent,
} from '@/lib/realtime/coach-socket';
import { toast } from 'sonner';
import { Headset, CheckCircle2, UserRound, Send } from 'lucide-react';

export default function AdminCoachPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [escalations, setEscalations] = React.useState<CoachEscalation[]>([]);
  const [active, setActive] = React.useState<CoachEscalation | null>(null);
  const [messages, setMessages] = React.useState<CoachMessage[]>([]);
  const [reply, setReply] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const activeRef = React.useRef<CoachEscalation | null>(null);

  React.useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const refresh = React.useCallback(async () => {
    try {
      const list = await coachApi.listEscalations();
      setEscalations(list);
      return list;
    } catch {
      toast.error("Can't load escalations");
      return [] as CoachEscalation[];
    }
  }, []);

  const openEscalation = React.useCallback(async (esc: CoachEscalation) => {
    setActive(esc);
    try {
      const detail = await coachApi.getConversationAdmin(esc.conversationId);
      setMessages(detail.messages || []);
      joinCoachConversation(esc.conversationId);
    } catch {
      toast.error("Can't load conversation");
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const list = await refresh();
      if (!cancelled && list[0]) await openEscalation(list[0]);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [openEscalation, refresh]);

  React.useEffect(() => {
    if (!accessToken) return;
    const release = acquireCoachSocket(accessToken);

    const offNew = onCoachEvent('escalation:new', (payload) => {
      const esc = payload as CoachEscalation;
      toast.message('New Alpha Coach escalation', {
        description: esc.user?.fullName || esc.user?.email || esc.conversationId,
      });
      void refresh();
    });

    const offMsg = onCoachEvent('message', (payload) => {
      const data = payload as {
        conversationId?: string;
        message?: CoachMessage;
      };
      if (!data.message || !data.conversationId) return;
      if (data.conversationId !== activeRef.current?.conversationId) {
        void refresh();
        return;
      }
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message!.id)) return prev;
        return [...prev, data.message!];
      });
    });

    const offResolved = onCoachEvent('escalation:resolved', () => {
      void refresh();
    });

    return () => {
      offNew();
      offMsg();
      offResolved();
      release();
    };
  }, [accessToken, refresh]);

  const handleClaim = async () => {
    if (!active) return;
    try {
      const updated = await coachApi.claimEscalation(active.id);
      setActive({ ...active, ...updated });
      toast.success('Claimed');
      await refresh();
    } catch {
      toast.error("Can't claim");
    }
  };

  const handleReply = async () => {
    if (!active || !reply.trim() || sending) return;
    setSending(true);
    try {
      const msg = await coachApi.replyEscalation(active.id, reply.trim());
      setReply('');
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      );
      await refresh();
    } catch {
      toast.error("Can't send reply");
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    if (!active) return;
    try {
      await coachApi.resolveEscalation(active.id);
      toast.success('Resolved');
      setActive(null);
      setMessages([]);
      const list = await refresh();
      if (list[0]) await openEscalation(list[0]);
    } catch {
      toast.error("Can't resolve");
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-7rem)] max-w-6xl flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
          <Headset className="h-5 w-5 text-primary" />
          Alpha Coach inbox
        </h1>
        <p className="text-sm text-muted-foreground">
          Real-time executive replies for users who escalate from Alpha Coach.
        </p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-xl border border-[var(--card-border)] bg-card md:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="min-h-0 overflow-y-auto border-r border-[var(--card-border)]">
          <div className="border-b border-[var(--card-border)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Open / claimed ({escalations.length})
          </div>
          {loading && (
            <p className="p-4 text-center text-xs text-muted-foreground">Loading…</p>
          )}
          {!loading && escalations.length === 0 && (
            <p className="p-6 text-center text-xs text-muted-foreground">
              No active escalations. You will get a live ping when a user requests an executive.
            </p>
          )}
          <ul className="p-2 space-y-1">
            {escalations.map((esc) => {
              const selected = active?.id === esc.id;
              return (
                <li key={esc.id}>
                  <button
                    type="button"
                    onClick={() => void openEscalation(esc)}
                    className={cn(
                      'w-full rounded-lg px-2.5 py-2.5 text-left',
                      selected
                        ? 'border border-primary/25 bg-primary/10'
                        : 'border border-transparent hover:bg-muted/60',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {esc.user?.fullName || esc.user?.email || 'User'}
                      </span>
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                          esc.status === 'OPEN' && 'bg-amber-500/15 text-amber-700',
                          esc.status === 'CLAIMED' && 'bg-primary/15 text-primary',
                        )}
                      >
                        {esc.status}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                      {esc.conversation?.title || esc.conversationId}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="flex min-h-0 flex-col">
          {!active ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Select an escalation to reply
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--card-border)] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {active.conversation?.title || 'Conversation'}
                  </p>
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <UserRound className="h-3 w-3" />
                    {active.user?.email}
                  </p>
                </div>
                <div className="flex gap-2">
                  {active.status === 'OPEN' && (
                    <button
                      type="button"
                      onClick={() => void handleClaim()}
                      className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                    >
                      Claim
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleResolve()}
                    className="inline-flex items-center gap-1 rounded-lg border border-chart-3/25 bg-chart-3/10 px-3 py-1.5 text-xs font-medium text-chart-3"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Resolve
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
                {messages.map((m) => {
                  const isExec = m.role === 'EXECUTIVE';
                  const isUser = m.role === 'USER';
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        'max-w-[90%] rounded-xl px-3 py-2 text-sm',
                        isUser && 'ml-auto bg-primary text-primary-foreground',
                        isExec && 'border border-amber-500/25 bg-amber-500/10',
                        !isUser &&
                          !isExec &&
                          'border border-[var(--card-border)] bg-muted/40 text-muted-foreground',
                      )}
                    >
                      <p className="mb-0.5 text-[10px] font-semibold uppercase opacity-70">
                        {m.role}
                        {m.source !== 'SYSTEM' ? ` · ${m.source}` : ''}
                      </p>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  );
                })}
              </div>

              <form
                className="flex gap-2 border-t border-[var(--card-border)] p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleReply();
                }}
              >
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Reply as executive…"
                  className="h-11 min-w-0 flex-1 rounded-xl border border-[var(--card-border)] bg-background px-3 text-sm outline-none focus:border-primary/40"
                />
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40"
                  aria-label="Send reply"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
