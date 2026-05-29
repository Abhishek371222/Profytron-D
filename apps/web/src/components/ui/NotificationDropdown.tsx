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
  trade:   { icon: 'text-emerald-400', dot: 'bg-emerald-400', bg: 'bg-emerald-400/[0.07]' },
  alert:   { icon: 'text-rose-400',    dot: 'bg-rose-400',    bg: 'bg-rose-400/[0.07]'    },
  info:    { icon: 'text-cyan-400',    dot: 'bg-cyan-400',    bg: 'bg-cyan-400/[0.07]'    },
  success: { icon: 'text-indigo-400',  dot: 'bg-indigo-400',  bg: 'bg-indigo-400/[0.07]'  },
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
        <button className="relative h-10 w-10 sm:h-[42px] sm:w-[42px] rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.10] text-white/40 hover:text-white transition-all flex items-center justify-center outline-none">
          <Bell className="w-[18px] h-[18px]" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-500 text-[9px] leading-[18px] text-white text-center font-bold border-2 border-[#09090f]"
                style={{ boxShadow: '0 0 10px rgba(99,102,241,0.5)' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
          {/* Pulse ring when unread */}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-indigo-500/30 animate-ping" />
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
            <div className="w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
              <Bell className="w-3 h-3 text-indigo-400" />
            </div>
            <span className="text-[13px] font-bold text-white">Notifications</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 text-[10px] font-bold">
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1 text-[10px] font-bold text-white/30 hover:text-white/70 transition-colors uppercase tracking-[0.14em]"
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
                  <div className="w-8 h-8 rounded-xl bg-white/[0.04] shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 bg-white/[0.04] rounded w-3/4" />
                    <div className="h-2 bg-white/[0.03] rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                <Bell className="w-5 h-5 text-white/20" />
              </div>
              <div className="text-center">
                <p className="text-[12px] font-semibold text-white/30">All caught up</p>
                <p className="text-[10px] text-white/15 mt-0.5">No new notifications</p>
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
                        ? 'hover:bg-white/[0.04]'
                        : cn('hover:bg-white/[0.05]', style.bg),
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
                          ? 'bg-white/[0.04] border-white/[0.06]'
                          : cn('border-transparent', style.bg),
                      )}>
                        <Icon className={cn('w-3.5 h-3.5', item.isRead ? 'text-white/25' : style.icon)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            'text-[12px] font-semibold truncate',
                            item.isRead ? 'text-white/50' : 'text-white/90',
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
                              <ExternalLink className="w-3 h-3 text-white/15 group-hover:text-white/40 transition-colors" />
                            )}
                          </div>
                        </div>
                        {item.body && (
                          <p className="text-[11px] text-white/30 mt-0.5 line-clamp-2 leading-relaxed">{item.body}</p>
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
            className="w-full text-center text-[10px] font-bold text-white/25 hover:text-white/60 uppercase tracking-[0.18em] transition-colors"
          >
            View all notifications
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
