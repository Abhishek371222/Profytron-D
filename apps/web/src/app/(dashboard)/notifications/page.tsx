'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, type NotificationItem } from '@/lib/api/notifications';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Bell, BellOff, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle,
  Loader2, ChevronRight, ExternalLink, Filter,
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

const TYPE_CONFIG: Record<string, { color: string; icon: React.ComponentType<{ className?: string }>; bg: string }> = {
  INFO: { color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', icon: Info },
  WARNING: { color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20', icon: AlertTriangle },
  SUCCESS: { color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle },
  ERROR: { color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20', icon: XCircle },
};

function NotificationCard({
  notification,
  onMarkRead,
}: {
  notification: NotificationItem;
  onMarkRead: () => void;
}) {
  const cfg = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.INFO;
  const notifTimeAgo = timeAgo(notification.createdAt);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        'flex items-start gap-4 p-4 rounded-2xl border transition-all',
        notification.isRead
          ? 'bg-white/1 border-white/5 opacity-60 hover:opacity-100'
          : 'bg-white/3 border-white/10',
      )}
    >
      <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center shrink-0', cfg.bg)}>
        {notification.type === 'INFO' && <Info className={cn('w-4 h-4', cfg.color)} />}
        {notification.type === 'WARNING' && <AlertTriangle className={cn('w-4 h-4', cfg.color)} />}
        {notification.type === 'SUCCESS' && <CheckCircle className={cn('w-4 h-4', cfg.color)} />}
        {notification.type === 'ERROR' && <XCircle className={cn('w-4 h-4', cfg.color)} />}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm font-semibold', notification.isRead ? 'text-white/60' : 'text-white')}>
            {notification.title}
          </p>
          {!notification.isRead && (
            <div className="w-2 h-2 rounded-full bg-p mt-1.5 shrink-0" />
          )}
        </div>
        <p className={cn('text-xs leading-relaxed', notification.isRead ? 'text-white/30' : 'text-white/50')}>
          {notification.body}
        </p>
        <div className="flex items-center gap-3 pt-1">
          <span className="text-[10px] text-white/20 uppercase tracking-widest">{notifTimeAgo}</span>
          {notification.actionUrl && (
            <a
              href={notification.actionUrl}
              className="text-[10px] text-p uppercase tracking-widest font-bold flex items-center gap-1 hover:underline"
            >
              View <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
          {!notification.isRead && (
            <button
              onClick={onMarkRead}
              className="text-[10px] text-white/30 uppercase tracking-widest hover:text-white/60 transition-colors"
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-white uppercase tracking-tight">Notifications</h2>
          <p className="text-xs text-white/30 uppercase tracking-widest font-semibold">
            Alerts · System messages · Trade events
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-bold uppercase tracking-widest hover:bg-white/10 disabled:opacity-50 transition-colors"
            >
              {markAllMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCheck className="w-4 h-4" />
              )}
              Mark All Read
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-p/10 border border-p/20 flex items-center justify-center relative">
            <Bell className="w-5 h-5 text-p" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-p text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { setUnreadOnly(false); setPage(1); }}
          className={cn(
            'px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all',
            !unreadOnly ? 'bg-p text-white' : 'bg-white/5 text-white/30 hover:text-white/60',
          )}
        >
          All
        </button>
        <button
          onClick={() => { setUnreadOnly(true); setPage(1); }}
          className={cn(
            'px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all',
            unreadOnly ? 'bg-p text-white' : 'bg-white/5 text-white/30 hover:text-white/60',
          )}
        >
          Unread {data?.unreadCount ? `(${data.unreadCount})` : ''}
        </button>
      </div>

      {/* Notification List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/3 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/3 border border-white/8 flex items-center justify-center mx-auto">
            <BellOff className="w-8 h-8 text-white/10" />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-white/30 uppercase tracking-widest font-semibold">
              {unreadOnly ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p className="text-xs text-white/15">
              {unreadOnly ? 'You\'re all caught up!' : 'Trade alerts, system messages, and updates will appear here.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkRead={() => markReadMutation.mutate(notification.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {(hasMore || page > 1) && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="h-10 px-4 rounded-xl bg-white/5 text-white/40 text-xs font-bold uppercase tracking-widest hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-white/20 uppercase tracking-widest">Page {page}</span>
          <button
            disabled={!hasMore}
            onClick={() => setPage((p) => p + 1)}
            className="h-10 px-4 rounded-xl bg-white/5 text-white/40 text-xs font-bold uppercase tracking-widest hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
