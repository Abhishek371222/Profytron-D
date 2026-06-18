'use client';

import React from 'react';
import { Bell, CheckCheck, TrendingUp, AlertCircle, Info, Zap, ExternalLink, type LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { notificationsApi, type NotificationItem } from '@/lib/api/notifications';
import { cn } from '@/lib/utils';

const TYPE_ICONS: Record<string, LucideIcon> = {
  trade:   TrendingUp,
  alert:   AlertCircle,
  info:    Info,
  success: Zap,
};

const TYPE_COLORS: Record<string, { icon: string; dot: string; bg: string }> = {
  trade:   { icon: 'text-chart-3', dot: 'bg-chart-3', bg: 'bg-chart-3/[0.07]' },
  alert:   { icon: 'text-destructive',    dot: 'bg-destructive',    bg: 'bg-destructive/[0.07]'    },
  info:    { icon: 'text-chart-5',    dot: 'bg-chart-5',    bg: 'bg-chart-5/[0.07]'    },
  success: { icon: 'text-primary',  dot: 'bg-primary',  bg: 'bg-primary/[0.07]'  },
};

function getTypeFromNotification(item: NotificationItem) {
  const title = item.title?.toLowerCase() || '';
  if (title.includes('trade') || title.includes('profit') || title.includes('loss')) return 'trade';
  if (title.includes('alert') || title.includes('warning') || title.includes('error')) return 'alert';
  if (title.includes('success') || title.includes('activated') || title.includes('enabled')) return 'success';
  return 'info';
}

export function NotificationDropdown() {
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const load = React.useCallback(async () => {
    try {
      const [list, unread] = await Promise.all([
        notificationsApi.list({ page: 1, limit: 8 }),
        notificationsApi.unreadCount(),
      ]);
      setItems(list.items || []);
      setUnreadCount(unread.count || 0);
    } catch {
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const onMarkAllRead = React.useCallback(async () => {
    await notificationsApi.markAllRead();
    await load();
  }, [load]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative h-10 w-10 sm:h-[42px] sm:w-[42px] rounded-xl border border-white/[0.06] bg-muted/3 hover:bg-muted/6 hover:border-white/[0.10] text-foreground/40 hover:text-foreground transition-all flex items-center justify-center outline-none">
          <Bell className="w-[18px] h-[18px]" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-micro leading-[18px] text-foreground text-center font-bold border-2 border-[var(--sidebar)]"
                style={{ boxShadow: '0 0 10px rgba(71,167,170,0.5)' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
          {/* Pulse ring when unread */}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-primary/30 animate-ping" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[340px] bg-[#0d0d18]/96 backdrop-blur-xl border border-white/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.7)] rounded-2xl p-0 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Bell className="w-3 h-3 text-primary" />
            </div>
            <span className="text-body-sm font-bold text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-primary/15 text-primary text-micro font-bold">
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1 text-micro font-bold text-foreground/30 hover:text-foreground/70 transition-colors uppercase tracking-[0.14em]"
            type="button"
          >
            <CheckCheck className="w-3 h-3" />
            Mark all read
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[360px] overflow-y-auto no-scrollbar">
          {loading ? (
            <div className="space-y-1 p-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl shimmer" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="w-8 h-8 rounded-xl bg-muted/4 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 bg-muted/4 rounded w-3/4" />
                    <div className="h-2 bg-muted/3 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="w-12 h-12 rounded-2xl bg-muted/3 border border-white/[0.06] flex items-center justify-center">
                <Bell className="w-5 h-5 text-foreground/20" />
              </div>
              <div className="text-center">
                <p className="text-caption font-semibold text-foreground/30">All caught up</p>
                <p className="text-micro text-foreground/15 mt-0.5">No new notifications</p>
              </div>
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {items.map((item, idx) => {
                const type = getTypeFromNotification(item);
                const style = TYPE_COLORS[type] ?? TYPE_COLORS.info;
                const Icon = TYPE_ICONS[type] ?? Info;

                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.04 }}
                    className={cn(
                      'group w-full text-left rounded-xl p-3 transition-all duration-200',
                      item.isRead
                        ? 'hover:bg-muted/4'
                        : cn('hover:bg-muted/5', style.bg),
                    )}
                    onClick={async () => {
                      if (!item.isRead) {
                        await notificationsApi.markRead(item.id);
                        await load();
                      }
                      if (item.actionUrl) window.location.href = item.actionUrl;
                    }}
                    type="button"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={cn(
                        'w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5',
                        item.isRead
                          ? 'bg-muted/4 border-white/[0.06]'
                          : cn('border-transparent', style.bg),
                      )}>
                        <Icon className={cn('w-3.5 h-3.5', item.isRead ? 'text-foreground/25' : style.icon)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            'text-caption font-semibold truncate',
                            item.isRead ? 'text-foreground/50' : 'text-foreground/90',
                          )}>
                            {item.title}
                          </p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {!item.isRead && (
                              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0 mt-1', style.dot)}
                                style={{ boxShadow: `0 0 6px currentColor` }}
                              />
                            )}
                            {item.actionUrl && (
                              <ExternalLink className="w-3 h-3 text-foreground/15 group-hover:text-foreground/40 transition-colors" />
                            )}
                          </div>
                        </div>
                        {item.body && (
                          <p className="text-caption text-foreground/30 mt-0.5 line-clamp-2 leading-relaxed">{item.body}</p>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.06] px-4 py-2.5">
          <button
            onClick={() => { window.location.href = '/notifications'; }}
            className="w-full text-center text-micro font-bold text-foreground/25 hover:text-foreground/60 uppercase tracking-[0.18em] transition-colors"
          >
            View all notifications
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
