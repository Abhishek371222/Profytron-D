'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, type NotificationItem } from '@/lib/api/notifications';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Bell,
  BellOff,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

const TYPE_CONFIG: Record<
  string,
  {
    color: string;
    iconBg: string;
    border: string;
    hoverBorder: string;
    glow: string;
    icon: React.ComponentType<{ className?: string }>;
    dot: string;
  }
> = {
  INFO: {
    color: 'text-blue-400',
    iconBg: 'bg-blue-400/10',
    border: 'border-blue-400/15',
    hoverBorder: 'hover:border-blue-400/35',
    glow: 'hover:shadow-[0_0_20px_rgba(96,165,250,0.08)]',
    icon: Info,
    dot: 'bg-blue-400',
  },
  WARNING: {
    color: 'text-amber-400',
    iconBg: 'bg-amber-400/10',
    border: 'border-amber-400/15',
    hoverBorder: 'hover:border-amber-400/35',
    glow: 'hover:shadow-[0_0_20px_rgba(251,191,36,0.08)]',
    icon: AlertTriangle,
    dot: 'bg-amber-400',
  },
  SUCCESS: {
    color: 'text-emerald-400',
    iconBg: 'bg-emerald-400/10',
    border: 'border-emerald-400/15',
    hoverBorder: 'hover:border-emerald-400/35',
    glow: 'hover:shadow-[0_0_20px_rgba(52,211,153,0.08)]',
    icon: CheckCircle,
    dot: 'bg-emerald-400',
  },
  ERROR: {
    color: 'text-rose-400',
    iconBg: 'bg-rose-400/10',
    border: 'border-rose-400/15',
    hoverBorder: 'hover:border-rose-400/35',
    glow: 'hover:shadow-[0_0_20px_rgba(251,113,133,0.08)]',
    icon: XCircle,
    dot: 'bg-rose-400',
  },
};

function NotificationCard({
  notification,
  onMarkRead,
  idx,
}: {
  notification: NotificationItem;
  onMarkRead: () => void;
  idx: number;
}) {
  const cfg = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.INFO;
  const IconComp = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.97 }}
      transition={{ delay: idx * 0.04 }}
      className={cn(
        'group relative flex items-start gap-4 p-4 rounded-[22px] border transition-all duration-300',
        notification.isRead
          ? 'bg-white/[0.01] border-white/[0.05] opacity-55 hover:opacity-100'
          : cn('bg-white/[0.025]', cfg.border, cfg.hoverBorder, cfg.glow),
      )}
    >
      {/* Unread left accent */}
      {!notification.isRead && (
        <div className={cn('absolute left-0 top-4 bottom-4 w-0.5 rounded-full', cfg.dot)} />
      )}

      {/* Icon */}
      <div
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105',
          cfg.iconBg,
        )}
      >
        <IconComp className={cn('w-4 h-4', cfg.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm font-bold leading-snug', notification.isRead ? 'text-white/50' : 'text-white')}>
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0 shadow-sm', cfg.dot)} />
          )}
        </div>

        <p className={cn('text-xs leading-relaxed', notification.isRead ? 'text-white/25' : 'text-white/45')}>
          {notification.body}
        </p>

        <div className="flex items-center gap-4 pt-1">
          <span className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-mono">
            {timeAgo(notification.createdAt)}
          </span>
          {notification.actionUrl && (
            <a
              href={notification.actionUrl}
              className={cn('text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:underline transition-colors', cfg.color)}
            >
              View <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
          {!notification.isRead && (
            <button
              onClick={onMarkRead}
              className="text-[10px] text-white/25 uppercase tracking-widest hover:text-white/60 transition-colors font-bold"
            >
              Mark read
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [unreadOnly, setUnreadOnly] = React.useState(false);
  const [page, setPage] = React.useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', { page, unreadOnly }],
    queryFn: () => notificationsApi.list({ page, limit: 20, unreadOnly }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
    onError: () => toast.error('Failed to mark as read'),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      toast.success(`Marked ${result?.updated ?? 'all'} notifications as read`);
    },
    onError: () => toast.error('Failed to mark all as read'),
  });

  const notifications = data?.items ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const hasMore = data?.hasMore ?? false;

  return (
    <div className="space-y-6 pb-10">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-0 right-1/4 h-72 w-64 rounded-full bg-indigo-500/6 blur-[100px]" />

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[28px] border border-indigo-500/15 bg-gradient-to-br from-indigo-500/[0.04] to-transparent p-6 md:p-8"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/35 to-transparent" />
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-indigo-400/70">
                Alerts & Updates
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Notifications</h1>
            <p className="text-sm text-white/40">Trade alerts · System messages · Events</p>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
                className="flex items-center gap-2 h-10 px-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-[11px] font-bold uppercase tracking-[0.2em] text-white/45 hover:text-white hover:border-white/20 disabled:opacity-40 transition-all duration-300"
              >
                {markAllMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                Mark all read
              </button>
            )}
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-indigo-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 min-w-[18px] rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center px-1 shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setUnreadOnly(false); setPage(1); }}
          className={cn(
            'h-9 px-4 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300',
            !unreadOnly
              ? 'bg-white/[0.08] text-white border border-white/[0.12]'
              : 'bg-white/[0.02] text-white/30 border border-white/[0.05] hover:text-white/50',
          )}
        >
          All
        </button>
        <button
          onClick={() => { setUnreadOnly(true); setPage(1); }}
          className={cn(
            'h-9 px-4 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300',
            unreadOnly
              ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
              : 'bg-white/[0.02] text-white/30 border border-white/[0.05] hover:text-white/50',
          )}
        >
          Unread {data?.unreadCount ? `(${data.unreadCount})` : ''}
        </button>
      </div>

      {/* ── Notification List ── */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[88px] rounded-[22px] bg-white/[0.025] animate-pulse border border-white/[0.04]" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-24 text-center space-y-5"
        >
          <div className="w-16 h-16 rounded-[22px] bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto">
            <BellOff className="w-7 h-7 text-white/10" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-bold text-white/20 uppercase tracking-widest">
              {unreadOnly ? 'All caught up' : 'No notifications yet'}
            </p>
            <p className="text-xs text-white/15 max-w-xs mx-auto">
              {unreadOnly
                ? 'You have no unread notifications right now.'
                : 'Trade alerts, system messages, and updates will appear here.'}
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {notifications.map((notification, i) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkRead={() => markReadMutation.mutate(notification.id)}
                idx={i}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Pagination ── */}
      {(hasMore || page > 1) && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="h-10 px-5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/35 text-[11px] font-bold uppercase tracking-widest hover:bg-white/[0.06] hover:text-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>
          <span className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-mono">Page {page}</span>
          <button
            disabled={!hasMore}
            onClick={() => setPage((p) => p + 1)}
            className="h-10 px-5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/35 text-[11px] font-bold uppercase tracking-widest hover:bg-white/[0.06] hover:text-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
