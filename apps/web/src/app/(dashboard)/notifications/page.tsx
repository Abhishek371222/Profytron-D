'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, type NotificationItem } from '@/lib/api/notifications';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DashboardPage,
  DashboardBreadcrumbs,
  DashboardPageHeader,
  DashButton,
} from '@/components/dashboard/DashboardPrimitives';
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
    color: 'text-chart-5',
    iconBg: 'bg-chart-5/10',
    border: 'border-chart-5/15',
    hoverBorder: 'hover:border-chart-5/35',
    glow: 'hover:shadow-[0_0_20px_color-mix(in_srgb,var(--chart-5)_20%,transparent)]',
    icon: Info,
    dot: 'bg-chart-5',
  },
  WARNING: {
    color: 'text-chart-4',
    iconBg: 'bg-chart-4/10',
    border: 'border-chart-4/15',
    hoverBorder: 'hover:border-chart-4/35',
    glow: 'hover:shadow-[0_0_20px_color-mix(in_srgb,var(--chart-4)_20%,transparent)]',
    icon: AlertTriangle,
    dot: 'bg-chart-4',
  },
  SUCCESS: {
    color: 'text-chart-3',
    iconBg: 'bg-chart-3/10',
    border: 'border-chart-3/15',
    hoverBorder: 'hover:border-chart-3/35',
    glow: 'hover:shadow-[0_0_20px_color-mix(in_srgb,var(--chart-3)_20%,transparent)]',
    icon: CheckCircle,
    dot: 'bg-chart-3',
  },
  ERROR: {
    color: 'text-destructive',
    iconBg: 'bg-destructive/10',
    border: 'border-destructive/15',
    hoverBorder: 'hover:border-destructive/35',
    glow: 'hover:shadow-[0_0_20px_color-mix(in_srgb,var(--destructive)_20%,transparent)]',
    icon: XCircle,
    dot: 'bg-destructive',
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
          ? 'bg-muted/50 border-white/[0.05] opacity-55 hover:opacity-100'
          : cn('bg-muted/25', cfg.border, cfg.hoverBorder, cfg.glow),
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
          <p className={cn('text-sm font-bold leading-snug', notification.isRead ? 'text-foreground/50' : 'text-foreground')}>
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0 shadow-sm', cfg.dot)} />
          )}
        </div>

        <p className={cn('text-xs leading-relaxed', notification.isRead ? 'text-foreground/25' : 'text-foreground/45')}>
          {notification.body}
        </p>

        <div className="flex items-center gap-4 pt-1">
          <span className="text-micro text-foreground/20 uppercase tracking-[0.3em] font-mono">
            {timeAgo(notification.createdAt)}
          </span>
          {notification.actionUrl && (
            <a
              href={notification.actionUrl}
              className={cn('text-micro font-bold uppercase tracking-widest flex items-center gap-1 hover:underline transition-colors', cfg.color)}
            >
              View <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
          {!notification.isRead && (
            <button
              onClick={onMarkRead}
              className="text-micro text-foreground/25 uppercase tracking-widest hover:text-foreground/60 transition-colors font-bold"
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
    <DashboardPage>
      <DashboardBreadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Notifications' }]} />

      <DashboardPageHeader
        title="Notifications"
        description="Trade alerts, system messages, and platform events."
        icon={Bell}
        actions={
          <>
            {unreadCount > 0 && (
              <DashButton
                variant="outline"
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
                className="gap-2"
              >
                {markAllMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                Mark all read
              </DashButton>
            )}
            <DashButton variant={unreadOnly ? 'primary' : 'outline'} onClick={() => { setUnreadOnly((v) => !v); setPage(1); }}>
              {unreadOnly ? 'Showing unread' : 'Unread only'}
            </DashButton>
          </>
        }
      />

      {/* ── Notification List ── */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[88px] rounded-[22px] bg-muted/25 animate-pulse border border-[var(--card-border)]" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-24 text-center space-y-5"
        >
          <div className="w-16 h-16 rounded-[22px] bg-muted border border-[var(--card-border)] flex items-center justify-center mx-auto">
            <BellOff className="w-7 h-7 text-foreground/10" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-bold text-foreground/20 uppercase tracking-widest">
              {unreadOnly ? 'All caught up' : 'No notifications yet'}
            </p>
            <p className="text-xs text-foreground/15 max-w-xs mx-auto">
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
          <DashButton variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </DashButton>
          <span className="dash-eyebrow">Page {page}</span>
          <DashButton variant="outline" disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>
            Next
          </DashButton>
        </div>
      )}
    </DashboardPage>
  );
}
