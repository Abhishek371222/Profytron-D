'use client';

import React from 'react';
import { 
 AreaChart, 
 Area, 
 XAxis, 
 YAxis, 
 CartesianGrid, 
 Tooltip, 
 ResponsiveContainer 
} from 'recharts';
import { useTradingStore } from '@/lib/stores/useTradingStore';

const data = [
 { time: '09:00', equity: 112000 },
 { time: '10:00', equity: 115000 },
 { time: '11:00', equity: 114000 },
 { time: '12:00', equity: 118000 },
 { time: '13:00', equity: 121000 },
 { time: '14:00', equity: 119500 },
 { time: '15:00', equity: 124580 },
];

function CustomTooltip({ active, payload, label }: any) {
 if (active && payload && payload.length) {
 return (
 <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
 <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">{label} UTC</p>
 <div className="flex items-center gap-3">
 <p className="text-lg font-semibold text-white font-mono">${payload[0].value.toLocaleString()}</p>
 <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full">+1.2%</span>
 </div>
 </div>
 );
 }
 return null;
}

export function EquityChart() {
 const [mounted, setMounted] = React.useState(false);
 const { portfolioValue } = useTradingStore();

 React.useEffect(() => {
 setMounted(true);
 }, []);

 if (!mounted) return <div className="h-full w-full bg-white/5 animate-pulse rounded-2xl" />;
 
 // Create a deep copy to avoid mutating read-only objects in Turbopack
 const displayData = data.map((d, i) => {
 if (i === data.length - 1) {
 return { ...d, equity: portfolioValue };
 }
 return { ...d };
 });

 return (
 <div className="h-full w-full min-h-[300px]">
 <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
 <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
 <defs>
 <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4}/>
 <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
 <XAxis 
 dataKey="time" 
 axisLine={false} 
 tickLine={false} 
 tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }}
 dy={10}
 />
 <YAxis 
 axisLine={false} 
 tickLine={false} 
 orientation="right"
 tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }}
 tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
 />
 <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(99, 102, 241, 0.2)', strokeWidth: 2 }} />
 <Area
 type="monotone"
 dataKey="equity"
 stroke="#6366f1"
 strokeWidth={3}
 fillOpacity={1}
 fill="url(#equityGradient)"
 animationDuration={2000}
 animationEasing="ease-out"
 />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 );
}
