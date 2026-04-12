'use client';

import React from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
 Wallet, 
 ArrowUpRight, 
 ArrowDownRight, 
 Download, 
 Filter, 
 Search, 
 CreditCard,
 History,
 TrendingUp,
 Banknote,
 Landmark,
 CheckCircle,
 Clock,
 Circle,
 X,
 Plus,
 ArrowRight,
 ShieldCheck,
 Zap,
 Cpu,
 Sparkles,
 ChevronRight,
 MessageSquare,
 Activity,
 TrendingDown
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Magnetic } from '@/components/ui/Interactions';

// Types
type Transaction = {
 id: string;
 date: string;
 type: 'DEPOSIT' | 'WITHDRAWAL' | 'COMMISSION' | 'SUBSCRIPTION' | 'MARKETPLACE' | 'REFUND';
 description: string;
 amount: number;
 status: 'CONFIRMED' | 'PENDING' | 'FAILED' | 'REVERSED';
 reference: string;
};

const TRANSACTIONS: Transaction[] = [
 { id: '1', date: '2026-04-10 14:30', type: 'DEPOSIT', description: 'Institutional Liquidity Injection', amount: 45000, status: 'CONFIRMED', reference: 'NCR_849204859' },
 { id: '2', date: '2026-04-09 11:15', type: 'SUBSCRIPTION', description: 'Apex Neural Engine Monthly', amount: -2999, status: 'CONFIRMED', reference: 'SUB_849203921' },
 { id: '3', date: '2026-04-08 22:45', type: 'COMMISSION', description: 'MomentumPro Alpha Share', amount: 8400, status: 'CONFIRMED', reference: 'COM_849194820' },
 { id: '4', date: '2026-04-07 10:00', type: 'WITHDRAWAL', description: 'Settlement to Bank ****2941', amount: -12000, status: 'PENDING', reference: 'WDL_849184712' },
 { id: '5', date: '2026-04-05 16:20', type: 'MARKETPLACE', description: 'AlphaTrend L4 Module', amount: -4500, status: 'CONFIRMED', reference: 'MKT_849174621' },
];

const TABS = [
 { id: 'overview', label: 'Treasury Overview', icon: Wallet },
 { id: 'deposit', label: 'Deposit Protocol', icon: Plus },
 { id: 'withdraw', label: 'Withdrawal Gateway', icon: ArrowUpRight },
 { id: 'history', label: 'Event Ledger', icon: History },
];

export default function WalletPage() {
 const [activeTab, setActiveTab] = React.useState('overview');
 const [depositAmount, setDepositAmount] = React.useState('');
 const [withdrawAmount, setWithdrawAmount] = React.useState('');
 const [isProcessing, setIsProcessing] = React.useState(false);

 // Perspective Effect for balance card
 const mouseX = useMotionValue(0);
 const mouseY = useMotionValue(0);
 const springConfig = { damping: 30, stiffness: 200 };
 const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), springConfig);
 const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), springConfig);

 const handleMouseMove = (e: React.MouseEvent) => {
 const rect = e.currentTarget.getBoundingClientRect();
 const x = (e.clientX - rect.left) / rect.width - 0.5;
 const y = (e.clientY - rect.top) / rect.height - 0.5;
 mouseX.set(x);
 mouseY.set(y);
 };

 const handleMouseLeave = () => {
 mouseX.set(0);
 mouseY.set(0);
 };

 const handleAction = () => {
 setIsProcessing(true);
 setTimeout(() => {
 setIsProcessing(false);
 setDepositAmount('');
 setWithdrawAmount('');
 setActiveTab('overview');
 }, 2000);
 };

 return (
 <div className="space-y-16 pb-32 relative min-h-screen">
 <div className="absolute top-0 right-0 w-200 h-200 bg-p/5 blur-[160px] rounded-full -z-10 pointer-events-none" />
 <div className="absolute inset-0 bg-scanlines opacity-[0.02] pointer-events-none" />
 
 {/* HUD Institutional Header */}
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b-2 border-white/5 pb-12 relative">
 <div className="absolute bottom-0 left-0 w-32 h-0.5 bg-p shadow-[0_0_15px_#6366f1]" />
 <div className="space-y-6">
 <div className="flex items-center gap-4">
 <div className="w-3 h-3 rounded-full bg-p animate-pulse shadow-[0_0_20px_#6366f1]" />
 <span className="text-sm font-semibold text-p uppercase tracking-[0.6em]">Vault_Secure_Terminal_v4.2</span>
 </div>
 <h1 className="text-6xl font-semibold text-white uppercase tracking-tight leading-tight">Treasury_Vault</h1>
 <p className="text-sm text-white/30 font-semibold uppercase tracking-[0.3em]">Secure_Institutional_Liquidity_&_Asset_Custodianship_Protocol</p>
 </div>
 
 <div className="flex items-center gap-2 bg-white/5 p-2.5 rounded-4xl border-2 border-white/10 backdrop-blur-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
 {TABS.map((tab) => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={cn(
"px-8 py-4 rounded-3xl text-sm font-semibold uppercase tracking-[0.3em] transition-all duration-700 flex items-center gap-3",
 activeTab === tab.id ?"bg-p text-white shadow-[0_0_25px_rgba(99,102,241,0.5)] scale-105" :"text-white/20 hover:text-white/50 hover:bg-white/5"
 )}
 >
 <tab.icon className={cn("w-4.5 h-4.5", activeTab === tab.id ?"text-white" :"text-white/20")} />
 {tab.label}
 </button>
 ))}
 </div>
 </div>

 <AnimatePresence mode="wait">
 {activeTab === 'overview' && (
 <motion.div 
 key="overview"
 initial={{ opacity: 0, y: 30, filter: 'blur(15px)' }}
 animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
 exit={{ opacity: 0, y: -30, filter: 'blur(15px)' }}
 transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
 className="space-y-20"
 >
 {/* 3D PERSPECTIVE CINEMATIC BALANCE CORE */}
 <div 
 className="perspective-2000"
 onMouseMove={handleMouseMove}
 onMouseLeave={handleMouseLeave}
 >
 <motion.div 
 style={{ rotateX, rotateY }}
 className="relative group"
 >
 <div className="absolute -inset-2 bg-linear-to-r from-p/30 via-indigo-500/30 to-p/30 rounded-[64px] blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
 <Card className="p-20 glass-ultra border-2 border-white/10 rounded-[60px] overflow-hidden relative group shadow-[0_60px_120px_rgba(0,0,0,0.9)] border-p/20">
 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(99,102,241,0.2),transparent_60%)] pointer-events-none" />
 <div className="absolute inset-0 bg-scanlines opacity-[0.05] pointer-events-none" />
 <div className="absolute top-10 left-10 w-32 h-32 bg-p/20 rounded-full blur-[100px] opacity-40 animate-pulse" />
 
 <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-24 relative z-10">
 <div className="space-y-20">
 <div className="space-y-10">
 <div className="flex items-center gap-5">
 <span className="text-[12px] font-semibold text-p/40 uppercase tracking-[1em]">Aggregated_Liquidity_Module</span>
 <div className="h-px flex-1 bg-linear-to-r from-p/20 to-transparent" />
 </div>
 <div className="flex items-center gap-8">
 <div className="w-24 h-24 rounded-4xl bg-p/10 border-2 border-p/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-1000">
 <Wallet className="w-12 h-12 text-p shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
 </div>
 <div className="flex items-baseline gap-8">
 <span className="text-5xl font-semibold text-p opacity-40 leading-tight">$</span>
 <h2 className="text-[7rem] md:text-[8rem] font-semibold text-white tracking-tighter tabular-nums drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] leading-none -ml-4">
 1,24,580<span className="opacity-10">.00</span>
 </h2>
 </div>
 </div>
 
 <div className="flex items-center gap-16 pt-16 border-t-2 border-white/5">
 <div className="flex flex-col gap-4">
 <span className="text-sm font-semibold text-white/20 uppercase tracking-[0.4em]">INSTITUTIONAL_RESERVE</span>
 <div className="flex items-center gap-4 group/metric">
 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_20px_#10b981] animate-pulse" />
 <span className="text-4xl font-semibold text-emerald-400 tracking-tight group-hover/metric:scale-110 transition-transform">$98,240.50</span>
 </div>
 </div>
 <div className="w-[2px] h-20 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
 <div className="flex flex-col gap-4">
 <span className="text-sm font-semibold text-white/20 uppercase tracking-[0.4em]">PENDING_SETTLEMENT</span>
 <div className="flex items-center gap-4 group/metric">
 <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_20px_#f59e0b]" />
 <span className="text-4xl font-semibold text-amber-500 tracking-tight group-hover/metric:scale-110 transition-transform">$26,339.50</span>
 </div>
 </div>
 </div>
 </div>

 <div className="flex gap-8">
 <Magnetic strength={0.2}>
 <motion.button 
 whileHover={{ scale: 1.05, y: -5 }}
 whileTap={{ scale: 0.95 }}
 onClick={() => setActiveTab('deposit')}
 className="h-24 px-16 bg-p text-white font-semibold uppercase tracking-[0.5em] rounded-4xl shadow-[0_0_60px_rgba(99,102,241,0.5)] transition-all group overflow-hidden relative text-lg"
 >
 <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
 <div className="absolute inset-0 bg-scanlines opacity-20" />
 <div className="flex items-center gap-6 relative z-10">
 <Plus className="w-7 h-7 group-hover:rotate-180 transition-transform duration-1000" /> 
 Deposit_Protocol
 </div>
 </motion.button>
 </Magnetic>
 <Magnetic strength={0.1}>
 <motion.button 
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 onClick={() => setActiveTab('withdraw')}
 className="h-24 px-16 glass-ultra border-2 border-white/10 hover:bg-white/5 text-white/50 font-semibold uppercase tracking-[0.5em] rounded-4xl text-lg hover:text-white transition-all"
 >
 Withdrawal_Gateway
 </motion.button>
 </Magnetic>
 </div>
 </div>

 <div className="flex flex-col justify-between py-6 border-l-2 border-white/5 pl-24 bg-black/20 rounded-[48px]">
 <div className="space-y-10">
 <div className="flex items-center justify-between">
 <span className="text-[13px] font-semibold text-white/20 uppercase tracking-[0.5em]">Vault_Volume_Velocity</span>
 <span className="text-sm font-semibold text-emerald-400 uppercase tracking-[0.3em] bg-emerald-500/10 px-4 py-2 rounded-2xl border-2 border-emerald-500/20">+14.2%_EPOCH_GROWTH</span>
 </div>
 <div className="h-[280px] w-full flex items-end gap-3 bg-black/40 rounded-[40px] border-2 border-white/5 p-10 relative overflow-hidden group/chart shadow-inner">
 <div className="absolute inset-0 bg-scanlines opacity-[0.03]" />
 {[35, 42, 38, 55, 47, 62, 58, 65, 70, 68, 82, 75, 85, 90, 88].slice(-14).map((v, i) => (
 <motion.div 
 key={i}
 initial={{ height: 0 }}
 animate={{ height: `${v}%` }}
 transition={{ delay: 1 + (i * 0.08), ease: [0.22, 1, 0.36, 1], duration: 1.5 }}
 className={cn(
"flex-1 rounded-2xl transition-all relative group/bar",
 i === 13 ?"bg-p shadow-[0_0_30px_rgba(99,102,241,0.6)]" :"bg-white/5 hover:bg-white/20"
 )}
 >
 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 px-4 py-2 bg-p text-white text-xs font-semibold rounded-xl opacity-0 group-hover/bar:opacity-100 transition-all pointer-events-none shadow-[0_20px_40px_rgba(0,0,0,0.8)] scale-75 group-hover/bar:scale-100 border border-white/20 z-50 whitespace-nowrap">
 ${(v * 1200).toLocaleString()}
 </div>
 </motion.div>
 ))}
 </div>
 </div>

 <div className="grid grid-cols-2 gap-16 pt-16">
 <div className="space-y-4">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
 <TrendingUp className="w-5 h-5 text-emerald-400" />
 </div>
 <span className="text-3xl font-semibold text-white tracking-tight group-hover:scale-110 transition-transform">+$45,240</span>
 </div>
 <p className="text-xs font-semibold text-white/20 uppercase tracking-[0.4em]">INFLOW_TOTAL_PERIOD</p>
 </div>
 <div className="space-y-4">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
 <TrendingDown className="w-5 h-5 text-red-500" />
 </div>
 <span className="text-3xl font-semibold text-white tracking-tight group-hover:scale-110 transition-transform">-$12,400</span>
 </div>
 <p className="text-xs font-semibold text-white/20 uppercase tracking-[0.4em]">OUTFLOW_TOTAL_PERIOD</p>
 </div>
 </div>
 </div>
 </div>
 </Card>
 </motion.div>
 </div>

 {/* High-fidelity Quick Stats Grid */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
 {[
 { label: 'Network Hash Rate', value: '42.4 GH/s', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
 { label: 'Gas Protocol Offset', value: '0.00%', icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
 { label: 'Staking Multiplier', value: 'x1.84', icon: Sparkles, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
 { label: 'Epoch Stability', value: '99.9%', icon: Activity, color: 'text-p', bg: 'bg-p/10', border: 'border-p/20' },
 ].map((stat, i) => (
 <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + (i * 0.1) }}>
 <Card className="p-10 border-2 border-white/5 bg-black/40 backdrop-blur-3xl rounded-[40px] group hover:border-white/20 transition-all duration-1000 relative overflow-hidden shadow-2xl">
 <div className="absolute inset-0 bg-scanlines opacity-[0.02]" />
 <div className="absolute top-0 right-0 w-32 h-32 bg-white/2 rounded-full blur-[60px] -mr-16 -mt-16 group-hover:bg-white/5 transition-all duration-1000" />
 <div className="flex items-center gap-8 relative z-10">
 <div className={cn("w-16 h-16 rounded-[22px] flex items-center justify-center border-2 shadow-2xl group-hover:scale-125 group-hover:rotate-[15deg] transition-all duration-1000", stat.bg, stat.border)}>
 <stat.icon className={cn("w-8 h-8 drop-shadow-[0_0_10px_currentColor]", stat.color)} />
 </div>
 <div>
 <p className="text-sm font-semibold text-white/20 uppercase tracking-[0.4em] leading-tight">{stat.label}</p>
 <h4 className="text-2xl font-semibold text-white mt-3 tracking-tight leading-tight">{stat.value}</h4>
 </div>
 </div>
 </Card>
 </motion.div>
 ))}
 </div>
 </motion.div>
 )}

 {/* Override activeTab deposit to be high-fidelity hardware terminal */}
 {activeTab === 'deposit' && (
 <motion.div 
 key="deposit"
 initial={{ opacity: 0, scale: 0.9, filter: 'blur(15px)' }}
 animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
 exit={{ opacity: 0, scale: 0.9, filter: 'blur(15px)' }}
 transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
 className="max-w-[900px] mx-auto pt-16"
 >
 <Card className="p-20 glass-ultra border-2 border-white/10 rounded-[64px] shadow-[0_60px_120px_rgba(0,0,0,0.9)] relative overflow-hidden group border-p/20">
 <div className="absolute top-0 left-0 w-full h-0.75 bg-linear-to-r from-transparent via-p to-transparent opacity-60 animate-scanline" />
 <div className="absolute inset-0 bg-scanlines opacity-[0.05] pointer-events-none" />
 
 <div className="space-y-20 relative z-10">
 <div className="flex items-center justify-between">
 <div className="space-y-4">
 <h3 className="text-6xl font-semibold text-white uppercase tracking-tight leading-tight">Liquidity_Influx_Entry</h3>
 <p className="text-sm text-white/30 font-semibold uppercase tracking-[0.8em]">SECURE_PROTOCOL_QUANTUM_L3_NODE_v9.1</p>
 </div>
 <div className="w-24 h-24 rounded-4xl bg-p/10 border-2 border-p/20 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.3)] group-hover:scale-110 transition-transform duration-1000">
 <Plus className="w-12 h-12 text-p animate-pulse" />
 </div>
 </div>

 <div className="space-y-12">
 <div className="relative group/input">
 <div className="absolute -inset-4 bg-p/10 blur-[100px] opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-1000" />
 <div className="relative h-40 flex items-center bg-white/3 border-2 border-white/5 rounded-[44px] px-20 group-focus-within/input:border-p/40 transition-all duration-700 group-focus-within/input:bg-white/8 shadow-2xl">
 <span className="text-7xl font-semibold text-p/30 mr-12 mt-4">$</span>
 <input 
 type="number"
 value={depositAmount}
 onChange={(e) => setDepositAmount(e.target.value)}
 placeholder="0,000.00"
 className="bg-transparent outline-none flex-1 text-8xl font-semibold text-white placeholder:text-white/5 tabular-nums tracking-tight mt-4"
 />
 <div className="flex flex-col items-end gap-2 shrink-0">
 <span className="text-sm font-semibold text-white/10 uppercase tracking-[0.4em]">ENTRY_MODE</span>
 <div className="w-16 h-1.5 rounded-full bg-p/20 overflow-hidden">
 <motion.div animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 2, ease:"linear" }} className="w-full h-full bg-p shadow-[0_0_10px_#6366f1]" />
 </div>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-4 gap-6">
 {[5000, 10000, 50000, 100000].map((amt) => (
 <motion.button
 whileHover={{ scale: 1.05, y: -5 }}
 whileTap={{ scale: 0.95 }}
 key={amt}
 onClick={() => setDepositAmount(amt.toString())}
 className="h-20 rounded-[28px] bg-white/3 border-2 border-white/5 hover:border-p/50 hover:bg-p/5 text-sm font-semibold text-white/20 hover:text-white transition-all duration-500 uppercase tracking-[0.4em]"
 >
 +${amt.toLocaleString()}
 </motion.button>
 ))}
 </div>
 </div>

 <div className="space-y-10">
 <span className="text-sm font-semibold text-white/20 uppercase tracking-[0.8em] ml-4">Gateway_Network_Protocol_Selection</span>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
 {[
 { id: 'rapid', name: 'Rapid Alpha Node', desc: 'INSTANT_FLUX · 0%_FEES', icon: Zap, color: 'text-p', active: true },
 { id: 'bank', name: 'Institution Bank Relay', desc: '1-3_EPOCHS · NO_LIMIT', icon: Landmark, color: 'bg-white/5', active: false },
 ].map((net) => (
 <button 
 key={net.id}
 className={cn(
"p-12 rounded-[52px] relative transition-all duration-1000 text-left group overflow-hidden border-2",
 net.active ?"bg-p/8 border-p/40 shadow-[0_40px_80px_rgba(0,0,0,0.5)]" :"bg-white/2 border-white/5 hover:border-white/20"
 )}
 >
 <div className={cn("absolute top-8 right-8", net.active ?"block" :"opacity-0 group-hover:opacity-100")}>
 <CheckCircle className={cn("w-8 h-8", net.active ?"text-p" :"text-white/20")} />
 </div>
 <div className="space-y-8 relative z-10">
 <div className={cn("w-20 h-20 rounded-[28px] flex items-center justify-center border-2", net.active ?"bg-p/20 border-p/30 shadow-[0_0_30px_rgba(99,102,241,0.3)]" :"bg-white/5 border-white/10")}>
 <net.icon className={cn("w-10 h-10", net.active ?"text-p" :"text-white/20")} />
 </div>
 <div className="space-y-3">
 <p className="text-2xl font-semibold text-white uppercase tracking-tight leading-tight">{net.name}</p>
 <p className={cn("text-sm font-semibold uppercase tracking-[0.5em]", net.active ?"text-p" :"text-white/20")}>{net.desc}</p>
 </div>
 </div>
 </button>
 ))}
 </div>
 </div>

 <div className="pt-20">
 <Magnetic strength={0.1}>
 <motion.button 
 whileHover={{ scale: 1.02, y: -5 }}
 whileTap={{ scale: 0.98 }}
 className={cn(
"w-full h-32 rounded-[44px] text-white font-semibold uppercase tracking-[0.8em] text-2xl shadow-[0_40px_100px_rgba(99,102,241,0.5)] relative transition-all duration-1000 overflow-hidden",
 isProcessing ?"bg-p/50 pointer-events-none" :"bg-p hover:bg-indigo-500"
 )}
 onClick={handleAction}
 >
 <div className="absolute inset-0 bg-scanlines opacity-20" />
 {isProcessing ? (
 <div className="flex items-center justify-center gap-10">
 <div className="w-12 h-12 border-8 border-white/10 border-t-white rounded-full animate-spin" />
 <span className="tracking-[1em]">ENCRYPTING_LIQUIDITY_CORE...</span>
 </div>
 ) : (
"EXECUTE_DEPOSIT_PROTOCOL_SYNC"
 )}
 </motion.button>
 </Magnetic>
 </div>

 <div className="flex items-center justify-center gap-6 text-sm font-semibold text-white/5 uppercase tracking-[0.8em] pt-6">
 <ShieldCheck className="w-6 h-6 text-p opacity-40 animate-pulse" />
 QuantVault_Institutional_Military_Grade_Security_Verified
 </div>
 </div>
 </Card>
 </motion.div>
 )}

 {/* Override activeTab withdraw to be high-fidelity hardware terminal */}
 {activeTab === 'withdraw' && (
 <motion.div 
 key="withdraw"
 initial={{ opacity: 0, scale: 0.9, filter: 'blur(15px)' }}
 animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
 exit={{ opacity: 0, scale: 0.9, filter: 'blur(15px)' }}
 transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
 className="max-w-[900px] mx-auto pt-16"
 >
 <Card className="p-20 glass-ultra border-2 border-white/10 rounded-[64px] shadow-[0_60px_120px_rgba(0,0,0,0.9)] relative overflow-hidden group border-amber-500/20">
 <div className="absolute top-0 left-0 w-full h-0.75 bg-linear-to-r from-transparent via-amber-500 to-transparent opacity-60 animate-scanline" />
 <div className="absolute inset-0 bg-scanlines opacity-[0.05] pointer-events-none" />
 
 <div className="space-y-20 relative z-10">
 <div className="flex items-center justify-between">
 <div className="space-y-4">
 <h3 className="text-6xl font-semibold text-white uppercase tracking-tight leading-tight">Liquidity_Outflux</h3>
 <p className="text-sm text-white/30 font-semibold uppercase tracking-[0.8em]">WITHDRAWAL_GATEWAY_NODE_v1.4</p>
 </div>
 <div className="w-24 h-24 rounded-4xl bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.3)] group-hover:scale-110 transition-transform duration-1000">
 <ArrowUpRight className="w-12 h-12 text-amber-500 animate-pulse" />
 </div>
 </div>

 <div className="space-y-12">
 <div className="relative group/input">
 <div className="absolute -inset-4 bg-amber-500/10 blur-[100px] opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-1000" />
 <div className="relative h-40 flex items-center bg-white/3 border-2 border-white/5 rounded-[44px] px-20 group-focus-within/input:border-amber-500/40 transition-all duration-700 group-focus-within/input:bg-white/8 shadow-2xl">
 <span className="text-7xl font-semibold text-amber-500/30 mr-12 mt-4">$</span>
 <input 
 type="number"
 value={withdrawAmount}
 onChange={(e) => setWithdrawAmount(e.target.value)}
 placeholder="0,000.00"
 className="bg-transparent outline-none flex-1 text-8xl font-semibold text-white placeholder:text-white/5 tabular-nums tracking-tight mt-4"
 />
 <div className="flex flex-col items-end gap-2 shrink-0">
 <span className="text-sm font-semibold text-white/10 uppercase tracking-[0.4em]">OUTFLUX_MODE</span>
 <div className="w-16 h-1.5 rounded-full bg-amber-500/20 overflow-hidden">
 <motion.div animate={{ x: ['100%', '-100%'] }} transition={{ repeat: Infinity, duration: 2, ease:"linear" }} className="w-full h-full bg-amber-500 shadow-[0_0_10px_#f59e0b]" />
 </div>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-4 gap-6">
 {[1000, 5000, 10000, 25000].map((amt) => (
 <motion.button
 whileHover={{ scale: 1.05, y: -5 }}
 whileTap={{ scale: 0.95 }}
 key={amt}
 onClick={() => setWithdrawAmount(amt.toString())}
 className="h-20 rounded-[28px] bg-white/3 border-2 border-white/5 hover:border-amber-500/50 hover:bg-amber-500/5 text-sm font-semibold text-white/20 hover:text-white transition-all duration-500 uppercase tracking-[0.4em]"
 >
 -${amt.toLocaleString()}
 </motion.button>
 ))}
 </div>
 </div>

 <div className="space-y-10">
 <span className="text-sm font-semibold text-white/20 uppercase tracking-[0.8em] ml-4">Target_Settlement_Network</span>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
 {[
 { id: 'swift', name: 'SWIFT International', desc: '1-3_EPOCHS · INSTITUTIONAL', icon: Landmark, color: 'text-white', active: true },
 { id: 'crypto', name: 'Cold Storage Vault', desc: 'INSTANT · MULTI_SIG_VERIFIED', icon: Wallet, color: 'text-amber-500', active: false },
 ].map((net) => (
 <button 
 key={net.id}
 className={cn(
"p-12 rounded-[52px] relative transition-all duration-1000 text-left group overflow-hidden border-2",
 net.active ?"bg-amber-500/8 border-amber-500/40 shadow-[0_40px_80px_rgba(0,0,0,0.5)]" :"bg-white/2 border-white/5 hover:border-white/20"
 )}
 >
 <div className={cn("absolute top-8 right-8", net.active ?"block" :"opacity-0 group-hover:opacity-100")}>
 <CheckCircle className={cn("w-8 h-8", net.active ?"text-amber-500" :"text-white/20")} />
 </div>
 <div className="space-y-8 relative z-10">
 <div className={cn("w-20 h-20 rounded-[28px] flex items-center justify-center border-2", net.active ?"bg-amber-500/20 border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.3)]" :"bg-white/5 border-white/10")}>
 <net.icon className={cn("w-10 h-10", net.active ?"text-amber-500" :"text-white/20")} />
 </div>
 <div className="space-y-3">
 <p className="text-2xl font-semibold text-white uppercase tracking-tight leading-tight">{net.name}</p>
 <p className={cn("text-sm font-semibold uppercase tracking-[0.5em]", net.active ?"text-amber-500" :"text-white/20")}>{net.desc}</p>
 </div>
 </div>
 </button>
 ))}
 </div>
 </div>

 <div className="pt-20">
 <Magnetic strength={0.1}>
 <motion.button 
 whileHover={{ scale: 1.02, y: -5 }}
 whileTap={{ scale: 0.98 }}
 className={cn(
"w-full h-32 rounded-[44px] text-white font-semibold uppercase tracking-[0.8em] text-2xl shadow-[0_40px_100px_rgba(245,158,11,0.4)] relative transition-all duration-1000 overflow-hidden",
 isProcessing ?"bg-amber-500/50 pointer-events-none" :"bg-amber-500 hover:bg-amber-400 text-black"
 )}
 onClick={handleAction}
 >
 <div className="absolute inset-0 bg-scanlines opacity-20" />
 {isProcessing ? (
 <div className="flex items-center justify-center gap-10">
 <div className="w-12 h-12 border-8 border-black/10 border-t-black rounded-full animate-spin" />
 <span className="tracking-[1em] text-black">AUTHORIZING_OUTFLUX...</span>
 </div>
 ) : (
"AUTHORIZE_WITHDRAWAL_PROTOCOL"
 )}
 </motion.button>
 </Magnetic>
 </div>

 <div className="flex items-center justify-center gap-6 text-sm font-semibold text-white/5 uppercase tracking-[0.8em] pt-6">
 <ShieldCheck className="w-6 h-6 text-amber-500 opacity-40 animate-pulse" />
 Subject_To_Cold_Storage_Clearance_And_2FA
 </div>
 </div>
 </Card>
 </motion.div>
 )}

 {/* Override activeTab history to be high-density audit terminal */}
 {activeTab === 'history' && (
 <motion.div 
 key="history"
 initial={{ opacity: 0, y: 40, filter: 'blur(20px)' }}
 animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
 exit={{ opacity: 0, y: -40, filter: 'blur(20px)' }}
 transition={{ duration: 0.8 }}
 className="space-y-12"
 >
 <div className="flex items-center justify-between px-4">
 <div className="space-y-4">
 <h3 className="text-4xl font-semibold text-white uppercase tracking-tight leading-tight">Global_Event_Ledger</h3>
 <p className="text-sm text-white/20 font-semibold uppercase tracking-[0.8em]">Audit_Trail_Protocol_v84.0_RECURSIVE</p>
 </div>
 <div className="flex gap-6 items-center">
 <div className="relative group">
 <div className="absolute inset-0 bg-p/20 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-1000" />
 <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-p transition-colors" />
 <input className="h-16 w-80 bg-white/3 border-2 border-white/5 rounded-3xl pl-16 pr-8 text-sm font-semibold uppercase tracking-widest text-white outline-none focus:border-p/40 transition-all duration-700" placeholder="SEARCH_REFERENCE_HASH..." />
 </div>
 <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="h-16 w-16 rounded-3xl glass-ultra border-2 border-white/5 text-white/20 hover:text-white flex items-center justify-center transition-all">
 <Filter className="w-7 h-7" />
 </motion.button>
 </div>
 </div>

 <Card className="glass-ultra border-2 border-white/10 rounded-[60px] overflow-hidden shadow-[0_60px_120px_rgba(0,0,0,0.8)] border-p/10">
 <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none" />
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="border-b-2 border-white/5 bg-white/4">
 <th className="px-12 py-6 text-[10px] font-bold text-white/40 uppercase tracking-[0.6em]">TAMPER_MARK</th>
 <th className="px-12 py-6 text-[10px] font-bold text-white/40 uppercase tracking-[0.6em]">EXEC_PROTOCOL</th>
 <th className="px-12 py-6 text-[10px] font-bold text-white/40 uppercase tracking-[0.6em]">INTELLIGENCE_METRIC</th>
 <th className="px-12 py-6 text-[10px] font-bold text-white/40 uppercase tracking-[0.6em] text-right">LIQUIDITY_QUANT</th>
 <th className="px-12 py-6 text-[10px] font-bold text-white/40 uppercase tracking-[0.6em] text-center">SYSTEM_STATE</th>
 </tr>
 </thead>
 <tbody className="divide-y-2 divide-white/3">
 {TRANSACTIONS.map((tx, idx) => (
 <motion.tr 
 key={tx.id}
 initial={{ opacity: 0, x: -30 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
 className="group hover:bg-white/7 transition-all duration-700 cursor-crosshair h-[100px]"
 >
 <td className="px-12 py-6 text-[15px] font-semibold text-white/30 font-jet-mono group-hover:text-white transition-colors duration-700">{tx.date}</td>
 <td className="px-12 py-6">
 <span className={cn(
"px-6 py-2.5 rounded-[18px] text-sm font-semibold uppercase tracking-[0.3em] border-2 shadow-2xl transition-all duration-700 group-hover:scale-110 group-hover:rotate-2 group-hover:translate-x-4",
 tx.type === 'DEPOSIT' ?"bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]" :
 tx.type === 'WITHDRAWAL' ?"bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_30_rgba(239,68,68,0.2)]" :
"bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
 )}>
 {tx.type}
 </span>
 </td>
 <td className="px-12 py-6 space-y-3">
 <p className="text-lg font-semibold text-white uppercase tracking-tight group-hover:text-p transition-colors duration-700">{tx.description}</p>
 <p className="text-xs font-semibold text-white/10 uppercase tracking-[0.4em] font-mono group-hover:text-white/30 transition-colors">REF_HASH: {tx.reference}</p>
 </td>
 <td className="px-12 py-6 text-right">
 <span className={cn(
"text-3xl font-semibold tracking-tight group-hover:scale-125 transition-transform duration-700 block",
 tx.amount > 0 ?"text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" :"text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]"
 )}>
 {tx.amount > 0 ? '+$' : '-$'}{Math.abs(tx.amount).toLocaleString()}
 </span>
 </td>
 <td className="px-12 py-6 text-center">
 <div className="flex flex-col items-center gap-3 group-hover:scale-110 transition-transform duration-700">
 <div className={cn(
"w-3 h-3 rounded-full shadow-[0_0_20px_currentColor] animate-pulse",
 tx.status === 'CONFIRMED' ?"bg-emerald-500 text-emerald-500" :"bg-amber-500 text-amber-500"
 )} />
 <span className="text-xs font-semibold text-white/20 uppercase tracking-[0.5em]">{tx.status}</span>
 </div>
 </td>
 </motion.tr>
 ))}
 </tbody>
 </table>
 </div>
 </Card>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
}
