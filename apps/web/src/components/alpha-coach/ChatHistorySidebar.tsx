'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Search,
  MessageSquarePlus,
  Headset,
  X,
  Trash2,
} from 'lucide-react';
import type { CoachConversationSummary } from '@/lib/api/coach';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function ChatHistorySidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  loading,
  creating,
  deletingId,
  onClose,
  className,
}: {
  conversations: CoachConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete?: (id: string) => void;
  loading?: boolean;
  creating?: boolean;
  deletingId?: string | null;
  onClose?: () => void;
  className?: string;
}) {
  const [query, setQuery] = React.useState('');
  const [searchOpen, setSearchOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages?.[0]?.content?.toLowerCase().includes(q),
    );
  }, [conversations, query]);

  return (
    <aside
      className={cn(
        'flex h-full min-h-0 w-full flex-col bg-muted/40',
        className,
      )}
    >
      <div className="flex shrink-0 flex-col gap-1 p-2.5 pt-3">
        <div className="mb-1 flex items-center justify-between px-1 lg:hidden">
          <span className="text-sm font-semibold text-foreground">Chats</span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <motion.button
          type="button"
          onClick={onNew}
          disabled={creating}
          whileTap={{ scale: 0.98 }}
          className="flex h-10 w-full items-center gap-2.5 rounded-xl bg-[#348398] px-3 text-sm font-semibold text-white transition hover:bg-[#2d7284] disabled:opacity-50"
        >
          <MessageSquarePlus className="h-4 w-4" strokeWidth={2} />
          {creating ? 'Creating…' : 'New chat'}
        </motion.button>

        <button
          type="button"
          onClick={() => setSearchOpen((v) => !v)}
          className="flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Search className="h-4 w-4" strokeWidth={1.75} />
          Search chats
        </button>

        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="mt-1 h-9 w-full rounded-xl border border-[var(--card-border)] bg-card px-3 text-sm outline-none focus:border-[#348398]/40"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3">
        <p className="px-2.5 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Recents
        </p>
        {loading && (
          <div className="space-y-1 px-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-9 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <p className="px-2.5 py-6 text-xs text-muted-foreground">
            {query ? 'No matches' : 'No chats yet'}
          </p>
        )}
        <ul className="space-y-0.5">
          {filtered.map((c) => {
            const active = c.id === activeId;
            const escalated =
              c.status === 'ESCALATED' || (c.escalations?.length ?? 0) > 0;
            const deleting = deletingId === c.id;
            return (
              <li key={c.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  disabled={deleting}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-xl py-2 pl-2.5 pr-9 text-left text-sm transition',
                    active
                      ? 'bg-card font-medium text-foreground shadow-sm ring-1 ring-[var(--card-border)]'
                      : 'text-foreground/80 hover:bg-muted',
                    deleting && 'opacity-50',
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-[#348398]" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{c.title}</span>
                  {escalated && (
                    <Headset className="h-3 w-3 shrink-0 text-[#973336]" />
                  )}
                  <span className="shrink-0 text-[10px] text-muted-foreground group-hover:opacity-0">
                    {timeAgo(c.updatedAt)}
                  </span>
                </button>
                {onDelete && (
                  <button
                    type="button"
                    title="Delete chat"
                    aria-label="Delete chat"
                    disabled={deleting}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(c.id);
                    }}
                    className={cn(
                      'absolute right-1 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition',
                      'opacity-100 sm:opacity-0 sm:group-hover:opacity-100',
                      'hover:bg-[#973336]/10 hover:text-[#973336]',
                      deleting && 'opacity-100',
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
