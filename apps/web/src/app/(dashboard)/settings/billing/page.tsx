'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
 CreditCard, 
 Zap, 
 Shield, 
 Terminal, 
 Activity, 
 Clock, 
 CheckCircle2, 
 Plus, 
 ArrowUpRight,
 Database,
 History,
 Download,
 AlertTriangle
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const TIERS = [
 { name: 'Core Base', price: 'FREE', desc: 'Standard data relay & manual execution', active: false },
 { name: 'Apex Prime', price: '₹4,999/mo', desc: 'High-frequency neural nodes & advanced telemetry', active: true },
 { name: 'Quantum Legacy', price: '₹14,999/mo', desc: 'Custom colocation & institutional deep-liquidity access', active: false },
];

const INVOICES = [
 { id: 'INV-4829', date: '2024-03-01', amount: '₹4,999', status: 'PAID' },
 { id: 'INV-3940', date: '2024-02-01', amount: '₹4,999', status: 'PAID' },
 { id: 'INV-2841', date: '2024-01-01', amount: '₹4,999', status: 'PAID' },
];

export default function BillingPage() {
 const router = useRouter();
 const [activeTier, setActiveTier] = React.useState('Apex Prime');

 const handleTierAction = (tierName: string) => {
  if (tierName === activeTier) {
   toast.message(`${tierName} resource manager opened`);
   return;
  }
  setActiveTier(tierName);
  toast.success(`Tier switched to ${tierName}`);
 };

 const downloadInvoice = (invoiceId: string) => {
  const content = `Invoice ${invoiceId}\nGenerated: ${new Date().toISOString()}\nStatus: PAID`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${invoiceId}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
  toast.success(`Downloaded ${invoiceId}`);
 };

 const handleRequestStatement = () => {
  toast.message('Opening wallet statement center');
  router.push('/wallet');
 };

 return (
 <div className="space-y-16 pb-20">
 {/* ── ACTIVE PROTOCOL Tier ── */}
 <section className="space-y-10">
 <div className="flex items-center gap-5">
 <div className="w-14 h-14 rounded-[22px] bg-p/10 border border-p/20 flex items-center justify-center shadow-2xl">
 <Zap className="w-7 h-7 text-p animate-pulse" />
 </div>
 <div className="space-y-1">
 <h3 className="text-3xl font-semibold text-white uppercase tracking-tight">Treasury & Tiers</h3>
 <p className="text-xs text-p/60 font-semibold uppercase tracking-[0.3em]">Protocol subscription and resource allocation</p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {TIERS.map((tier) => (
 <motion.div
 key={tier.name}
 whileHover={{ y: -4 }}
 className={cn(
"p-8 rounded-[36px] border transition-all relative overflow-hidden group",
 tier.name === activeTier
 ?"bg-p/3 border-p/20 shadow-[0_30px_60px_rgba(99,102,241,0.08)]" 
 :"bg-white/1 border-white/5 opacity-40 hover:opacity-100 hover:border-white/10"
 )}
 >
 {tier.name === activeTier && (
 <>
 <div className="absolute top-0 right-0 w-32 h-32 bg-p/5 rounded-full blur-[60px] -mr-16 -mt-16" />
 <div className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1 rounded-full bg-p text-xs font-semibold uppercase tracking-widest text-white">
 <CheckCircle2 className="w-3 h-3" />
 ACTIVE_TIER
 </div>
 </>
 )}
 
 <div className="space-y-6 pt-2 relative z-10">
 <div className="space-y-1">
 <h4 className="text-xs font-semibold text-white/30 uppercase tracking-[0.4em]">{tier.name}</h4>
 <h5 className="text-3xl font-semibold text-white tracking-tight">{tier.price}</h5>
 {tier.name !== activeTier && <p className="text-xs text-emerald-300/80 font-semibold uppercase tracking-[0.25em] mt-2">Potential +28% throughput</p>}
 </div>
 
 <p className="text-sm text-white/40 font-semibold uppercase tracking-[0.2em] leading-relaxed min-h-[44px]">
 {tier.desc}
 </p>

 <div className="flex flex-col gap-3">
 {['L2 Data Stream', 'Unlimited Nodes', 'Priority Execution'].map(f => (
 <div key={f} className="flex items-center gap-3">
 <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
 <span className="text-xs font-semibold text-white/20 uppercase tracking-widest">{f}</span>
 </div>
 ))}
 </div>

 <Button 
 onClick={() => handleTierAction(tier.name)}
 className={cn(
"w-full h-12 rounded-[18px] font-semibold uppercase tracking-[0.3em] text-xs transition-all",
 tier.name === activeTier ?"bg-white text-black" :"bg-white/5 text-white/20 border border-white/5 hover:bg-white/10"
 )}
 >
 {tier.name === activeTier ? 'MANAGE_RESOURCES' : 'UPGRADE_Handshake'}
 </Button>
 </div>
 </motion.div>
 ))}
 </div>
 </section>

 {/* ── LIQUIDITY SOURCES ── */}
 <section className="space-y-10">
 <div className="flex items-center gap-6">
 <div className="w-14 h-14 rounded-[22px] bg-white/5 border border-white/10 flex items-center justify-center">
 <CreditCard className="w-7 h-7 text-white/40" />
 </div>
 <h4 className="text-2xl font-semibold text-white uppercase tracking-tight">Liquidity Sources</h4>
 <div className="h-px flex-1 bg-white/5" />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div className="p-10 rounded-[44px] glass-ultra border border-white/5 bg-linear-to-br from-p/5 to-transparent relative group overflow-hidden">
 <div className="absolute top-0 right-0 w-32 h-32 bg-p/10 rounded-full blur-[60px] -mr-16 -mt-16" />
 <div className="flex flex-col justify-between h-56 relative z-10">
 <div className="flex justify-between items-start">
 <Database className="w-10 h-10 text-white/60" />
 <span className="text-xs font-semibold text-p uppercase tracking-[0.4em] shadow-[0_0_10px_#6366f1]">PRIMARY_RESERVE</span>
 </div>
 <div className="space-y-8">
 <code className="text-2xl text-white font-jet-mono tracking-widest block">•••• •••• •••• 8492</code>
 <div className="flex justify-between items-end">
 <div className="space-y-1">
 <span className="text-xs font-semibold text-white/20 uppercase tracking-[0.3em]">Institutional ID</span>
 <span className="text-sm font-semibold text-white uppercase tracking-widest">ARJUN KHANNA</span>
 </div>
 <div className="space-y-1 text-right">
 <span className="text-xs font-semibold text-white/20 uppercase tracking-[0.3em]">Handshake</span>
 <span className="text-sm font-semibold text-white uppercase tracking-widest">12 / 29</span>
 </div>
 </div>
 </div>
 </div>
 </div>

 <button onClick={() => toast.message('Oracle linking workflow opened')} className="h-full min-h-[224px] rounded-[44px] border border-dashed border-white/10 hover:border-p/40 hover:bg-p/2 transition-all group flex flex-col items-center justify-center gap-6">
 <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-p group-hover:text-white transition-all">
 <Plus className="w-8 h-8 text-white/20 group-hover:text-white" />
 </div>
 <div className="space-y-2 text-center text-syne">
 <span className="text-sm font-semibold text-white/20 uppercase tracking-[0.5em] group-hover:text-white transition-colors block">Link New Oracle</span>
 <p className="text-xs text-white/10 font-semibold uppercase tracking-[0.2em]">Institutional Bank or Crypto-Custodian</p>
 </div>
 </button>
 </div>
 </section>

 {/* ── TRANSACTION RECAP ── */}
 <section className="space-y-10">
 <div className="flex items-center gap-6">
 <div className="w-14 h-14 rounded-[22px] bg-white/5 border border-white/10 flex items-center justify-center">
 <History className="w-7 h-7 text-white/40" />
 </div>
 <h4 className="text-2xl font-semibold text-white uppercase tracking-tight">Handshake Ledger</h4>
 <div className="h-px flex-1 bg-white/5" />
 </div>

 <div className="rounded-[36px] bg-[#030303] border border-white/5 overflow-hidden">
 <div className="grid grid-cols-4 gap-4 px-10 py-6 border-b border-white/5 bg-white/1">
 {['Registry ID', 'Handshake Date', 'Liquidity Shipped', 'Relay Status'].map(h => (
 <span key={h} className="text-xs font-semibold text-white/20 uppercase tracking-[0.4em]">{h}</span>
 ))}
 </div>
 {INVOICES.map((inv, i) => (
 <div key={inv.id} className="grid grid-cols-4 gap-4 px-10 py-8 border-b border-white/3 items-center hover:bg-white/2 transition-colors group">
 <span className="text-sm font-semibold text-white font-jet-mono uppercase">{inv.id}</span>
 <span className="text-xs font-semibold text-white/40 font-jet-mono uppercase">{inv.date}</span>
 <span className="text-sm font-semibold text-white font-jet-mono">{inv.amount}</span>
 <div className="flex items-center justify-between">
 <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold uppercase tracking-widest">{inv.status}</span>
 <button onClick={() => downloadInvoice(inv.id)} className="opacity-0 group-hover:opacity-100 transition-opacity w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-p hover:text-white text-white/20" aria-label={`Download ${inv.id}`}>
 <Download className="w-5 h-5" />
 </button>
 </div>
 </div>
 ))}
 <div className="p-10 flex items-center justify-between">
 <span className="text-xs font-semibold text-white/10 uppercase tracking-widest font-jet-mono">End of Ledger</span>
 <button onClick={handleRequestStatement} className="text-xs font-semibold text-p/60 hover:text-p uppercase tracking-widest flex items-center gap-2">
 Request Full Statement <ArrowUpRight className="w-4 h-4" />
 </button>
 </div>
 </div>
 </section>
 </div>
 );
}
