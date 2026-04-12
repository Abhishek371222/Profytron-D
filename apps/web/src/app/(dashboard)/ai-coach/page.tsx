'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  ArrowRight, 
  MessageSquare,
  Zap,
  ShieldCheck,
  History,
  Send,
  Target,
  Activity,
  Cpu,
  Box
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Magnetic } from '@/components/ui/Interactions';

// Mock Insights
const INSIGHTS = [
  { 
    id: 1, 
    type: 'good', 
    icon: TrendingUp, 
    title: 'Discipline Protocol', 
    body: "Risk limits maintained for 14 consecutive daily cycles. Psychological stability verified.", 
    color: 'text-emerald-400', 
    glow: 'shadow-[0_0_20px_rgba(52,211,153,0.3)]'
  },
  { 
    id: 2, 
    type: 'warning', 
    icon: AlertTriangle, 
    title: 'Behavioral Deviation', 
    body: "Strategy hopping detected. 4 switches post-drawdown. Re-evaluating edge persistence.", 
    tip: 'Observe 14-day quarantine for new strategies.',
    color: 'text-amber-400', 
    glow: 'shadow-[0_0_20px_rgba(251,191,36,0.3)]'
  },
  { 
    id: 3, 
    type: 'danger', 
    icon: AlertCircle, 
    title: 'Capacity Overload', 
    body: "23 manual overrides detected. Emotional friction level: HIGH (CRITICAL).", 
    color: 'text-red-400', 
    glow: 'shadow-[0_0_20px_rgba(248,113,113,0.3)]'
  },
  { 
    id: 4, 
    type: 'info', 
    icon: Activity, 
    title: 'Alpha Window', 
    body: "Neural efficiency peaks (84%) during 10:00–12:00 IST liquid windows.", 
    color: 'text-indigo-400', 
    glow: 'shadow-[0_0_20px_rgba(129,140,248,0.3)]'
  },
];

const SUGGESTIONS = [
  "Analyze current volatility exposure",
  "Review my last drawdown cycle",
  "Optimize my stop-loss placement",
  "Check correlation with BTC/USD",
  "Recalibrate strategy NeuralPro v2",
];

const INITIAL_MESSAGES = [
  {
    id: '1',
    role: 'ai',
    text: "System Online. Greetings, Trader. Terminal integrity verified.\nPortfolio metrics: +$3,240 (Intraday). MomentumPro v4 showing high statistical resonance. Proceed with deep analysis?"
  }
];

export default function AICoachPage() {
  const [messages, setMessages] = React.useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = React.useCallback((text: string) => {
    if (!text.trim()) return;
    const newMessage = { id: `${Date.now()}`, role: 'user' as const, text };
    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const aiResponse = { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        text: "Analyzing volatility vectors... Correlation detected: Your Friday afternoon exposure exceeds risk thresholds by 42%. Psychological fatigue likely. Deploying intervention protocol: Recommend closing active positions before 20:30 IST." 
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 2500);
  }, []);

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 p-2">
      {/* LEFT PANEL: Insights Terminal */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-[420px] flex flex-col gap-6"
      >
        <div className="glass-ultra rounded-[40px] border-white/5 p-8 flex-1 overflow-y-auto no-scrollbar space-y-10 relative">
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none opacity-50 transition-opacity duration-1000" />
          
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_15px_rgba(99,102,241,1)]" />
              <span className="text-xs font-semibold text-white/30 uppercase tracking-[0.6em]">Neural Engine v4.2</span>
            </div>
            <h1 className="text-3xl font-semibold text-white uppercase tracking-tight leading-tight">Tactical Feed</h1>
            <div className="h-px w-20 bg-primary/30" />
          </div>

          <div className="space-y-6 relative z-10">
            {INSIGHTS.map((insight, idx) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                className={cn(
                  "p-6 rounded-4xl border border-white/3 bg-white/1 hover:bg-white/3 transition-all duration-500 group cursor-pointer relative overflow-hidden",
                  "hover:border-white/10"
                )}
              >
                {/* Hardware Accent Corners */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-linear-to-br from-white/2 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-2 h-2 bg-white/5 rounded-tr-sm" />
                
                <div className="flex gap-5">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-700",
                    "bg-white/5 border-white/5 outline outline-0 outline-white/10 group-hover:outline-1 group-hover:scale-110 group-hover:rotate-6",
                    insight.color
                  )}>
                    <insight.icon className="w-6 h-6 drop-shadow-[0_0_8px_currentColor]" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className={cn("text-[14px] font-semibold uppercase tracking-[0.2em] transition-colors", insight.color)}>
                        {insight.title}
                      </h4>
                      <span className="text-[10px] font-mono text-white/10 uppercase tracking-widest">ID_S.{insight.id}</span>
                    </div>
                    <p className="text-[14px] text-white/50 font-medium leading-relaxed font-sans group-hover:text-white/70 transition-colors">
                      {insight.body}
                    </p>
                    {insight.tip && (
                      <div className="mt-4 p-4 rounded-2xl bg-indigo-500/3 border border-indigo-500/10 flex items-start gap-3">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-indigo-300 font-semibold uppercase tracking-wider leading-relaxed">
                          Core Suggestion: {insight.tip}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Holographic Biometric ID */}
          <div className="p-8 rounded-[40px] bg-black/40 border-2 border-white/5 relative overflow-hidden group shadow-2xl mt-auto">
            <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-0.5 bg-primary/20 animate-scanline pointer-events-none" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <Box className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-xs font-semibold text-primary uppercase tracking-[0.4em]">Biometric ID</span>
              </div>
              <span className="text-[10px] font-semibold text-white/20 font-mono tracking-widest">TRADER_VAL_8820</span>
            </div>

            <div className="flex items-center gap-8 relative z-10">
              <div className="relative w-24 h-24 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                <div className="absolute inset-0 bg-primary/20 blur-[50px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <svg className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]">
                  <circle cx="48" cy="48" r="42" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
                  <motion.circle 
                    cx="48" cy="48" r="42" 
                    stroke="#6366f1" strokeWidth="6" 
                    strokeDasharray="263.8"
                    initial={{ strokeDashoffset: 263.8 }}
                    animate={{ strokeDashoffset: 263.8 * (1 - 0.78) }} 
                    transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
                    fill="transparent" 
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                  <span className="text-3xl font-semibold text-white tracking-tighter">78</span>
                  <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] -mt-1">INDEX</span>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="space-y-1">
                  <span className="text-sm font-semibold text-white uppercase tracking-widest">Neural Stability</span>
                  <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                    Safe Zone reached
                  </p>
                </div>
                
                <div className="flex gap-1.5 pt-2">
                  {[0.4, 0.7, 1, 0.6, 0.8, 0.3, 0.9].map((s, i) => (
                    <div key={i} className={cn(
                      "w-1.5 h-5 bg-white/5 rounded-full relative overflow-hidden",
                      i > 4 ? "hidden xl:block" : ""
                    )}>
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${s * 100}%` }}
                        transition={{ delay: 1.5 + i * 0.1, duration: 1, ease: "circOut" }}
                        className="absolute bottom-0 left-0 w-full bg-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-white/10 uppercase font-mono tracking-widest text-[9px]">
              <span>Latency_Sync: Optimized</span>
              <span>Enc: AES-256V4</span>
            </div>
          </div>
        </div>

        {/* System Status HUD */}
        <div className="h-24 glass-ultra rounded-4xl border-white/5 flex items-center justify-between px-10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-linear-to-r from-emerald-500/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
              <Cpu className="w-5 h-5 text-white/30" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.4em]">Latency_Matrix</span>
              <span className="text-sm font-semibold text-emerald-400 font-mono tracking-tight transition-all group-hover:translate-x-1">14ms QUANTUM</span>
            </div>
          </div>
          <div className="flex items-center gap-4 relative z-10 text-right">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.4em]">Neural_Load</span>
              <span className="text-sm font-semibold text-indigo-400 font-mono tracking-tight transition-all group-hover:-translate-x-1">4.2% IDLE_CORE</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
              <Activity className="w-5 h-5 text-indigo-400/50" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* RIGHT PANEL: Holographic Communicator */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 glass-ultra rounded-[48px] border-white/5 flex flex-col overflow-hidden relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]"
      >
        <div className="absolute top-0 right-0 w-150 h-150 bg-primary/5 blur-[150px] rounded-full pointer-events-none -mr-60 -mt-60 z-0" />
        
        {/* Chat Header */}
        <div className="h-28 border-b border-white/5 flex items-center justify-between px-12 relative z-10 backdrop-blur-3xl bg-black/20">
          <div className="flex items-center gap-8">
            <div className="relative group/avatar">
              <div className="absolute -inset-2 bg-primary/20 rounded-3xl blur-xl opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-700" />
              <div className="w-16 h-16 rounded-[22px] bg-linear-to-tr from-primary via-indigo-400 to-cyan-400 p-[1.5px] relative z-10">
                <div className="w-full h-full rounded-[21px] bg-bg-base flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-scanlines opacity-10 animate-scanline" />
                  <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-4 border-black z-20 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-semibold text-white uppercase tracking-tight">Intelligence Core</h2>
              <div className="inline-flex items-center gap-3 px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Quant_Sync v8.2 Tactical</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex flex-col text-right hidden xl:flex">
              <span className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.4em]">Active Engine</span>
              <span className="text-sm font-semibold text-white/50 font-jet-mono uppercase tracking-widest">Claude_3.5_Quantum</span>
            </div>
            <div className="w-px h-12 bg-white/5" />
            <Button variant="ghost" size="icon" className="w-14 h-14 rounded-2xl bg-white/3 border border-white/10 hover:border-primary/40 hover:bg-primary/5 text-white/20 hover:text-primary transition-all duration-500 group">
              <History className="w-6 h-6 group-hover:rotate-[-10deg] transition-transform" />
            </Button>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto px-12 py-12 space-y-16 no-scrollbar relative z-10">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 30, scale: 0.98, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                className={cn(
                  "flex items-start gap-8 max-w-[85%] relative group",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                )}
              >
                {msg.role === 'ai' && (
                  <div className="w-12 h-12 rounded-2xl glass-ultra border-primary/20 flex items-center justify-center shrink-0 shadow-2xl relative overflow-hidden group-hover:scale-110 transition-transform duration-500">
                    <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                    <Sparkles className="w-6 h-6 text-primary relative z-10" />
                  </div>
                )}
                
                <div className={cn(
                  "relative",
                  msg.role === 'user' ? "text-right" : ""
                )}>
                  {msg.role === 'ai' && <div className="absolute -inset-4 bg-primary/10 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />}
                  
                  <div className={cn(
                    "p-8 rounded-[36px] text-[16px] font-medium leading-[1.7] relative shadow-2xl transition-all duration-700",
                    msg.role === 'ai' 
                      ? "bg-white/2 border border-white/10 text-white/80 rounded-tl-none hover:bg-white/4 hover:border-white/20" 
                      : "bg-linear-to-br from-primary to-indigo-600 text-white border border-primary/30 rounded-tr-none hover:shadow-primary/20"
                  )}>
                    {msg.text.split('\n').map((line, i) => {
                      const parts = line.split(/(\$\d+(?:,\d+)*(?:\.\d+)?|\d+(?:\.\d+)?%?)/g);
                      return (
                        <p key={i} className={cn(i > 0 ? "mt-6" : "")}>
                          {parts.map((part, j) => {
                            if (part.match(/(\$\d+(?:,\d+)*(?:\.\d+)?|\d+(?:\.\d+)?%?)/)) {
                              return (
                                <span key={j} className={cn(
                                  "font-jet-mono font-bold tracking-tight mx-0.5 px-1.5 py-0.5 rounded-lg",
                                  msg.role === 'ai' ? "text-primary bg-primary/5" : "text-white bg-black/20"
                                )}>
                                  {part}
                                </span>
                              );
                            }
                            return part;
                          })}
                        </p>
                      );
                    })}
                    
                    {msg.role === 'ai' && (
                      <div className="absolute top-4 right-6 flex gap-1.5 opacity-20">
                        <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                        <div className="w-1 h-1 rounded-full bg-primary animate-pulse delay-75" />
                        <div className="w-1 h-1 rounded-full bg-primary animate-pulse delay-150" />
                      </div>
                    )}
                  </div>
                  
                  <span className={cn(
                    "text-[10px] font-bold text-white/10 uppercase tracking-[0.5em] mt-4 block font-mono",
                    msg.role === 'user' ? "mr-4" : "ml-4"
                  )}>
                    {msg.role === 'ai' ? 'PROTOCOL_TRANSMISSION_SECURED' : 'MANUAL_OVERRIDE_VERIFIED'}
                  </span>
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-5 ml-20"
              >
                <div className="flex gap-2 p-4 rounded-2xl bg-white/3 border border-white/10 shadow-inner">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        scale: [1, 1.4, 1], 
                        opacity: [0.3, 1, 0.3],
                        backgroundColor: i === 1 ? ["#6366f1", "#818cf8", "#6366f1"] : "#6366f1"
                      }}
                      transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                      className="w-2 h-2 rounded-full bg-primary"
                    />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.4em] animate-pulse">Neural_Synthesis_Active...</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* Dynamic Command Center */}
        <div className="p-12 relative z-20 bg-black/20 backdrop-blur-3xl border-t border-white/5">
          {/* Quick Suggestions */}
          <div className="flex gap-4 mb-10 overflow-x-auto no-scrollbar pb-2 group/suggestions">
            {SUGGESTIONS.map((s, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + (i * 0.1) }}
                onClick={() => handleSend(s)}
                className="px-8 py-4 rounded-[22px] bg-white/2 border border-white/10 hover:border-primary/50 text-[11px] font-bold text-white/30 hover:text-white uppercase tracking-[0.2em] transition-all hover:translate-y-[-4px] hover:shadow-[0_10px_30px_rgba(99,102,241,0.1)] active:translate-y-0 whitespace-nowrap"
              >
                {s}
              </motion.button>
            ))}
          </div>

          <div className="relative group p-[2px] rounded-4xl overflow-hidden transition-all duration-700 focus-within:shadow-[0_0_50px_rgba(99,102,241,0.15)]">
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-primary/50 to-transparent group-focus-within:translate-x-full transition-transform duration-1500 ease-in-out -translate-x-full" />
            
            <div className="h-24 flex items-center bg-white/2 border border-white/10 rounded-[30px] px-10 relative z-10 focus-within:bg-white/4 transition-all duration-500 group-focus-within:border-primary/40">
              <input 
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
                placeholder="EXECUTE COMMAND OR QUERY CORE..."
                className="flex-1 bg-transparent outline-none text-[16px] text-white placeholder:text-white/5 font-semibold tracking-tight uppercase"
              />
              <div className="flex items-center gap-10">
                <span className="text-[10px] font-bold text-white/5 font-mono tracking-[0.3em] hidden xl:block uppercase">
                  METADATA_LENGTH: {inputValue.length} {" // "} 500
                </span>
                <Magnetic strength={0.3}>
                  <button 
                    onClick={() => handleSend(inputValue)}
                    disabled={!inputValue.trim()}
                    className="w-14 h-14 rounded-3xl bg-primary hover:bg-indigo-500 disabled:opacity-20 disabled:hover:bg-primary flex items-center justify-center transition-all shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-90 group/btn"
                  >
                    <Send className="w-6 h-6 text-white group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                  </button>
                </Magnetic>
              </div>
            </div>
          </div>
          <div className="flex justify-center mt-6 gap-8">
            <span className="text-[9px] font-bold text-white/5 uppercase tracking-[0.5em]">Neural_Link_Secured</span>
            <span className="text-[9px] font-bold text-white/5 uppercase tracking-[0.5em]">Protocol_v8.42_Alpha</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
