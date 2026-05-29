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
  Activity,
  Send,
  History,
  Zap,
  Brain,
  ShieldCheck,
  Target,
  ChevronRight,
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
    body: 'Risk management validated. 14 consecutive sessions with discipline maintained.',
    stat: '+14 streak',
    color: 'text-emerald-400',
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/[0.04]',
    iconBg: 'bg-emerald-400/10 border-emerald-400/25',
    glow: 'rgba(52,211,153,0.15)',
  },
  {
    id: 2,
    type: 'warning',
    icon: AlertTriangle,
    title: 'Strategy Variance',
    body: 'Trade size deviates from plan. 4 tactical overrides post-drawdown detected.',
    tip: 'Stick to your framework for 14 days.',
    stat: '4 overrides',
    color: 'text-amber-400',
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/[0.04]',
    iconBg: 'bg-amber-400/10 border-amber-400/25',
    glow: 'rgba(251,191,36,0.12)',
  },
  {
    id: 3,
    type: 'danger',
    icon: AlertCircle,
    title: 'Emotional Pressure',
    body: '23 manual overrides detected. Psychological fatigue elevated.',
    stat: '↑ High risk',
    color: 'text-rose-400',
    border: 'border-rose-500/20',
    bg: 'bg-rose-500/[0.04]',
    iconBg: 'bg-rose-400/10 border-rose-400/25',
    glow: 'rgba(248,113,113,0.12)',
  },
  {
    id: 4,
    type: 'info',
    icon: Activity,
    title: 'Peak Window',
    body: 'Best performance (84% win rate) between 10:00–12:00 IST.',
    stat: '84% win rate',
    color: 'text-cyan-400',
    border: 'border-cyan-500/20',
    bg: 'bg-cyan-500/[0.04]',
    iconBg: 'bg-cyan-400/10 border-cyan-400/25',
    glow: 'rgba(34,211,238,0.12)',
  },
];

const SUGGESTIONS = [
  { label: 'Analyze exposure', icon: Target },
  { label: 'Review drawdown', icon: TrendingUp },
  { label: 'Optimize stop-loss', icon: ShieldCheck },
  { label: 'Check correlation', icon: Activity },
  { label: 'Validate strategy', icon: Zap },
];

type ChatMessage = { id: string; role: 'ai' | 'user'; text: string };

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    role: 'ai',
    text: "All set. Portfolio metrics: +$3,240 today. MomentumPro v4 showing high statistical resonance. Want me to analyze this further?",
  },
];

const SCORE_BARS = [0.4, 0.7, 1, 0.6, 0.8, 0.3, 0.9];

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
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="hidden xl:flex w-[320px] shrink-0 flex-col gap-3 overflow-hidden"
      >
        {/* Header card */}
        <div className="relative rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 overflow-hidden group">
          {/* Top hairline */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
          {/* Ambient glow */}
          <div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full bg-cyan-500/[0.08] blur-2xl" />

          <div className="relative flex items-center gap-2 mb-3">
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-cyan-400"
              style={{ boxShadow: '0 0 6px #22d3ee' }}
            />
            <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em]">Profytron AI v4.2</span>
          </div>

          <div className="relative flex items-center gap-3 mb-3">
            <div className="relative w-10 h-10 rounded-[14px] bg-gradient-to-tr from-indigo-500 via-violet-500 to-cyan-500 p-[1.5px] shrink-0">
              <div className="w-full h-full rounded-[12px] bg-[#0a0a10] flex items-center justify-center">
                <Brain className="w-5 h-5 text-indigo-300" />
              </div>
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-white tracking-tight">AI Trading Coach</h1>
              <p className="text-[10px] text-white/35 mt-0.5">Insights · Safety · Performance</p>
            </div>
          </div>

          {report && (
            <div className="flex items-center gap-4 pt-3 border-t border-white/[0.06]">
              <div className="flex flex-col">
                <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Win Rate</span>
                <span className="text-sm font-bold text-emerald-400 mt-0.5">{report.winRate}%</span>
              </div>
              <div className="w-px h-8 bg-white/[0.06]" />
              <div className="flex flex-col">
                <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Avg PnL</span>
                <span className="text-sm font-bold text-cyan-400 mt-0.5">{report.avgPnl}</span>
              </div>
            </div>
          )}
        </div>

        {/* Insights */}
        <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
          {INSIGHTS.map((insight, idx) => {
            const Icon = insight.icon;
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + idx * 0.09, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className={cn(
                  'group relative rounded-[16px] border p-4 cursor-default overflow-hidden transition-all duration-300',
                  insight.border, insight.bg,
                  'hover:brightness-110',
                )}
              >
                {/* Hover glow */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[16px]"
                  style={{ boxShadow: `inset 0 0 40px ${insight.glow}` }}
                />
                {/* Top hairline */}
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(90deg, transparent, ${insight.glow.replace('0.12', '0.6')}, transparent)` }}
                />

                <div className="relative flex gap-3">
                  <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center shrink-0', insight.iconBg)}>
                    <Icon className={cn('w-4 h-4', insight.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className={cn('text-[10px] font-bold uppercase tracking-widest', insight.color)}>
                        {insight.title}
                      </p>
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0', insight.bg, insight.color)}>
                        {insight.stat}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed">{insight.body}</p>
                    {insight.tip && (
                      <div className="mt-2 flex items-start gap-1.5 rounded-xl border border-amber-400/15 bg-amber-400/5 px-2.5 py-2">
                        <Sparkles className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-300/60 leading-relaxed">{insight.tip}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Score card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="relative rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent" />

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/25">Trading Score</p>
              <p className="text-xl font-bold text-white mt-0.5">78<span className="text-sm text-white/30 font-normal"> / 100</span></p>
            </div>
            <div className="relative w-14 h-14">
              <svg className="w-full h-full -rotate-90">
                <circle cx="28" cy="28" r="24" stroke="rgba(255,255,255,0.05)" strokeWidth="3.5" fill="none" />
                <motion.circle
                  cx="28" cy="28" r="24"
                  stroke="url(#scoreGrad)"
                  strokeWidth="3.5"
                  strokeDasharray="150.8"
                  initial={{ strokeDashoffset: 150.8 }}
                  animate={{ strokeDashoffset: 150.8 * (1 - 0.78) }}
                  transition={{ duration: 2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  fill="none"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[13px] font-bold text-white">78</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mb-3">
            <motion.span
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              style={{ boxShadow: '0 0 6px #34d399' }}
            />
            <span className="text-[11px] text-emerald-400 font-bold">Good Zone</span>
            <span className="ml-auto text-[9px] text-white/20 font-mono uppercase tracking-widest">AES-256</span>
          </div>

          <div className="flex items-end gap-1">
            {SCORE_BARS.map((s, i) => (
              <div key={i} className="flex-1 h-8 bg-white/[0.04] rounded-full relative overflow-hidden">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${s * 100}%` }}
                  transition={{ delay: 0.9 + i * 0.07, duration: 0.7, ease: 'easeOut' }}
                  className="absolute bottom-0 w-full rounded-full"
                  style={{ background: `linear-gradient(to top, #6366f1, #818cf8${Math.round(s * 255).toString(16).padStart(2, '0')})` }}
                />
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* ── RIGHT PANEL: Chat ── */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.015]"
      >
        {/* Chat header */}
        <div className="relative flex items-center justify-between border-b border-white/[0.06] bg-black/20 px-5 py-4 backdrop-blur-xl shrink-0 overflow-hidden">
          {/* Top hairline */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent" />
          {/* Ambient */}
          <div className="pointer-events-none absolute -top-8 left-12 w-32 h-16 rounded-full bg-indigo-500/[0.08] blur-2xl" />

          <div className="relative flex items-center gap-4">
            <div className="relative">
              <div className="w-11 h-11 rounded-[14px] bg-gradient-to-tr from-indigo-500 via-violet-500 to-cyan-500 p-[1.5px]">
                <div className="w-full h-full rounded-[12px] bg-[#0a0a10] flex items-center justify-center">
                  <Sparkles className="w-4.5 h-4.5 text-indigo-300" />
                </div>
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0a0a10]"
                style={{ boxShadow: '0 0 8px rgba(52,211,153,0.7)' }}
              />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-white leading-tight">AI Trading Coach</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                />
                <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-[0.25em]">Claude AI · Live</span>
              </div>
            </div>
          </div>

          <div className="relative flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-[9px] text-white/20 uppercase tracking-widest">Model</span>
              <span className="text-[11px] font-bold text-white/50 font-mono">Claude 4.5</span>
            </div>
            <button
              onClick={() => router.push('/history')}
              className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.06] text-white/35 hover:text-white transition-all flex items-center justify-center"
            >
              <History className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 no-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                className={cn('flex items-start gap-3 max-w-[90%]', msg.role === 'user' && 'ml-auto flex-row-reverse')}
              >
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 border border-indigo-400/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                )}

                <div
                  className={cn(
                    'rounded-[18px] px-4 py-3 text-[13px] leading-relaxed font-medium',
                    msg.role === 'ai'
                      ? 'rounded-tl-md bg-white/[0.04] border border-white/[0.07] text-white/80'
                      : 'rounded-tr-md bg-gradient-to-br from-indigo-500/25 to-violet-500/20 border border-indigo-400/25 text-white',
                  )}
                  style={msg.role === 'user' ? { boxShadow: '0 4px 20px rgba(99,102,241,0.15)' } : undefined}
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
                                msg.role === 'ai' ? 'text-cyan-400 bg-cyan-400/[0.08]' : 'text-white bg-white/15',
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
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-3 max-w-[60%]"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 border border-indigo-400/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="flex items-center gap-1.5 rounded-[18px] rounded-tl-md px-4 py-3 bg-white/[0.04] border border-white/[0.07]">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.18 }}
                      className="w-1.5 h-1.5 rounded-full bg-indigo-400"
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
          <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-0.5">
            {SUGGESTIONS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.06 }}
                  onClick={() => handleSend(s.label)}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/30 transition-all hover:border-indigo-400/30 hover:text-indigo-300 hover:bg-indigo-400/[0.05] shrink-0"
                >
                  <Icon className="w-2.5 h-2.5" />
                  {s.label}
                </motion.button>
              );
            })}
          </div>

          {/* Input */}
          <div className="flex items-center gap-3 rounded-[14px] border border-white/[0.07] bg-white/[0.025] px-4 py-3 focus-within:border-indigo-400/35 focus-within:bg-indigo-400/[0.025] focus-within:shadow-[0_0_24px_rgba(99,102,241,0.10)] transition-all duration-200">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend(inputValue)}
              placeholder="Ask about your trading performance..."
              className="flex-1 bg-transparent text-[13px] font-medium text-white placeholder:text-white/20 outline-none"
            />
            <span className="text-[9px] text-white/15 font-mono hidden md:block">{inputValue.length}/500</span>
            <Magnetic strength={0.2}>
              <motion.button
                onClick={() => handleSend(inputValue)}
                disabled={!inputValue.trim()}
                whileHover={inputValue.trim() ? { scale: 1.05 } : {}}
                whileTap={inputValue.trim() ? { scale: 0.92 } : {}}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 disabled:opacity-20 flex items-center justify-center transition-opacity"
                style={{ boxShadow: inputValue.trim() ? '0 0 20px rgba(99,102,241,0.5)' : 'none' }}
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </motion.button>
            </Magnetic>
          </div>

          <p className="text-center mt-2 text-[9px] text-white/12 font-mono uppercase tracking-[0.2em]">
            Encrypted · AI System v8.42 · Powered by Anthropic
          </p>
        </div>
      </motion.div>
    </div>
  );
}
