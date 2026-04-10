"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";
import { 
  CheckCircle2, XCircle, AlertTriangle, ArrowRight, X, User, Activity, Brain, Clock, ShieldCheck, ThumbsUp, ThumbsDown, MessageSquare
} from "lucide-react";

// Mock Data
type Status = "Pending Review" | "Approved" | "Rejected";
type AIBias = "PASSED" | "FAILED";

interface Strategy {
  id: string;
  name: string;
  creator: string;
  category: string;
  risk: string;
  submitted: string;
  backtestScore: number;
  aiBias: AIBias;
  aiBiasDetail: string;
  status: Status;
  description: string;
  stats: {
    sharpe: string;
    drawdown: string;
    winRate: string;
    totalTrades: string;
    liveSharpe?: string;
  }
}

const mockStrategies: Strategy[] = Array.from({ length: 14 }).map((_, i) => {
  const isFailed = i % 4 === 0;
  return {
    id: `strat_00${i + 1}`,
    name: `Alpha Quantitative v${i + 1}.0`,
    creator: `Trader ${i + 10}`,
    category: ["Equities", "Forex", "Crypto"][i % 3],
    risk: ["Low", "Medium", "High"][i % 3],
    submitted: `${i + 1} hours ago`,
    backtestScore: 70 + Math.floor(Math.random() * 25),
    aiBias: isFailed ? "FAILED" : "PASSED",
    aiBiasDetail: isFailed ? "Overfitting: OK | Look-ahead: FAILED | Min trades: 14" : "Overfitting: OK | Look-ahead: OK | Min trades: 450",
    status: i < 5 ? "Pending Review" : (i % 2 === 0 ? "Approved" : "Rejected"),
    description: "High frequency mean reversion strategy targeting US large cap equities during market open volatility.",
    stats: {
      sharpe: (1.5 + Math.random()).toFixed(2),
      drawdown: `${(Math.random() * 15).toFixed(1)}%`,
      winRate: `${(55 + Math.random() * 20).toFixed(1)}%`,
      totalTrades: Math.floor(200 + Math.random() * 800).toString(),
      liveSharpe: (1.0 + Math.random()).toFixed(2),
    }
  };
});

const equityData = Array.from({ length: 100 }).map((_, i) => ({
  time: i,
  value: 10000 + (i * 50) + (Math.random() - 0.5) * 2000
}));

export default function StrategyQueue() {
  const [activeTab, setActiveTab] = useState("Pending Review");
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);

  const filteredStrategies = mockStrategies.filter(s => 
    activeTab === "All" ? true : s.status === activeTab
  );

  return (
    <div className="flex h-full w-full relative">
      <div className="flex-1 p-6 md:p-8 flex flex-col h-full overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white">Strategy Verification Queue</h1>
          <span className="bg-red-500/20 text-red-500 border border-red-500/30 px-3 py-1 rounded-full text-sm font-medium">
            14 pending
          </span>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-slate-800 mb-6">
          {["Pending Review", "Approved", "Rejected", "All"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === tab ? "text-red-500" : "text-slate-400 hover:text-slate-200"}`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="stratTabs" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
              )}
            </button>
          ))}
        </div>

        {/* Queue Table */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 bg-slate-950/50 sticky top-0 z-10 border-b border-slate-800 shadow-sm">
                <tr>
                  <th className="px-4 py-3 font-medium">Strategy Name</th>
                  <th className="px-4 py-3 font-medium">Creator</th>
                  <th className="px-4 py-3 font-medium">Category / Risk</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">AI Bias Check</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredStrategies.map((strat) => (
                  <tr key={strat.id} className="hover:bg-slate-800/80 transition-colors group">
                    <td className="px-4 py-3 font-medium text-slate-200">{strat.name}</td>
                    <td className="px-4 py-3 text-slate-400">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" /> {strat.creator}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-300">{strat.category}</div>
                      <div className="text-xs text-slate-500">Risk: {strat.risk}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> {strat.submitted}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">{strat.backtestScore}/100</td>
                    <td className="px-4 py-3">
                      {strat.aiBias === "PASSED" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wider bg-green-500/10 text-green-500 border border-green-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
                        </span>
                      ) : (
                        <div className="group/tooltip relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wider bg-red-500/10 text-red-500 border border-red-500/20 cursor-help">
                          <XCircle className="w-3.5 h-3.5" /> FAILED
                          
                          {/* Hover Tooltip */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-slate-800 border border-slate-700 p-2 rounded shadow-xl text-slate-300 text-[10px] font-normal z-20 opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity">
                            {strat.aiBiasDetail}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                       <button 
                         onClick={() => setSelectedStrategy(strat)}
                         className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors font-medium text-xs bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/20"
                       >
                         Review <ArrowRight className="w-3.5 h-3.5" />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* REVIEW SLIDE-OVER */}
      <AnimatePresence>
        {selectedStrategy && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setSelectedStrategy(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-[600px] bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-800">
                <h2 className="text-lg font-medium text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" /> Strategy Review
                </h2>
                <button 
                  onClick={() => setSelectedStrategy(null)} 
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* Strat Detail */}
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">{selectedStrategy.name}</h1>
                  <p className="text-sm text-slate-400 mb-4">{selectedStrategy.description}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-500 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {selectedStrategy.creator}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                    <span className="flex items-center gap-1.5"><ArrowRight className="w-4 h-4" /> {selectedStrategy.category}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                    <span>Risk: {selectedStrategy.risk}</span>
                  </div>
                </div>

                {/* Backtest Summary */}
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-3 uppercase tracking-wider">Backtest Performance</h3>
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {[
                      { label: "Sharpe", val: selectedStrategy.stats.sharpe },
                      { label: "Drawdown", val: selectedStrategy.stats.drawdown },
                      { label: "Win Rate", val: selectedStrategy.stats.winRate },
                      { label: "Trades", val: selectedStrategy.stats.totalTrades },
                    ].map((s, i) => (
                      <div key={i} className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-500 mb-1">{s.label}</div>
                        <div className="font-mono text-white text-sm">{s.val}</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Equity Curve */}
                  <div className="h-[200px] bg-slate-950 border border-slate-800 rounded-lg p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={equityData}>
                        <defs>
                          <linearGradient id="eqGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                        <Area type="monotone" dataKey="value" stroke="#818cf8" fill="url(#eqGradient)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Live vs Backtest Divergence (Simulated logic) */}
                {Number(selectedStrategy.stats.sharpe) - Number(selectedStrategy.stats.liveSharpe) > 0.4 && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex gap-3 text-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <div>
                      <div className="text-amber-500 font-medium mb-1">High Live Divergence Detected</div>
                      <div className="text-amber-500/80">Live Sharpe: {selectedStrategy.stats.liveSharpe} vs Backtest: {selectedStrategy.stats.sharpe}. This exceeds the 20% divergence threshold.</div>
                    </div>
                  </div>
                )}

                {/* Automated Checks */}
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-400" /> AI Automated Checks
                  </h3>
                  <table className="w-full text-sm text-left bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                    <thead className="bg-slate-900 border-b border-slate-800 text-xs">
                      <tr>
                        <th className="px-3 py-2 text-slate-400">Check Name</th>
                        <th className="px-3 py-2 text-slate-400">Result</th>
                        <th className="px-3 py-2 text-slate-400">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {[
                        { name: "Overfitting Test", pass: true, detail: "Variance < 5%" },
                        { name: "Look-ahead Bias", pass: selectedStrategy.aiBias === 'PASSED', detail: selectedStrategy.aiBias === 'PASSED' ? "No future leaks" : "Leak in timestamp diff" },
                        { name: "Statistical Significance", pass: true, detail: `Min trades met` },
                      ].map((chk, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-slate-300 font-medium">{chk.name}</td>
                          <td className="px-3 py-2">
                            {chk.pass ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-500">{chk.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Admin Notes */}
                <div>
                   <h3 className="text-sm font-medium text-slate-300 mb-2 uppercase tracking-wider">Internal Notes (Hidden from Creator)</h3>
                   <textarea 
                     className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 focus:outline-none focus:border-red-500 resize-none"
                     placeholder="Add verification notes here..."
                   ></textarea>
                </div>

              </div>

              {/* Action Footer */}
              <div className="p-6 border-t border-slate-800 bg-slate-950/50 space-y-3">
                 <button className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-bold text-white transition-colors shadow-[0_0_15px_rgba(22,163,74,0.3)]">
                    <ThumbsUp className="w-4 h-4" /> Approve Verification
                 </button>
                 <div className="grid grid-cols-2 gap-3">
                    <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-sm font-medium text-amber-500 transition-colors">
                       <MessageSquare className="w-4 h-4" /> Request Changes
                    </button>
                    <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-sm font-medium text-red-500 transition-colors">
                       <ThumbsDown className="w-4 h-4" /> Reject with Reason
                    </button>
                 </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
