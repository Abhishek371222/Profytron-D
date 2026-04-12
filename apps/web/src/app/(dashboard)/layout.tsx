'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useTradingStore } from '@/lib/stores/useTradingStore';
import { cn } from '@/lib/utils';
import { Info, X, ArrowRight, Zap, CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { brokerApi } from '@/lib/api/broker';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
 const pathname = usePathname();
 const [showDemoBanner, setShowDemoBanner] = React.useState(true);
 const [showBrokerModal, setShowBrokerModal] = React.useState(false);
 const [mounted, setMounted] = React.useState(false);
 
 // Broker Form State
 const [brokerName, setBrokerName] = React.useState('MT5');
 const [accountNumber, setAccountNumber] = React.useState('');
 const [password, setPassword] = React.useState('');
 const [serverName, setServerName] = React.useState('');
 const [isConnecting, setIsConnecting] = React.useState(false);

 React.useEffect(() => {
 setMounted(true);
 }, []);

 const isBuilder = pathname?.includes('/strategies/builder');
 const isDemo = true; 

 const handleConnectBroker = async () => {
   setIsConnecting(true);
   try {
     await brokerApi.connectBroker({ brokerName, accountNumber, password, serverName });
     alert('Broker connected securely!');
     setShowBrokerModal(false);
     setShowDemoBanner(false);
   } catch (e: any) {
     alert(e.response?.data?.message || 'Connection failed');
   } finally {
     setIsConnecting(false);
   }
 };

 return (
 <AppShell>
 <div suppressHydrationWarning className={cn("relative flex flex-col", !isBuilder &&"gap-6")}>
 <AnimatePresence>
 {mounted && isDemo && showDemoBanner && !isBuilder && (
 <motion.div
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: 'auto', opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 className="overflow-hidden"
 >
 <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between group">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
 <Info className="w-5 h-5 text-amber-500" />
 </div>
 <div>
 <h4 className="text-sm font-bold text-amber-500 uppercase tracking-widest">Demo Mode Active</h4>
 <p className="text-xs text-amber-500/70 font-medium">Simulated market data. No real capital at risk.</p>
 </div>
 </div>
 
 <div className="flex items-center gap-6">
 <button 
   onClick={() => setShowBrokerModal(true)}
   className="flex items-center gap-2 text-xs font-semibold text-white hover:text-p transition-colors uppercase tracking-widest group/btn"
 >
 Connect real broker
 <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
 </button>
 <button 
 onClick={() => setShowDemoBanner(false)}
 className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 hover:bg-white/10 transition-colors"
 >
 <X className="w-4 h-4 text-white/40" />
 </button>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 <AnimatePresence>
  {showBrokerModal && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-lg rounded-4xl bg-[#080808] border border-white/10 p-8 space-y-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-linear-to-br from-p/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
             <h3 className="text-2xl font-semibold text-white uppercase tracking-tight">Connect Broker</h3>
             <p className="text-xs text-white/40 font-semibold uppercase tracking-widest">AES-GCM ENCRYPTED CONNECTION</p>
          </div>
          <button onClick={() => setShowBrokerModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        <div className="relative z-10 space-y-5">
           <div className="grid grid-cols-2 gap-4 mb-4">
             {['MT5', 'PAPER'].map(b => (
                <button 
                  key={b}
                  onClick={() => setBrokerName(b)}
                  className={cn("h-12 rounded-xl border text-xs font-semibold uppercase tracking-widest transition-all", brokerName === b ? "bg-p border-p text-white" : "bg-white/5 border-white/10 text-white/40")}
                >
                  {b} {b === 'PAPER' && '(Simulated)'}
                </button>
             ))}
           </div>

           {brokerName === 'MT5' && (
           <>
             <div className="space-y-2">
               <label className="text-[10px] text-white/40 uppercase tracking-widest ml-1 font-bold">Account Number</label>
               <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full h-12 bg-white/3 border border-white/5 rounded-xl px-4 text-sm text-white focus:border-p/50 outline-none" placeholder="1040294" />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] text-white/40 uppercase tracking-widest ml-1 font-bold">Master Password</label>
               <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full h-12 bg-white/3 border border-white/5 rounded-xl px-4 text-sm text-white focus:border-p/50 outline-none" placeholder="••••••••" />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] text-white/40 uppercase tracking-widest ml-1 font-bold">Server Name</label>
               <input value={serverName} onChange={(e) => setServerName(e.target.value)} className="w-full h-12 bg-white/3 border border-white/5 rounded-xl px-4 text-sm text-white focus:border-p/50 outline-none" placeholder="Broker-Server-Live" />
             </div>
           </>
           )}

           {brokerName === 'PAPER' && (
             <div className="p-6 bg-white/2 border border-white/10 rounded-2xl flex items-center justify-center text-center">
               <p className="text-xs text-white/40 uppercase tracking-widest leading-relaxed">Paper trading will simulate high-fidelity market executions with virtual balance.</p>
             </div>
           )}

           <button 
             onClick={handleConnectBroker}
             disabled={isConnecting || (brokerName === 'MT5' && (!accountNumber || !password || !serverName))}
             className="w-full h-14 bg-white text-black font-semibold uppercase tracking-widest rounded-xl hover:bg-white/90 disabled:opacity-50 mt-4 flex items-center justify-center gap-3 transition-colors"
           >
             {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-4 h-4" />}
             {isConnecting ? 'Verifying Integrity...' : 'Initialize Secure Connection'}
           </button>
        </div>
      </motion.div>
    </motion.div>
  )}
 </AnimatePresence>
 
 {children}
 </div>
 </AppShell>
 );
}
