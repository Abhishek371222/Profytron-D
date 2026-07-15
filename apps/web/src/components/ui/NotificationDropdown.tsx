'use client';

import React from 'react';
import {
  Bell, CheckCheck, TrendingUp, Info, Zap,
  ExternalLink, Shield, CreditCard, Settings, Trash2, type LucideIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { notificationsApi, type NotificationItem } from '@/lib/api/notifications';
import { onTradingEvent } from '@/lib/realtime/trading-socket';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/useAuthStore';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  SECURITY:     Shield,
  TRADING:      TrendingUp,
  COPY_TRADING: TrendingUp,
  PAYMENT:      CreditCard,
  STRATEGY:     Zap,
  ACCOUNT:      Info,
  SYSTEM:       Settings,
  DEFAULT:      Bell,
};

// Use concrete Tailwind classes so the JIT scanner picks them up
const CATEGORY_STYLES: Record<string, {
  iconColor: string;
  iconBg: string;
  rowBg: string;
  borderColor: string;
  dot: string;
}> = {
  SECURITY:     { iconColor: 'text-chart-4', iconBg: 'bg-chart-4/20', rowBg: 'bg-chart-4/[0.08]', borderColor: 'border-l-chart-4',   dot: 'bg-chart-4'   },
  TRADING:      { iconColor: 'text-primary', iconBg: 'bg-primary/20', rowBg: 'bg-primary/[0.07]', borderColor: 'border-l-primary',   dot: 'bg-primary'   },
  COPY_TRADING: { iconColor: 'text-chart-3', iconBg: 'bg-chart-3/20', rowBg: 'bg-chart-3/[0.07]', borderColor: 'border-l-chart-3',   dot: 'bg-chart-3'   },
  PAYMENT:      { iconColor: 'text-chart-3', iconBg: 'bg-chart-3/20', rowBg: 'bg-chart-3/[0.07]', borderColor: 'border-l-chart-3',   dot: 'bg-chart-3'   },
  STRATEGY:     { iconColor: 'text-chart-5', iconBg: 'bg-chart-5/20', rowBg: 'bg-chart-5/[0.07]', borderColor: 'border-l-chart-5',   dot: 'bg-chart-5'   },
  ACCOUNT:      { iconColor: 'text-chart-2', iconBg: 'bg-chart-2/20', rowBg: 'bg-chart-2/[0.07]', borderColor: 'border-l-chart-2',   dot: 'bg-chart-2'   },
  SYSTEM:       { iconColor: 'text-foreground/60', iconBg: 'bg-foreground/10', rowBg: 'bg-foreground/[0.04]',  borderColor: 'border-l-muted-foreground',   dot: 'bg-muted-foreground'   },
  DEFAULT:      { iconColor: 'text-foreground/60', iconBg: 'bg-foreground/10', rowBg: 'bg-foreground/[0.04]',  borderColor: 'border-l-muted-foreground',   dot: 'bg-muted-foreground'   },
};

function getStyle(item: NotificationItem) {
  const cat = item.category?.toUpperCase() ?? 'DEFAULT';
  return {
    style: CATEGORY_STYLES[cat] ?? CATEGORY_STYLES.DEFAULT,
    Icon:  CATEGORY_ICONS[cat]  ?? CATEGORY_ICONS.DEFAULT,
  };
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function NotificationDropdown() {
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!sessionReady) return;
    try {
      const [list, unread] = await Promise.all([
        notificationsApi.list({ page: 1, limit: 10 }),
        notificationsApi.unreadCount(),
      ]);
      setItems(list.items || []);
      setUnreadCount(unread.count || 0);
    } catch {
      // Swallow 401/network — never surface as an unhandled runtime overlay.
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [sessionReady]);

  React.useEffect(() => {
    if (!sessionReady) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void load();
  }, [load, sessionReady]);

  React.useEffect(() => {
    const off = onTradingEvent('new_notification', (payload: any) => {
      setUnreadCount((c) => c + 1);
      if (payload && typeof payload === 'object' && payload.id) {
        setItems((prev) => [payload as NotificationItem, ...prev].slice(0, 10));
      }
    });
    return off;
  }, []);

  const handleTriggerClick = React.useCallback(() => {
    if (unreadCount > 0) {
      notificationsApi.markSeen().then(() => setUnreadCount(0)).catch(() => {});
    }
  }, [unreadCount]);

  const onMarkAllRead = React.useCallback(async () => {
    await notificationsApi.markAllRead();
    setUnreadCount(0);
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const onDelete = React.useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await notificationsApi.deleteOne(id).catch(() => {});
    setItems((prev) => {
      const isUnread = prev.find((n) => n.id === id && !n.isRead);
      if (isUnread) setUnreadCount((c) => Math.max(0, c - 1));
      return prev.filter((n) => n.id !== id);
    });
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={handleTriggerClick}
          className="relative h-10 w-10 sm:h-[42px] sm:w-[42px] rounded-xl border border-border bg-muted/30 hover:bg-muted/60 hover:border-border text-foreground/40 hover:text-foreground transition-all flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="w-[18px] h-[18px]" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-[10px] leading-[18px] text-primary-foreground text-center font-bold border-2 border-[var(--sidebar)]"
                style={{ boxShadow: '0 0 10px color-mix(in srgb, var(--primary) 50%, transparent)' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-primary/30 animate-ping pointer-events-none" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[calc(100vw-2rem)] max-w-[380px] max-sm:right-[-2.75rem] bg-popover border border-card-border shadow-[var(--shadow-lg)] rounded-card p-0 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Bell className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-sm font-bold text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold border border-primary/30">
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1 text-[10px] font-semibold text-foreground/40 hover:text-foreground/70 transition-colors uppercase tracking-wider"
            type="button"
          >
            <CheckCheck className="w-3 h-3" />
            Mark all read
          </button>
        </div>

        {/* List */}
        <div className="max-h-[420px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {loading ? (
            <div className="space-y-px p-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="w-9 h-9 rounded-xl bg-foreground/[0.06] shrink-0 animate-pulse" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 bg-foreground/[0.06] rounded w-2/3 animate-pulse" />
                    <div className="h-2.5 bg-foreground/[0.04] rounded w-full animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="w-14 h-14 rounded-2xl bg-foreground/[0.05] border border-border flex items-center justify-center">
                <Bell className="w-6 h-6 text-foreground/20" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground/50">All caught up</p>
                <p className="text-xs text-foreground/25 mt-0.5">No new notifications</p>
              </div>
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              <AnimatePresence initial={false}>
                {items.map((item, idx) => {
                  const { style, Icon } = getStyle(item);
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ duration: 0.18, delay: idx * 0.025 }}
                      className={cn(
                        'group relative rounded-xl overflow-hidden transition-all duration-150',
                        !item.isRead && 'border-l-2 ' + style.borderColor,
                        item.isRead ? 'hover:bg-foreground/[0.04]' : style.rowBg + ' hover:brightness-110',
                      )}
                    >
                      <button
                        className="w-full text-left p-3"
                        onClick={async () => {
                          if (!item.isRead) {
                            await notificationsApi.markRead(item.id);
                            setItems((prev) => prev.map((n) => n.id === item.id ? { ...n, isRead: true } : n));
                            setUnreadCount((c) => Math.max(0, c - 1));
                          }
                          if (item.actionUrl) window.location.href = item.actionUrl;
                        }}
                        type="button"
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className={cn(
                            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                            item.isRead ? 'bg-foreground/[0.06]' : style.iconBg,
                          )}>
                            <Icon className={cn('w-4 h-4', item.isRead ? 'text-foreground/30' : style.iconColor)} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 pr-6">
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn(
                                'text-sm font-semibold leading-tight',
                                item.isRead ? 'text-foreground/45' : 'text-foreground',
                              )}>
                                {item.title}
                              </p>
                              <div className="flex items-center gap-1 shrink-0 mt-0.5">
                                {!item.isRead && (
                                  <span className={cn('w-2 h-2 rounded-full', style.dot)} />
                                )}
                                {item.actionUrl && (
                                  <ExternalLink className="w-3 h-3 text-foreground/20 group-hover:text-foreground/50 transition-colors" />
                                )}
                              </div>
                            </div>

                            {item.body && (
                              <p className={cn(
                                'text-xs leading-relaxed mt-1 line-clamp-2',
                                item.isRead ? 'text-foreground/30' : 'text-foreground/60',
                              )}>
                                {item.body}
                              </p>
                            )}

                            <p className="text-[10px] text-foreground/30 mt-1.5 font-medium">
                              {timeAgo(item.createdAt)}
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={(e) => onDelete(e, item.id)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 transition-opacity p-2.5 rounded-lg hover:bg-destructive/15 text-text-muted hover:text-destructive outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        type="button"
                        aria-label="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-3">
          <button
            onClick={() => { window.location.href = '/notifications'; }}
            className="w-full text-center text-[10px] font-bold text-foreground/30 hover:text-foreground/65 uppercase tracking-widest transition-colors"
          >
            View all notifications →
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
