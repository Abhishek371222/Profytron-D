'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Plus,
  Trash2,
  BookOpen,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ts: number;
};

type TrainingItem = {
  id: string;
  question: string;
  answer: string;
};

type Tab = 'chat' | 'train';

const STORAGE_KEY = 'profytron_chatbot_training';

const QUICK_SUGGESTIONS = [
  'What is Profytron?',
  'How do I connect a broker?',
  'What is copy trading?',
  'How does the AI Coach work?',
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
          className="w-1.5 h-1.5 rounded-full bg-indigo-400"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
          transition={{ duration: 1, delay: i * 0.18, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

function BotAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 mt-0.5 shadow-lg shadow-indigo-500/25">
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
            ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-sm shadow-lg shadow-indigo-500/20'
            : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-sm',
        )}
      >
        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        <p
          className={cn(
            'text-[10px] mt-1.5 font-medium',
            isUser ? 'text-white/50 text-right' : 'text-white/25',
          )}
        >
          {new Date(msg.ts).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  );
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('chat');
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [customTraining, setCustomTraining] = useState<TrainingItem[]>([]);
  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');
  const [hasUnread, setHasUnread] = useState(false);
  const [addError, setAddError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setCustomTraining(JSON.parse(stored));
    } catch {}
  }, []);

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

  const persistTraining = (items: TrainingItem[]) => {
    setCustomTraining(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

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
            customTraining: customTraining.map(({ question, answer }) => ({
              question,
              answer,
            })),
          }),
        });

        const data = await res.json();
        const botMsg: Message = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content:
            data.message ||
            data.error ||
            'Something went wrong. Please try again.',
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
            content:
              'Connection error. Please check your internet connection and try again.',
            ts: Date.now(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, customTraining, loading, isOpen],
  );

  const addTrainingPair = () => {
    if (!newQ.trim()) { setAddError('Please enter a question.'); return; }
    if (!newA.trim()) { setAddError('Please enter an answer.'); return; }
    setAddError('');
    persistTraining([
      ...customTraining,
      { id: `t-${Date.now()}`, question: newQ.trim(), answer: newA.trim() },
    ]);
    setNewQ('');
    setNewA('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 select-none">
      {/* ── Chat window ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 16 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            style={{ transformOrigin: 'bottom right' }}
            className="w-[370px] max-w-[calc(100vw-24px)] rounded-3xl overflow-hidden flex flex-col bg-[#07070c]/96 backdrop-blur-3xl border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)] h-[560px]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 px-5 py-4 flex items-center justify-between shrink-0 relative overflow-hidden">
              {/* subtle noise overlay */}
              <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJuIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC45IiBudW1PY3RhdmVzPSI0IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWx0ZXI9InVybCgjbikiIG9wYWNpdHk9IjEiLz48L3N2Zz4=')]" />
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/25 backdrop-blur-sm shadow-inner">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white tracking-wide">
                    Profytron AI
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow shadow-emerald-400/70 animate-pulse" />
                    <span className="text-[10px] text-white/70 uppercase tracking-widest font-semibold">
                      Online
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative flex items-center gap-2">
                {/* Tab switcher */}
                <div className="flex items-center bg-white/15 rounded-xl p-1 gap-0.5">
                  {(['chat', 'train'] as Tab[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={cn(
                        'px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all',
                        tab === t
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-white/70 hover:text-white',
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors border border-white/20"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* ── Chat Tab ── */}
            {tab === 'chat' && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} msg={msg} />
                  ))}
                  {loading && (
                    <div className="flex items-center gap-2.5">
                      <BotAvatar />
                      <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm">
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
                        className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/50 hover:text-white hover:border-indigo-500/40 hover:bg-indigo-500/10 transition-all font-medium"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Reset */}
                {messages.length > 1 && !loading && (
                  <div className="px-4 pb-2 flex justify-end">
                    <button
                      onClick={() => setMessages([WELCOME])}
                      className="flex items-center gap-1.5 text-[10px] text-white/25 hover:text-white/50 transition-colors font-semibold uppercase tracking-widest"
                    >
                      <RotateCcw className="w-3 h-3" />
                      New chat
                    </button>
                  </div>
                )}

                {/* Input */}
                <div className="px-4 pb-4 shrink-0">
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-indigo-500/50 transition-colors">
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
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
                      disabled={loading}
                    />
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => sendMessage(input)}
                      disabled={!input.trim() || loading}
                      className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center disabled:opacity-30 hover:opacity-90 transition-opacity shrink-0"
                    >
                      <Send className="w-3.5 h-3.5 text-white" />
                    </motion.button>
                  </div>
                  <p className="text-[10px] text-white/15 text-center mt-2 uppercase tracking-widest">
                    Powered by OpenRouter AI
                  </p>
                </div>
              </>
            )}

            {/* ── Train Tab ── */}
            {tab === 'train' && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Existing pairs */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5 min-h-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] uppercase tracking-widest text-white/35 font-semibold">
                      {customTraining.length} custom pair
                      {customTraining.length !== 1 ? 's' : ''}
                    </p>
                    {customTraining.length > 0 && (
                      <button
                        onClick={() => persistTraining([])}
                        className="text-[10px] text-red-400/50 hover:text-red-400 transition-colors uppercase tracking-widest font-semibold"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {customTraining.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white/20" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-white/30 font-medium">
                          No custom training yet
                        </p>
                        <p className="text-[11px] text-white/20 mt-1">
                          Add Q&amp;A pairs to teach the bot specific answers
                        </p>
                      </div>
                    </div>
                  )}

                  {customTraining.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-white/3 border border-white/5 space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold text-indigo-400/70 uppercase tracking-widest">
                          Q
                        </span>
                        <button
                          onClick={() =>
                            persistTraining(
                              customTraining.filter((t) => t.id !== item.id),
                            )
                          }
                          className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-all"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                      <p className="text-xs text-white/80 leading-relaxed">
                        {item.question}
                      </p>
                      <span className="text-[10px] font-bold text-emerald-400/60 uppercase tracking-widest">
                        A
                      </span>
                      <p className="text-xs text-white/45 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Add new pair */}
                <div className="px-4 pb-4 pt-3 border-t border-white/5 space-y-2.5 shrink-0">
                  <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">
                    Add training pair
                  </p>
                  <input
                    value={newQ}
                    onChange={(e) => { setNewQ(e.target.value); setAddError(''); }}
                    placeholder="Question…"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-indigo-500/50 transition-colors"
                  />
                  <textarea
                    value={newA}
                    onChange={(e) => { setNewA(e.target.value); setAddError(''); }}
                    placeholder="Answer…"
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-indigo-500/50 transition-colors resize-none"
                  />
                  {addError && (
                    <p className="text-[11px] text-red-400">{addError}</p>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={addTrainingPair}
                    className="w-full h-10 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl text-sm font-bold text-white uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Pair
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Trigger button ── */}
      <div className="relative">
        {hasUnread && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#07070c] z-10"
          />
        )}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsOpen((p) => !p)}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 shadow-[0_8px_32px_rgba(99,102,241,0.45)] flex items-center justify-center border border-white/20 relative overflow-visible"
          aria-label="Open Profytron AI chat"
        >
          {/* Pulsing ring */}
          <motion.span
            className="absolute inset-0 rounded-2xl ring-2 ring-indigo-400/50"
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
    </div>
  );
}
