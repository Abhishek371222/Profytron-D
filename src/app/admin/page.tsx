"use client";

import React, { useState, useEffect } from"react";
import { motion } from"framer-motion";
import {
 AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
 BarChart, Bar
} from"recharts";
import { 
 Users, DollarSign, Activity, Zap, Server, Database, Brain, ArrowUpRight, ArrowDownRight, Clock, ShieldAlert, CheckCircle2, AlertTriangle, AlertCircle
} from"lucide-react";

// Stable mock data (pre-computed to avoid hydration issues)
const revenueData = [
 { date: 'Day 1', total: 1050000, new: 110000 },
 { date: 'Day 2', total: 1075000, new: 115000 },
 { date: 'Day 3', total: 1090000, new: 105000 },
 { date: 'Day 4', total: 1120000, new: 120000 },
 { date: 'Day 5', total: 1150000, new: 130000 },
 { date: 'Day 6', total: 1180000, new: 125000 },
 { date: 'Day 7', total: 1200000, new: 135000 },
 { date: 'Day 8', total: 1225000, new: 140000 },
 { date: 'Day 9', total: 1250000, new: 145000 },
 { date: 'Day 10', total: 1280000, new: 150000 },
 { date: 'Day 11', total: 1300000, new: 135000 },
 { date: 'Day 12', total: 1325000, new: 140000 },
 { date: 'Day 13', total: 1350000, new: 145000 },
 { date: 'Day 14', total: 1375000, new: 150000 },
 { date: 'Day 15', total: 1400000, new: 155000 },
 { date: 'Day 16', total: 1420000, new: 140000 },
 { date: 'Day 17', total: 1445000, new: 145000 },
 { date: 'Day 18', total: 1470000, new: 150000 },
 { date: 'Day 19', total: 1500000, new: 160000 },
 { date: 'Day 20', total: 1525000, new: 155000 },
 { date: 'Day 21', total: 1550000, new: 160000 },
 { date: 'Day 22', total: 1575000, new: 165000 },
 { date: 'Day 23', total: 1600000, new: 170000 },
 { date: 'Day 24', total: 1625000, new: 165000 },
 { date: 'Day 25', total: 1650000, new: 170000 },
 { date: 'Day 26', total: 1675000, new: 175000 },
 { date: 'Day 27', total: 1700000, new: 180000 },
 { date: 'Day 28', total: 1725000, new: 175000 },
 { date: 'Day 29', total: 1750000, new: 180000 },
 { date: 'Day 30', total: 1775000, new: 185000 },
];

const userGrowthData = [
 { month: 'Jan', users: 520 },
 { month: 'Feb', users: 650 },
 { month: 'Mar', users: 780 },
 { month: 'Apr', users: 920 },
 { month: 'May', users: 1080 },
 { month: 'Jun', users: 1250 },
 { month: 'Jul', users: 1420 },
 { month: 'Aug', users: 1600 },
 { month: 'Sep', users: 1780 },
 { month: 'Oct', users: 1950 },
 { month: 'Nov', users: 2100 },
 { month: 'Dec', users: 2280 },
];

const systemAlerts = [
 { id: 'alt-0', type: 'API Latency', message: 'Abnormal spike detected in system pipeline.', severity: 'CRITICAL', time: '10:45 AM', status: 'ACTIVE' },
 { id: 'alt-1', type: 'Database Hook', message: 'Connection timeout in primary node.', severity: 'HIGH', time: '10:30 AM', status: 'ACTIVE' },
 { id: 'alt-2', type: 'Auth Failure', message: 'Multiple failed login attempts detected.', severity: 'MEDIUM', time: '10:15 AM', status: 'ACTIVE' },
 { id: 'alt-3', type: 'Payment Webhook', message: 'Webhook delivery delayed.', severity: 'LOW', time: '09:45 AM', status: 'RESOLVED' },
 { id: 'alt-4', type: 'API Latency', message: 'Response time degraded.', severity: 'MEDIUM', time: '09:30 AM', status: 'RESOLVED' },
 { id: 'alt-5', type: 'Database Hook', message: 'Query optimization recommended.', severity: 'LOW', time: '09:15 AM', status: 'RESOLVED' },
 { id: 'alt-6', type: 'Auth Failure', message: 'Token refresh failed.', severity: 'HIGH', time: '08:45 AM', status: 'RESOLVED' },
 { id: 'alt-7', type: 'Payment Webhook', message: 'Payment confirmation pending.', severity: 'LOW', time: '08:30 AM', status: 'RESOLVED' },
 { id: 'alt-8', type: 'API Latency', message: 'Rate limit threshold reached.', severity: 'MEDIUM', time: '08:15 AM', status: 'RESOLVED' },
 { id: 'alt-9', type: 'Database Hook', message: 'Backup completed successfully.', severity: 'LOW', time: '08:00 AM', status: 'RESOLVED' },
];

const services = [
 { name:"API Server", status:"green", latency:"34ms", uptime:"99.98%" },
 { name:"Database", status:"green", latency:"12ms", uptime:"99.99%" },
 { name:"Redis", status:"green", latency:"2ms", uptime:"100%" },
 { name:"AI Service", status:"amber", latency:"142ms", uptime:"99.90%" },
 { name:"Backtest Service", status:"red", latency:"timeout", uptime:"98.45%" },
 { name:"Payment Gateway", status:"green", latency:"45ms", uptime:"99.99%" },
];

const containerVariants = {
 hidden: { opacity: 0 },
 show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
 hidden: { opacity: 0, y: 15 },
 show: { opacity: 1, y: 0, transition: { type:"spring", stiffness: 300, damping: 24 } }
};

export default function AdminDashboard() {
 const [mounted, setMounted] = useState(false);

 useEffect(() => {
 setMounted(true);
 }, []);

 if (!mounted) return null;

 return (
 <div className="p-[var(--dashboard-p)] pb-12 max-w-[1800px] mx-auto space-y-[var(--section-gap)]">
 
 {/* Header */}
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-bold tracking-tight text-white">Platform Overview</h1>
 <p className="text-slate-400 mt-1">Real-time metrics and system health monitoring.</p>
 </div>
 </div>

 <motion.div 
 variants={containerVariants} 
 initial="hidden" 
 animate="show"
 className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
 >
 {/* KPI Cards */}
 {[
 { title:"Total Users", value:"12,847", sub:"+247 this week", subColor:"text-green-500", icon: Users },
 { title:"Monthly Revenue", value:"₹18,42,400 MRR", sub:"+12.4% vs last month", subColor:"text-green-500", icon: DollarSign },
 { title:"Active Strategies", value:"2,341 running", sub:"across 847 users", subColor:"text-slate-400", icon: Activity },
 { title:"Trades Today", value:"15,492", sub:"₹2.4Cr volume", subColor:"text-slate-400", icon: Zap },
 ].map((kpi, i) => (
 <motion.div key={i} variants={itemVariants} className="bg-slate-900 border border-slate-800 rounded-xl p-[var(--card-p)] flex flex-col justify-between">
 <div className="flex justify-between items-center text-slate-400 mb-6">
 <span className="font-medium text-sm">{kpi.title}</span>
 <kpi.icon className="w-5 h-5 opacity-70" />
 </div>
 <div>
 <div className="text-3xl font-display text-white mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
 {kpi.value}
 </div>
 <div className={`text-xs font-medium ${kpi.subColor}`}>
 {kpi.sub}
 </div>
 </div>
 </motion.div>
 ))}
 </motion.div>

 {/* Charts Section */}
 <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 
 {/* Revenue Chart */}
 <motion.div variants={itemVariants} className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-[var(--card-p)]">
 <div className="flex justify-between items-center mb-6">
 <div>
 <h3 className="font-medium text-slate-200">Revenue (Last 30 Days)</h3>
 <p className="text-xs text-slate-400">Total MRR vs New Subscriptions</p>
 </div>
 <div className="flex items-center gap-4 text-xs">
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded-full bg-indigo-500"></div> Total
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded-full bg-cyan-500"></div> New
 </div>
 </div>
 </div>
 <div className="h-[var(--chart-h-md)] w-full">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
 <defs>
 <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
 <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
 </linearGradient>
 <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
 <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
 <XAxis dataKey="date" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
 <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
 <RechartsTooltip 
 contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
 itemStyle={{ color: '#e2e8f0' }}
 />
 <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
 <Area type="monotone" dataKey="new" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorNew)" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </motion.div>

 {/* User Growth Chart */}
 <motion.div variants={itemVariants} className="bg-slate-900 border border-slate-800 rounded-xl p-[var(--card-p)]">
 <div className="mb-6">
 <h3 className="font-medium text-slate-200">User Growth</h3>
 <p className="text-xs text-slate-400">Last 12 months registrations</p>
 </div>
 <div className="h-[var(--chart-h-md)] w-full">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={userGrowthData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
 <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
 <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
 <RechartsTooltip 
 cursor={{ fill: '#1e293b' }}
 contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
 />
 <Bar dataKey="users" fill="#10b981" radius={[4, 4, 0, 0]} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </motion.div>

 </motion.div>

 {/* Bottom Section */}
 <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 
 {/* System Alerts */}
 <motion.div variants={itemVariants} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[var(--chart-h-lg)]">
 <div className="p-[var(--card-p)] border-b border-slate-800 flex justify-between items-center">
 <h3 className="font-medium text-slate-200 flex items-center gap-2">
 <ShieldAlert className="w-4 h-4 text-slate-400" />
 Recent System Alerts
 </h3>
 <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">10 events</span>
 </div>
 <div className="flex-1 overflow-y-auto">
 <table className="w-full text-sm text-left whitespace-nowrap">
 <thead className="text-xs text-slate-400 bg-slate-950/50 sticky top-0">
 <tr>
 <th className="px-5 py-3 font-medium">Type</th>
 <th className="px-5 py-3 font-medium">Severity</th>
 <th className="px-5 py-3 font-medium">Status</th>
 <th className="px-5 py-3 font-medium text-right">Time</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-800">
 {systemAlerts.map((alert) => (
 <tr key={alert.id} className="hover:bg-slate-800/50 transition-colors group">
 <td className="px-5 py-3">
 <div className="font-medium text-slate-300">{alert.type}</div>
 <div className="text-xs text-slate-500 truncate max-w-[150px]">{alert.message}</div>
 </td>
 <td className="px-5 py-3">
 <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold tracking-wider ${
 alert.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]' :
 alert.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
 alert.severity === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
 }`}>
 {alert.severity}
 </span>
 </td>
 <td className="px-5 py-3">
 <div className="flex items-center gap-1.5">
 {alert.status === 'RESOLVED' ? (
 <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
 ) : (
 <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
 )}
 <span className={alert.status === 'RESOLVED' ? 'text-green-500' : 'text-red-500'}>
 {alert.status}
 </span>
 </div>
 </td>
 <td className="px-5 py-3 text-right text-slate-400 font-mono text-xs">{alert.time}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </motion.div>

 {/* Service Health Grid */}
 <motion.div variants={itemVariants} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[var(--chart-h-lg)]">
 <div className="p-[var(--card-p)] border-b border-slate-800">
 <h3 className="font-medium text-slate-200 flex items-center gap-2">
 <Server className="w-4 h-4 text-slate-400" />
 Service Status
 </h3>
 </div>
 <div className="p-[var(--card-p)] grid grid-cols-2 gap-6 overflow-y-auto">
 {services.map((service, i) => (
 <div key={i} className="bg-slate-950/50 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors cursor-pointer group relative overflow-hidden">
 <div className="flex justify-between items-start mb-3">
 <div className="font-medium text-sm text-slate-300">{service.name}</div>
 <div className="relative flex h-3 w-3">
 {service.status !== 'green' && (
 <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
 service.status === 'amber' ? 'bg-amber-400' : 'bg-red-400'
 }`}></span>
 )}
 <span className={`relative inline-flex rounded-full h-3 w-3 ${
 service.status === 'green' ? 'bg-green-500' :
 service.status === 'amber' ? 'bg-amber-500' :
 'bg-red-500'
 }`}></span>
 </div>
 </div>
 <div className="flex items-end justify-between font-mono text-xs">
 <div>
 <div className="text-slate-500 mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Latency</div>
 <div className={service.status === 'red' ? 'text-red-400' : 'text-slate-300'}>{service.latency}</div>
 </div>
 <div className="text-right">
 <div className="text-slate-500 mb-1">Uptime</div>
 <div className="text-slate-300">{service.uptime}</div>
 </div>
 </div>
 <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
 <span className="text-xs font-medium text-white tracking-wider flex items-center gap-1">VIEW METRICS <ArrowUpRight className="w-4 h-4" /></span>
 </div>
 </div>
 ))}
 </div>
 </motion.div>

 </motion.div>
 </div>
 );
}
