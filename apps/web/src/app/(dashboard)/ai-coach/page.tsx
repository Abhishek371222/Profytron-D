'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  Info,
  Send,
  Activity,
  Cpu,
  History,
  Zap,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Magnetic } from '@/components/ui/Interactions';
import { aiApi, type CoachingReport } from '@/lib/api/ai';
import { toast } from 'sonner';

const INSIGHTS = [
  {
    id: 1,
    type: 'good',
    icon: TrendingUp,
    title: 'Strong Discipline',
    body: 'Risk management validated. 14 consecutive sessions with discipline maintained. Strong edge recognition active.',
    color: 'text-emerald-400',
    border: 'border-emerald-400/20',
    bg: 'bg-emerald-400/[0.05]',
    iconBg: 'bg-emerald-400/10 border-emerald-400/20',
  },
  {
    id: 2,
    type: 'warning',
    icon: AlertTriangle,
    title: 'Strategy Variance',
    body: 'Trade size deviates from plan. 4 tactical overrides post-drawdown detected.',
    tip: 'Stick to your framework for 14 days.',
    color: 'text-amber-400',
    border: 'border-amber-400/20',
    bg: 'bg-amber-400/[0.05]',
    iconBg: 'bg-amber-400/10 border-amber-400/20',
  },
  {
    id: 3,
    type: 'danger',
    icon: AlertCircle,
    title: 'Emotional Pressure',
    body: '23 manual overrides detected. Psychological fatigue elevated. Recovery window recommended.',
    color: 'text-rose-400',
    border: 'border-rose-400/20',
    bg: 'bg-rose-400/[0.05]',
    iconBg: 'bg-rose-400/10 border-rose-400/20',
  },
  {
    id: 4,
    type: 'info',
    icon: Activity,
    title: 'Peak Window',
    body: 'Best performance (84% win rate) between 10:00–12:00 IST. Maximum liquidity during this window.',
    color: 'text-cyan-400',
    border: 'border-cyan-400/20',
    bg: 'bg-cyan-400/[0.05]',
    iconBg: 'bg-cyan-400/10 border-cyan-400/20',
  },
];

const SUGGESTIONS = [
  'Analyze current exposure',
  'Review last drawdown',
  'Optimize stop-loss',
  'Check portfolio correlation',
  'Validate MomentumPro setup',
];

type ChatMessage = { id: string; role: 'ai' | 'user'; text: string };

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    role: 'ai',
    text: "All set. Portfolio metrics: +$3,240 today. MomentumPro v4 showing high statistical resonance. Want me to analyze this further?",
  },
];

export default function AICoachPage() {
  const router = useRouter();
  const [messages, setMessages] = React.useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [report, setReport] = React.useState<CoachingReport | null>(null);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  React.useEffect(() => {
    aiApi.getCoachingReport().then(setReport).catch(() => {
      toast.error("Can't load report right now");
    });
  }, []);

  const handleSend = React.useCallback(async (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { id: `${Date.now()}`, role: 'user', text }]);
    setInputValue('');
    setIsTyping(true);
    try {
      const response = await aiApi.chat(text);
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now() + 1}`, role: 'ai', text: response?.reply || 'No response from AI coach.' },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now() + 1}`, role: 'ai', text: 'AI coach is temporarily unavailable. Please retry.' },
      ]);
      toast.error('AI coach unavailable');
    } finally {
      setIsTyping(false);
    }
  }, []);

  return (
    <div className="flex h-[calc(100vh-80px)] gap-4 overflow-hidden">
      {/* ── LEFT PANEL ── */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden xl:flex w-[340px] shrink-0 flex-col gap-3 overflow-hidden"
      >
        {/* Header card */}
        <div className="rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-5">
          <div className="flex items-center gap-2 mb-3">
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-cyan-400"
              style={{ boxShadow: '0 0 6px #22d3ee' }}
            />
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em]">Profytron AI v4.2</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mb-1">AI Trading Coach</h1>
          <p className="text-xs text-white/40">Insights · Safety check · Performance review</p>
          {report && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.06]">
              <div className="flex flex-col">
                <span className="text-[10px] text-white/25 uppercase tracking-widest">Win Rate</span>
                <span className="text-sm font-bold text-emerald-400">{report.winRate}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-white/25 uppercase tracking-widest">Avg PnL</span>
                <span className="text-sm font-bold text-cyan-400">{report.avgPnl}</span>
              </div>
            </div>
          )}
        </div>

        {/* Insights */}
        <div className="flex-1 overflow-y-auto space-y-2.5 no-scrollbar">
          {INSIGHTS.map((insight, idx) => {
            const Icon = insight.icon;
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.08, duration: 0.5 }}
                className={cn(
                  'group rounded-[16px] border p-4 transition-all duration-300 cursor-default',
                  insight.border, insight.bg,
                  'hover:brightness-110',
                )}
              >
                <div className="flex gap-3">
                  <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center shrink-0', insight.iconBg)}>
                    <Icon className={cn('w-4 h-4', insight.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-[11px] font-bold uppercase tracking-widest mb-1', insight.color)}>
                      {insight.title}
                    </p>
                    <p className="text-[12px] text-white/55 leading-relaxed">{insight.body}</p>
                    {insight.tip && (
                      <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-amber-400/15 bg-amber-400/5 px-2.5 py-2">
                        <Sparkles className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-300/70 leading-relaxed">{insight.tip}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Score card */}
        <div className="rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-0.5">Profile Score</p>
              <p className="text-base font-bold text-white">78 / 100</p>
            </div>
            <div className="relative w-14 h-14">
              <svg className="w-full h-full -rotate-90">
                <circle cx="28" cy="28" r="24" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="none" />
                <motion.circle
                  cx="28" cy="28" r="24"
                  stroke="#6366f1"
                  strokeWidth="4"
                  strokeDasharray="150.8"
                  initial={{ strokeDashoffset: 150.8 }}
                  animate={{ strokeDashoffset: 150.8 * (1 - 0.78) }}
                  transition={{ duration: 2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-white">78</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: '0 0 6px #34d399' }} />
            <span className="text-[11px] text-emerald-400 font-semibold">Good Zone</span>
          </div>

          {/* Mini bars */}
          <div className="flex gap-1.5 mt-3">
            {[0.4, 0.7, 1, 0.6, 0.8, 0.3, 0.9].map((s, i) => (
              <div key={i} className="flex-1 h-5 bg-white/[0.04] rounded-full relative overflow-hidden">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${s * 100}%` }}
                  transition={{ delay: 0.8 + i * 0.08, duration: 0.8, ease: 'easeOut' }}
                  className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-full"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-3 text-[9px] text-white/20 font-mono uppercase tracking-widest">
            <span>12ms</span>
            <span>AES-256</span>
          </div>
        </div>
      </motion.div>

      {/* ── RIGHT PANEL: Chat ── */}
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-1 flex-col overflow-hidden rounded-[22px] border border-white/[0.07] bg-white/[0.02]"
      >
        {/* Chat header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-black/20 px-5 py-4 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-[16px] bg-gradient-to-tr from-indigo-500 via-violet-500 to-cyan-500 p-[1.5px]">
                <div className="w-full h-full rounded-[14px] bg-[#0a0a10] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-black"
                style={{ boxShadow: '0 0 8px rgba(52,211,153,0.6)' }}
              />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AI Trading Coach</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                />
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Claude AI · Live</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-[10px] text-white/25 uppercase tracking-widest">Model</span>
              <span className="text-[11px] font-bold text-white/60 font-mono">Claude 4.5</span>
            </div>
            <Button
              onClick={() => router.push('/history')}
              variant="ghost"
              size="icon"
              className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.06] text-white/40 hover:text-white transition-all"
            >
              <History className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 no-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className={cn('flex items-start gap-3 max-w-[88%]', msg.role === 'user' && 'ml-auto flex-row-reverse')}
              >
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-400/10 border border-indigo-400/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                )}

                <div
                  className={cn(
                    'rounded-[18px] px-4 py-3 text-[13px] leading-relaxed font-medium',
                    msg.role === 'ai'
                      ? 'rounded-tl-md bg-white/[0.04] border border-white/[0.07] text-white/80'
                      : 'rounded-tr-md bg-indigo-500/20 border border-indigo-400/30 text-white',
                  )}
                >
                  {msg.text.split('\n').map((line, i) => {
                    const parts = line.split(/(\$\d+(?:,\d+)*(?:\.\d+)?|\d+(?:\.\d+)?%?)/g);
                    return (
                      <p key={i} className={i > 0 ? 'mt-2' : ''}>
                        {parts.map((part, j) =>
                          part.match(/(\$\d+(?:,\d+)*(?:\.\d+)?|\d+(?:\.\d+)?%?)/) ? (
                            <span
                              key={j}
                              className={cn(
                                'font-mono font-bold mx-0.5 px-1.5 py-0.5 rounded-lg text-[12px]',
                                msg.role === 'ai' ? 'text-cyan-400 bg-cyan-400/10' : 'text-white bg-white/10',
                              )}
                            >
                              {part}
                            </span>
                          ) : (
                            part
                          ),
                        )}
                      </p>
                    );
                  })}
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 max-w-[60%]"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-400/10 border border-indigo-400/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="flex items-center gap-2 rounded-[18px] rounded-tl-md px-4 py-3 bg-white/[0.04] border border-white/[0.07]">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                      className="w-2 h-2 rounded-full bg-cyan-400"
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-white/[0.06] bg-black/20 p-4 backdrop-blur-xl shrink-0">
          {/* Quick suggestions */}
          <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
            {SUGGESTIONS.map((s, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.07 }}
                onClick={() => handleSend(s)}
                className="whitespace-nowrap rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/35 transition-all hover:border-cyan-400/30 hover:text-cyan-400 hover:bg-cyan-400/5 shrink-0"
              >
                {s}
              </motion.button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-3 rounded-[16px] border border-white/[0.08] bg-white/[0.03] px-4 py-3 focus-within:border-indigo-400/40 focus-within:bg-indigo-400/[0.03] transition-all">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend(inputValue)}
              placeholder="Ask about your trading performance..."
              className="flex-1 bg-transparent text-[13px] font-medium text-white placeholder:text-white/25 outline-none"
            />
            <span className="text-[10px] text-white/15 font-mono hidden md:block">{inputValue.length}/500</span>
            <Magnetic strength={0.2}>
              <button
                onClick={() => handleSend(inputValue)}
                disabled={!inputValue.trim()}
                className="w-9 h-9 rounded-xl bg-indigo-500/80 hover:bg-indigo-500 disabled:opacity-25 disabled:hover:bg-indigo-500/80 flex items-center justify-center transition-all active:scale-90"
                style={{ boxShadow: inputValue.trim() ? '0 0 16px rgba(99,102,241,0.4)' : 'none' }}
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </Magnetic>
          </div>

          <p className="text-center mt-2.5 text-[9px] text-white/15 font-mono uppercase tracking-widest">
            Secure · AI System v8.42
          </p>
        </div>
      </motion.div>
    </div>
  );
}
