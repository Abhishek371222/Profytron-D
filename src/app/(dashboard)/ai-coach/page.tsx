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
  Cpu
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

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    const newMessage = { id: Date.now().toString(), role: 'user', text };
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
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 p-2">
      {/* LEFT PANEL: Insights Terminal */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-[400px] flex flex-col gap-4"
      >
        <div className="glass-ultra rounded-[28px] border-white/5 p-6 flex-1 overflow-y-auto no-scrollbar space-y-8 relative">
          <div className="absolute inset-0 bg-primary/5 blur-[80px] -z-10 pointer-events-none" />
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Analytics Engine</span>
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic">Tactical Feed</h1>
          </div>

          <div className="space-y-4">
            {INSIGHTS.map((insight, idx) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={cn(
                  "p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all group cursor-pointer relative overflow-hidden",
                  insight.glow
                )}
              >
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex gap-4">
                  <div className={cn("mt-1 shrink-0", insight.color)}>
                    <insight.icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className={cn("text-[11px] font-black uppercase tracking-[0.2em]", insight.color)}>
                      {insight.title}
                    </h4>
                    <p className="text-[13px] text-white/60 font-medium leading-relaxed font-sans">
                      {insight.body}
                    </p>
                    {insight.tip && (
                      <div className="mt-3 py-2 px-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
                        <p className="text-[10px] text-pink-400 font-bold uppercase tracking-tight">
                          Neural Tip: {insight.tip}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Biometric Card */}
          <div className="p-6 rounded-2xl mesh-bg-premium border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/30 rounded-full blur-[60px] -mr-16 -mt-16 opacity-50" />
            <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] animate-hologram">Biometric Sync</span>
                <span className="text-[10px] font-black text-white/20 font-jet-mono italic">TRADER_ID: A-781</span>
            </div>
            <div className="flex items-center gap-6">
                <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="transparent" />
                        <motion.circle 
                            cx="40" cy="40" r="34" 
                            stroke="#6366f1" strokeWidth="6" 
                            strokeDasharray="213.6"
                            initial={{ strokeDashoffset: 213.6 }}
                            animate={{ strokeDashoffset: 213.6 * (1 - 0.78) }} 
                            transition={{ duration: 2, ease: "circOut" }}
                            fill="transparent" 
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-black text-white font-mono">78</span>
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-black text-white uppercase tracking-wider">Alpha State</span>
                    <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-tighter mt-1">High Focus Reached</p>
                    <div className="flex gap-1 mt-4">
                      {[0.4, 0.7, 1, 0.6, 0.8].map((s, i) => (
                        <div key={i} className="w-1 h-3 bg-white/10 rounded-full relative overflow-hidden">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: '100%' }}
                            transition={{ delay: 1 + i * 0.1, duration: 1 }}
                            className="absolute bottom-0 left-0 w-full bg-primary"
                          />
                        </div>
                      ))}
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* System Status HUD */}
        <div className="h-20 glass-ultra rounded-[24px] border-white/5 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white/40" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Latency</span>
              <span className="text-[11px] font-black text-emerald-400 font-mono italic">14ms Quantum</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white/40" />
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Neural Load</span>
              <span className="text-[11px] font-black text-indigo-400 font-mono italic">4.2% IDLE</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* RIGHT PANEL: Holographic Communicator */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 glass-ultra rounded-[32px] border-white/5 flex flex-col overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 blur-[120px] rounded-full point-events-none -mr-40 -mt-20 z-0" />
        
        {/* Chat Header */}
        <div className="h-24 border-b border-white/5 flex items-center justify-between px-10 relative z-10 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-indigo-400 p-[1px]">
                <div className="w-full h-full rounded-2xl bg-bg-base flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-primary animate-pulse" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-bg-base z-20" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">AI Coach Core</h2>
              <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-primary/10 border border-primary/20 w-fit mt-1">
                <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Neural Engine v4.2 Turbo</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col text-right mr-4 hidden md:flex">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Active Model</span>
              <span className="text-[11px] font-black text-white/60">Claude-3.5-Quantum</span>
            </div>
            <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 text-white/40 hover:text-white transition-all">
              <History className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Message HUD Area */}
        <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar relative z-10">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className={cn(
                  "flex items-start gap-6 max-w-[80%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                )}
              >
                {msg.role === 'ai' && (
                  <div className="w-10 h-10 rounded-full glass-ultra border-primary/20 flex items-center justify-center shrink-0 shadow-lg shadow-primary/10">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                )}
                
                <div className={cn(
                  "relative group",
                  msg.role === 'user' ? "text-right" : ""
                )}>
                  {msg.role === 'ai' && <div className="absolute -inset-1 bg-primary/10 blur-[20px] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />}
                  
                  <div className={cn(
                    "p-6 rounded-[24px] text-[15px] font-medium leading-relaxed relative",
                    msg.role === 'ai' 
                      ? "bg-white/[0.03] border border-white/10 text-white/90 rounded-tl-none animate-scanline" 
                      : "mesh-bg-premium text-white border border-primary/20 rounded-tr-none shadow-[40px_0_100px_rgba(99,102,241,0.1)]"
                  )}>
                    {msg.text.split('\n').map((line, i) => {
                      const parts = line.split(/(\$\d+(?:,\d+)*(?:\.\d+)?|\d+(?:\.\d+)?%?)/g);
                      return (
                          <p key={i} className={cn(i > 0 ? "mt-4" : "")}>
                              {parts.map((part, j) => {
                                  if (part.match(/(\$\d+(?:,\d+)*(?:\.\d+)?|\d+(?:\.\d+)?%?)/)) {
                                      return <span key={j} className="font-jet-mono font-black text-primary italic ml-0.5">{part}</span>;
                                  }
                                  return part;
                              })}
                          </p>
                      );
                    })}
                    
                    {msg.role === 'ai' && (
                      <div className="absolute top-2 right-4 flex gap-1 opacity-20">
                        <div className="w-1 h-1 rounded-full bg-primary" />
                        <div className="w-1 h-1 rounded-full bg-primary" />
                      </div>
                    )}
                  </div>
                  
                  <span className={cn(
                    "text-[9px] font-black text-white/10 uppercase tracking-[0.3em] mt-2 block",
                    msg.role === 'user' ? "text-right mr-2" : "ml-2"
                  )}>
                    {msg.role === 'ai' ? 'CORE_RESPONSE_SECURED' : 'DATA_INPUT_TERMINAL'}
                  </span>
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 ml-16"
                >
                  <div className="flex gap-1.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                        className="w-1.5 h-1.5 rounded-full bg-primary"
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic">Synthesizing...</span>
                </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* Dynamic Command Center */}
        <div className="p-10 relative z-20">
          {/* Quick Suggestions */}
          <div className="flex gap-3 mb-8 overflow-x-auto no-scrollbar pb-2">
            {SUGGESTIONS.map((s, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + (i * 0.1) }}
                onClick={() => handleSend(s)}
                className="px-6 py-3 rounded-2xl glass-ultra border-white/5 hover:border-primary/40 text-[11px] font-black text-white/40 hover:text-white uppercase tracking-widest transition-all hover:translate-y-[-2px] active:translate-y-0"
              >
                {s}
              </motion.button>
            ))}
          </div>

          <div className="relative group p-[2px] rounded-[24px] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/50 to-transparent group-focus-within:translate-x-full transition-transform duration-1000 ease-in-out -translate-x-full" />
            
            <div className="h-20 flex items-center bg-white/[0.03] border border-white/10 rounded-[22px] px-8 relative z-10 focus-within:bg-white/[0.05] transition-all group-focus-within:border-primary/30">
                <input 
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
                    placeholder="ENTER COMMAND OR ASK COACH..."
                    className="flex-1 bg-transparent outline-none text-[15px] text-white placeholder:text-white/10 font-bold tracking-tight uppercase"
                />
                <div className="flex items-center gap-6">
                    <span className="text-[10px] font-black text-white/10 font-mono tracking-widest hidden md:block">
                      {inputValue.length} // 500
                    </span>
                    <Magnetic strength={0.2}>
                      <button 
                          onClick={() => handleSend(inputValue)}
                          disabled={!inputValue.trim()}
                          className="w-12 h-12 rounded-2xl bg-primary hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-primary flex items-center justify-center transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)] active:scale-95 group/btn"
                      >
                          <Send className="w-5 h-5 text-white group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                      </button>
                    </Magnetic>
                </div>
            </div>
          </div>
          <div className="flex justify-center mt-4 text-[9px] font-black text-white/10 uppercase tracking-[0.5em]">
            Neural Interface Secured · E2E Encrypted · QuantCore 8.0
          </div>
        </div>
      </motion.div>
    </div>
  );
}
