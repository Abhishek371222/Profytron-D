"use client";

import React, { useState, useEffect } from"react";
import { motion, AnimatePresence } from"framer-motion";
import { 
 LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip as RechartsTooltip 
} from"recharts";
import { 
 Server, Activity, AlertTriangle, AlertCircle, RefreshCcw, Database, Network, Clock, CheckCircle2, ChevronDown, ChevronUp, Play
} from"lucide-react";

// Mock Data Generators
const generateApiMetrics = () => Array.from({ length: 60 }).map((_, i) => ({
 time: `-${60 - i}m`,
 p50: 20 + Math.random() * 30,
 p95: 80 + Math.random() * 100 + (i > 40 && i < 45 ? 500 : 0),
 p99: 150 + Math.random() * 200 + (i > 40 && i < 45 ? 1200 : 0),
}));

const generateErrorRates = () => Array.from({ length: 60 }).map((_, i) => ({
 time: `-${60 - i}m`,
 errorRate: (Math.random() > 0.8 ? Math.random() * 2.5 : Math.random() * 0.5),
}));

const initialErrors = Array.from({ length: 8 }).map((_, i) => ({
 id: `err_${i}`,
 service: ["API Server","Database","AI Engine","Payment Gateway"][Math.floor(Math.random() * 4)],
 type: ["TimeoutException","ConnectionRefused","RateLimitExceeded","NullReference"][Math.floor(Math.random() * 4)],
 count: Math.floor(Math.random() * 50) + 1,
 firstSeen: `10:${Math.floor(Math.random() * 60).toString().padStart(2,"0")} AM`,
 lastSeen: `Just now`,
 stackTrace: `Error: ${["TimeoutException","ConnectionRefused"][Math.floor(Math.random() * 2)]} at Object.fetchData (/app/src/services/api.ts:42:15)\n at processTicksAndRejections (node:internal/process/task_queues:96:5)\n at async runPipeline (/app/src/pipelines/trading.ts:118:5)`
}));

const QueueBar = ({ label, current, max }: { label: string, current: number, max: number }) => {
  const depth = (current / max) * 100;
  const color = current > 500 ? "bg-red-500" : current > 100 ? "bg-amber-500" : "bg-green-500";
  
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between items-end mb-1">
        <div className="text-sm font-medium text-slate-300">{label}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">{current} / {max}</span>
          <button className="flex items-center gap-1 text-xs uppercase font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition-colors">
            <Play className="w-3 h-3" /> Process
          </button>
        </div>
      </div>
      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
        <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.min(depth, 100)}%` }}></div>
      </div>
    </div>
  );
};

export default function SystemMonitoring() {
 const [apiMetrics, setApiMetrics] = useState(generateApiMetrics());
 const [errorRates, setErrorRates] = useState(generateErrorRates());
 const [activeConnections, setActiveConnections] = useState(847);
 const [errors, setErrors] = useState(initialErrors);
 const [expandedError, setExpandedError] = useState<string | null>(null);
 const [expandedService, setExpandedService] = useState<string | null>(null);

 // Simulated real-time updates
 useEffect(() => {
 const interval = setInterval(() => {
 // Update WebSocket Connections
 setActiveConnections(prev => prev + Math.floor(Math.random() * 11) - 5);
 
 // Update Error Log (Simulate new error sliding in occasionally)
 if (Math.random() > 0.8) {
 setErrors(prev => {
 const newErr = {
 id: `err_${Date.now()}`,
 service:"Network Interceptor",
 type:"E_CONN_RESET",
 count: 1,
 firstSeen:"Just now",
 lastSeen:"Just now",
 stackTrace:"Error: Socket closed unexpectedly..."
 };
 return [newErr, ...prev].slice(0, 10);
 });
 }
 }, 5000);
 return () => clearInterval(interval);
 }, []);

 return (
 <div className="p-6 md:p-8 flex flex-col space-y-6 max-w-[1600px] mx-auto">
 
 {/* Header */}
 <div className="flex justify-between items-center bg-slate-900 p-4 border border-slate-800 rounded-xl">
 <div className="flex items-center gap-3">
 <Server className="w-6 h-6 text-indigo-400" />
 <h1 className="text-2xl font-bold tracking-tight text-white">System Monitoring</h1>
 </div>
 <div className="flex items-center gap-4 text-sm font-medium">
 <div className="flex items-center gap-2 text-slate-400">
 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Auto-refreshing (10s)
 </div>
 <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
 <RefreshCcw className="w-4 h-4" /> Sync Now
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 {/* API Metrics Chart (2 cols) */}
 <div className="col-span-1 lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col">
 <div className="flex justify-between items-center mb-6">
 <div>
 <h3 className="font-medium text-slate-200 flex items-center gap-2"><Activity className="w-4 h-4"/> API Latency (1 Hour)</h3>
 <p className="text-xs text-slate-400 mt-1">99th, 95th, and 50th percentiles</p>
 </div>
 <div className="flex gap-4 text-xs font-medium">
 <span className="flex items-center gap-1.5 text-green-400"><div className="w-2 h-2 rounded-full bg-green-500"></div> P50 (20ms)</span>
 <span className="flex items-center gap-1.5 text-amber-400"><div className="w-2 h-2 rounded-full bg-amber-500"></div> P95 (150ms)</span>
 <span className="flex items-center gap-1.5 text-red-400"><div className="w-2 h-2 rounded-full bg-red-500"></div> P99 (850ms)</span>
 </div>
 </div>
 <div className="h-[250px] w-full">
 <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
 <LineChart data={apiMetrics}>
 <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
 <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
 <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} domain={[0, 2000]} />
 <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
 <Line type="monotone" dataKey="p99" stroke="#ef4444" strokeWidth={2} dot={false} animationDuration={1500} />
 <Line type="monotone" dataKey="p95" stroke="#f59e0b" strokeWidth={2} dot={false} animationDuration={1500} />
 <Line type="monotone" dataKey="p50" stroke="#22c55e" strokeWidth={2} dot={false} animationDuration={1500} />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Error Rates & WebSockets (1 col) */}
 <div className="col-span-1 flex flex-col gap-6">
 <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex-1">
 <h3 className="font-medium text-slate-200 mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500"/> Error Rate</h3>
 <div className="h-[140px] w-full">
 <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
 <BarChart data={errorRates}>
 <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
 <XAxis dataKey="time" hide />
 <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
 <ReferenceLine y={1} stroke="#ef4444" strokeDasharray="3 3" />
 <RechartsTooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
 <Bar dataKey="errorRate" fill="#ef4444" radius={[2, 2, 0, 0]} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>
 
 <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-5 relative overflow-hidden">
 <div className="absolute top-0 right-0 p-4 opacity-10">
 <Network className="w-24 h-24 text-indigo-500" />
 </div>
 <h3 className="font-medium text-indigo-300 mb-1">Active WebSockets</h3>
 <div className="text-4xl font-display font-bold text-white mb-2 tracking-tight">
 {activeConnections.toLocaleString()}
 </div>
 <div className="text-xs text-indigo-400/70">Connected clients via WSS</div>
 </div>
 </div>

 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
 {/* Queues */}
 <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
 <h3 className="font-medium text-slate-200 mb-6 flex items-center gap-2"><Database className="w-4 h-4 text-slate-400"/> System Queues</h3>
 <QueueBar label="Trade Execution Queue" current={45} max={1000} />
 <QueueBar label="AI Process Queue" current={210} max={1000} />
 <QueueBar label="Email Notification Queue" current={850} max={1000} />
 <QueueBar label="Backtest Engine Queue" current={5} max={200} />
 </div>

 {/* Database Stats */}
 <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
 <h3 className="font-medium text-slate-200 mb-6 flex items-center gap-2"><Database className="w-4 h-4 text-slate-400"/> Database Health</h3>
 
 <div className="mb-6">
 <div className="flex justify-between text-sm mb-2">
 <span className="text-slate-400">Connection Pool Usage</span>
 <span className="text-slate-200 font-mono">8 / 20</span>
 </div>
 <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800">
 <div className="bg-blue-500 h-3 rounded-full" style={{ width: '40%' }}></div>
 </div>
 </div>

 <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Top Huge Tables</h4>
 <div className="space-y-2">
 {["transactions_log (42.5 GB)","market_ticks (18.2 GB)","user_sessions (4.1 GB)"].map((tbl, i) => (
 <div key={i} className="flex justify-between items-center p-2 rounded bg-slate-950 border border-slate-800 text-sm">
 <span className="text-slate-300 font-mono text-xs">{tbl.split(' ')[0]}</span>
 <span className="text-slate-500">{tbl.split(' ')[1]} {tbl.split(' ')[2]}</span>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Error Log Table */}
 <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
 <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
 <h3 className="font-medium text-slate-200 flex items-center gap-2">
 <AlertCircle className="w-4 h-4 text-red-500" /> Recent Errors Log
 </h3>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-sm text-left">
 <thead className="text-xs text-slate-400 bg-slate-950 border-b border-slate-800">
 <tr>
 <th className="px-5 py-3 font-medium">Service</th>
 <th className="px-5 py-3 font-medium">Error Type</th>
 <th className="px-5 py-3 font-medium text-center">Count</th>
 <th className="px-5 py-3 font-medium">First Seen</th>
 <th className="px-5 py-3 font-medium">Last Seen</th>
 <th className="px-5 py-3"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-800 font-mono text-xs">
 <AnimatePresence initial={false}>
 {errors.map((err) => (
 <React.Fragment key={err.id}>
 <motion.tr 
 initial={{ opacity: 0, y: -20, backgroundColor:"#450a0a" }}
 animate={{ opacity: 1, y: 0, backgroundColor:"transparent" }}
 transition={{ duration: 0.5 }}
 className="hover:bg-slate-800/50 cursor-pointer group"
 onClick={() => setExpandedError(expandedError === err.id ? null : err.id)}
 >
 <td className="px-5 py-4 text-slate-300 font-sans">{err.service}</td>
 <td className="px-5 py-4 text-red-400">{err.type}</td>
 <td className="px-5 py-4 text-center">
 <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded">{err.count}</span>
 </td>
 <td className="px-5 py-4 text-slate-500">{err.firstSeen}</td>
 <td className="px-5 py-4 text-slate-500">{err.lastSeen}</td>
 <td className="px-5 py-4 text-right">
 {expandedError === err.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
 </td>
 </motion.tr>
 {expandedError === err.id && (
 <tr>
 <td colSpan={6} className="p-0 border-none bg-black">
 <motion.div 
 initial={{ height: 0, opacity: 0 }} 
 animate={{ height:"auto", opacity: 1 }} 
 exit={{ height: 0, opacity: 0 }}
 className="bg-slate-950 p-5 overflow-hidden"
 >
 <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Stack Trace Analysis</div>
 <pre className="text-red-400/80 bg-red-950/20 p-4 rounded-lg border border-red-900/30 overflow-x-auto whitespace-pre-wrap font-mono text-sm leading-relaxed">
 {err.stackTrace}
 </pre>
 <div className="mt-4 flex gap-3">
 <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-sm transition-colors font-sans">
 Acknowledge
 </button>
 <button className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded text-sm transition-colors font-sans">
 Create Ticket
 </button>
 </div>
 </motion.div>
 </td>
 </tr>
 )}
 </React.Fragment>
 ))}
 </AnimatePresence>
 </tbody>
 </table>
 </div>
 </div>

 </div>
 );
}
