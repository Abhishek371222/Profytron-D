'use client';

import React from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { notificationsApi, type NotificationItem } from '@/lib/api/notifications';

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
        <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white rounded-full">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 ? (
            <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-p text-[10px] leading-4 text-white text-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-88 glass-strong">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <button
            className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1"
            onClick={onMarkAllRead}
            type="button"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-auto">
          {loading ? (
            <div className="px-3 py-6 text-xs text-slate-500">Loading...</div>
          ) : items.length === 0 ? (
            <div className="px-3 py-6 text-xs text-slate-500">No notifications.</div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                className="w-full text-left px-3 py-2.5 hover:bg-white/5 border-b border-white/5 last:border-0"
                onClick={async () => {
                  if (!item.isRead) {
                    await notificationsApi.markRead(item.id);
                    await load();
                  }
                  if (item.actionUrl) {
                    window.location.href = item.actionUrl;
                  }
                }}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-medium text-slate-200 truncate">{item.title}</div>
                  {!item.isRead ? <span className="w-2 h-2 rounded-full bg-p shrink-0" /> : null}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{item.body}</div>
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
