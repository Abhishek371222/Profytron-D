'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/stores/useUIStore';

const APP_SHELL_ROUTES = [
  '/dashboard', '/analytics', '/wallet', '/strategies', '/marketplace',
  '/journal', '/history', '/leaderboard', '/bots', '/get-bots',
  '/notifications', '/affiliate', '/creator', '/alpha-coach', '/settings', '/admin',
  '/my-bots', '/subscriptions', '/billing', '/team-plans', '/connected-accounts',
];

// Focused conversion / auth flows — a floating launcher just overlaps the
// primary CTAs (esp. on mobile), so we hide it entirely on these routes.
const HIDDEN_ROUTES = [
  '/login', '/register', '/signup', '/verify-email',
  '/reset-password', '/forgot-password', '/auth', '/onboarding',
];

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ts: number;
};

const QUICK_SUGGESTIONS = [
  'What is Profytron?',
  'How do I connect a broker?',
  'How do automated trading bots work?',
  'How does Alpha Coach work?',
  'How do I build a strategy?',
  'What is Paper Trading?',
];

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi! I'm Profytron AI. Ask me anything about trading, brokers, strategies, or platform features.",
  ts: Date.now(),
};

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
          transition={{ duration: 1, delay: i * 0.18, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

function BotAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shrink-0 mt-0.5 shadow-lg shadow-primary/25">
      <Sparkles className="w-3.5 h-3.5 text-white" />
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn('flex gap-2.5', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {!isUser && <BotAvatar />}
      <div
        className={cn(
          'max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-gradient-to-br from-primary to-chart-2 text-white rounded-tr-sm shadow-lg shadow-primary/20'
            : 'bg-foreground/5 border border-border text-foreground/80 rounded-tl-sm',
        )}
      >
        <p className="whitespace-pre-wrap break-words text-inherit">{msg.content}</p>
        <p
          className={cn(
            'text-[10px] mt-1.5 font-medium',
            isUser ? 'text-white/50 text-right' : 'text-foreground/25',
          )}
        >
          {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}

export function ChatbotWidget() {
  const pathname = usePathname();
  const isHidden = HIDDEN_ROUTES.some(
    (r) => pathname === r || pathname?.startsWith(`${r}/`),
  );
  const isAppShell = APP_SHELL_ROUTES.some((r) => pathname?.startsWith(r));
  const aiChatOpen = useUIStore((s) => s.aiChatOpen);
  const setAIChatOpen = useUIStore((s) => s.setAIChatOpen);
  const toggleAIChat = useUIStore((s) => s.toggleAIChat);
  const [localOpen, setLocalOpen] = useState(false);
  const isOpen = isAppShell ? aiChatOpen : localOpen;
  const setIsOpen = isAppShell ? setAIChatOpen : setLocalOpen;
  const toggleOpen = isAppShell ? toggleAIChat : () => setLocalOpen((p) => !p);

  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep wheel events inside the chat panel (Lenis on the landing page hijacks page scroll).
  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el || !isOpen) return;

    const onWheel = (event: WheelEvent) => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const delta = event.deltaY;
      const atTop = scrollTop <= 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
      const scrollingUp = delta < 0;
      const scrollingDown = delta > 0;

      if ((scrollingUp && atTop) || (scrollingDown && atBottom)) {
        event.preventDefault();
        return;
      }

      event.stopPropagation();
      el.scrollTop += delta;
      event.preventDefault();
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: trimmed,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setLoading(true);

      try {
        const res = await fetch('/api/chatbot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMsg]
              .filter((m) => m.id !== 'welcome')
              .map((m) => ({ role: m.role, content: m.content })),
            customTraining: [],
          }),
        });

        const data = await res.json();
        const botMsg: Message = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: data.message || data.error || 'Something went wrong. Please try again.',
          ts: Date.now(),
        };
        setMessages((prev) => [...prev, botMsg]);
        if (!isOpen) setHasUnread(true);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: 'Connection error. Please check your internet connection and try again.',
            ts: Date.now(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, isOpen],
  );

  if (isHidden) return null;

  return (
    <div className={cn(
      'fixed z-[9999] flex flex-col items-end gap-3 select-none',
      isAppShell ? 'bottom-24 right-6 sm:bottom-28 sm:right-8' : 'bottom-6 right-6',
    )}>
      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 16 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            style={{ transformOrigin: 'bottom right' }}
            className="w-[min(370px,calc(100vw-1.5rem))] max-w-[calc(100vw-24px)] rounded-[20px] overflow-hidden flex flex-col bg-card backdrop-blur-xl border border-[var(--card-border)] shadow-card-premium h-[min(540px,calc(100dvh-7rem))] max-h-[calc(100dvh-5rem-env(safe-area-inset-bottom,0px))]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary via-primary to-chart-2 px-5 py-4 flex items-center justify-between shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJuIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC45IiBudW1PY3RhdmVzPSI0IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWx0ZXI9InVybCgjbikiIG9wYWNpdHk9IjEiLz48L3N2Zz4=')]" />

              {/* Left: icon + title */}
              <div className="relative flex items-center gap-3">
                {/* Icon with online badge */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20 backdrop-blur-sm shadow-inner">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-chart-3 border-2 border-primary shadow-sm" />
                </div>

                {/* Name + status — both left-aligned */}
                <div>
                  <p className="text-sm font-bold text-white tracking-wide leading-tight">
                    Profytron AI
                  </p>
                  <p className="text-[10px] text-white/70 uppercase tracking-widest font-semibold mt-0.5 leading-tight">
                    Online
                  </p>
                </div>
              </div>

              {/* Right: close button */}
              <div className="relative">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors border border-white/15"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Messages — data-lenis-prevent stops Lenis from capturing wheel on landing */}
            <div
              ref={messagesScrollRef}
              data-lenis-prevent
              className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4 min-h-0 touch-pan-y"
            >
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              {loading && (
                <div className="flex items-center gap-2.5">
                  <BotAvatar />
                  <div className="bg-foreground/5 border border-border rounded-2xl rounded-tl-sm">
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick suggestions — visible only at conversation start */}
            {messages.length <= 1 && (
              <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                {QUICK_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="px-3 py-1.5 rounded-full bg-foreground/5 border border-border text-xs text-foreground/50 hover:text-foreground hover:border-primary/40 hover:bg-primary/10 transition-all font-medium"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* New chat */}
            {messages.length > 1 && !loading && (
              <div className="px-4 pb-2 flex justify-end">
                <button
                  onClick={() => setMessages([WELCOME])}
                  className="flex items-center gap-1.5 text-[10px] text-foreground/25 hover:text-foreground/50 transition-colors font-semibold uppercase tracking-widest"
                >
                  <RotateCcw className="w-3 h-3" />
                  New chat
                </button>
              </div>
            )}

            {/* Input */}
            <div className="px-4 pb-4 shrink-0">
              <div className="flex items-center gap-2 bg-foreground/5 border border-border rounded-2xl px-4 py-3 focus-within:border-primary/50 transition-colors">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder="Ask anything about Profytron…"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/25 outline-none"
                  disabled={loading}
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center disabled:opacity-30 hover:opacity-90 transition-opacity shrink-0"
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </motion.button>
              </div>
              <p className="text-[10px] text-foreground/15 text-center mt-2 uppercase tracking-widest">
                Profytron AI Assistant
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger button (public pages only) */}
      {!isAppShell && (
        <div className="relative">
          {hasUnread && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full border-2 border-background z-10"
            />
          )}
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={toggleOpen}
            className="w-14 h-14 rounded-[14px] bg-gradient-cta shadow-cta flex items-center justify-center border border-primary/20 relative overflow-visible"
            aria-label="Open Profytron AI chat"
          >
            <motion.span
              className="absolute inset-0 rounded-2xl ring-2 ring-primary/50"
              animate={{ scale: [1, 1.25, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.18 }}
                >
                  <X className="w-6 h-6 text-white" />
                </motion.div>
              ) : (
                <motion.div
                  key="open"
                  initial={{ rotate: 90, opacity: 0, scale: 0.6 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -90, opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.18 }}
                >
                  <MessageCircle className="w-6 h-6 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      )}
    </div>
  );
}
