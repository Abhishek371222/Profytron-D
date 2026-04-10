'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  Search, 
  Download, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar,
  ChevronRight,
  Target,
  Zap,
  ShieldCheck,
  Activity,
  Box,
  Brain
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MOCK_HISTORY = [
  { id: '1', asset: 'EUR/USD', type: 'Long', amount: '2.5', entry: '1.08420', exit: '1.08950', pnl: 1325.50, status: 'Closed', time: '2026-04-10 14:22', strategy: 'MomentumApex v2' },
  { id: '2', asset: 'BTC/USDT', type: 'Short', amount: '0.15', entry: '64,250', exit: '63,120', pnl: 485.20, status: 'Closed', time: '2026-04-10 12:45', strategy: 'Neural Scalp' },
  { id: '3', asset: 'ETH/USDT', type: 'Long', amount: '4.2', entry: '3,450', exit: '3,410', pnl: -168.00, status: 'Closed', time: '2026-04-10 11:15', strategy: 'Deltra Trend' },
  { id: '4', asset: 'GBP/JPY', type: 'Long', amount: '1.8', entry: '191.45', exit: '192.10', pnl: 842.15, status: 'Closed', time: '2026-04-10 09:30', strategy: 'Institutional VWAP' },
  { id: '5', asset: 'GOLD', type: 'Short', amount: '10', entry: '2,345', exit: '2,352', pnl: -320.00, status: 'Closed', time: '2026-04-09 18:20', strategy: 'Metal Guard' },
  { id: '6', asset: 'USD/JPY', type: 'Long', amount: '3.0', entry: '151.20', exit: '151.85', pnl: 650.40, status: 'Closed', time: '2026-04-09 16:45', strategy: 'MomentumApex v1' },
  { id: '7', asset: 'SOL/USDT', type: 'Long', amount: '50', entry: '174.20', exit: '182.10', pnl: 395.00, status: 'Closed', time: '2026-04-09 14:10', strategy: 'Neural Scalp' },
];

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState('All Strategies');

  return (
    <div className="p-8 space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <History className="w-5 h-5 text-primary" />
             </div>
             <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight italic font-syne">Execution_Vault</h1>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.4em] mt-1">Immutable Transaction Ledger</p>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="h-14 flex items-center gap-3 glass-strong px-6 rounded-2xl border border-white/5">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Aggregate P&L</span>
              <span className="text-xl font-black text-emerald-400 font-mono tracking-tighter">+$3,210.25</span>
              <div className="w-1 h-4 bg-white/10 mx-2" />
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500" />
                 <span className="text-[9px] font-bold text-white/40 uppercase">Synced</span>
              </div>
           </div>
           <Button className="h-14 px-8 bg-white text-black hover:bg-white/90 rounded-2xl font-black uppercase tracking-widest gap-3 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              <Download className="w-4 h-4" />
              Export Terminal Log
           </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
         <div className="lg:col-span-2 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              type="text" 
              placeholder="FILTER BY ASSET OR ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 text-[12px] font-black tracking-[0.2em] text-white placeholder:text-white/10 focus:border-primary/30 transition-all outline-none"
            />
         </div>
         <div className="relative">
            <select 
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 text-[11px] font-black tracking-widest text-white/60 appearance-none focus:text-white focus:border-primary/30 transition-all outline-none cursor-pointer"
            >
               <option>All Strategies</option>
               <option>MomentumApex v2</option>
               <option>Neural Scalp</option>
               <option>Capital Guard</option>
            </select>
            <Filter className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
         </div>
         <Button variant="ghost" className="h-14 border border-white/5 bg-white/[0.02] rounded-2xl text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-white gap-3">
            <Calendar className="w-4 h-4" />
            Select Custom Range
         </Button>
      </div>

      {/* Main Table */}
      <div className="glass-ultra rounded-[40px] border border-white/5 overflow-hidden shadow-2xl relative">
        {/* Table Background Glows */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="overflow-x-auto relative z-10">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                {['Execution_ID', 'Asset_Token', 'Logic_Protocol', 'Type', 'Volume', 'Performance', 'Timestamp', 'Status'].map((head) => (
                  <th key={head} className="px-8 py-6 text-left text-[10px] font-black text-white/20 uppercase tracking-[0.3em] font-syne">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {MOCK_HISTORY.map((trade, i) => (
                <motion.tr 
                  key={trade.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group hover:bg-white/[0.02] transition-all cursor-pointer"
                >
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-mono text-white/30 uppercase group-hover:text-primary transition-colors">TR_{trade.id}X77_{Math.random().toString(36).slice(2,5).toUpperCase()}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                          <Box className="w-4 h-4 text-white/40" />
                       </div>
                       <span className="text-sm font-black text-white italic tracking-tight">{trade.asset}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                       <span className="text-[11px] font-bold text-white/60 tracking-tight">{trade.strategy}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "text-[9px] font-black px-3 py-1 rounded-full border tracking-widest uppercase italic",
                      trade.type === 'Long' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    )}>
                      {trade.type}
                    </span>
                  </td>
                  <td className="px-8 py-6 font-mono text-xs text-white/60">
                    {trade.amount} Lots
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                       <span className={cn(
                         "text-sm font-black font-mono tracking-tighter",
                         trade.pnl > 0 ? "text-emerald-400" : "text-rose-400"
                       )}>
                         {trade.pnl > 0 ? '+' : ''}${Math.abs(trade.pnl).toLocaleString()}
                       </span>
                       <div className="flex items-center gap-1 mt-1">
                          {trade.pnl > 0 ? <ArrowUpRight className="w-3 h-3 text-emerald-500/40" /> : <ArrowDownRight className="w-3 h-3 text-rose-500/40" />}
                          <span className="text-[8px] font-bold text-white/20 uppercase">Settled Terminal</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-bold text-white/30 tracking-widest">{trade.time}</span>
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest italic">{trade.status}</span>
                     </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State Mock */}
        {MOCK_HISTORY.length === 0 && (
          <div className="py-32 flex flex-col items-center justify-center space-y-6">
             <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
                <Brain className="w-10 h-10 text-white/10" />
             </div>
             <p className="text-xs font-black text-white/20 uppercase tracking-[0.4em]">Vault Memory: Empty</p>
          </div>
        )}
      </div>

      {/* Pagination / Status */}
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
         <span>Displaying 1-50 of 2,450 Transmissions</span>
         <div className="flex items-center gap-4">
            <button className="hover:text-primary transition-colors">Prev</button>
            <div className="flex gap-2">
               <span className="text-white">1</span>
               <span>2</span>
               <span>3</span>
               <span>...</span>
               <span>49</span>
            </div>
            <button className="hover:text-primary transition-colors">Next</button>
         </div>
      </div>
    </div>
  );
}
