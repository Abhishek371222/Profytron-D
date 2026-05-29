'use client';

import { create } from 'zustand';

export interface Trade {
 id: string;
 asset: string;
 type: 'Long' | 'Short';
 entry: number;
 current: number;
 amount: number;
 pnl: number;
 pnlPercent: number;
 status: 'Open' | 'Closed';
 timestamp: string;
 strategyId: string;
}

export interface Strategy {
 id: string;
 name: string;
 status: 'active' | 'paused' | 'stopped';
 pnlToday: number;
 winRate: number;
 confidence: number;
}

interface TradingData {
 portfolioValue: number;
 dailyChange: number;
 dailyChangePercent: number;
 realizedPnl: number;
 unrealizedPnl: number;
 winRate: number;
 activeTrades: Trade[];
 activeStrategies: Strategy[];
 isPaper: boolean;
}

interface TradingState extends TradingData {
 updateSimulatedData: (data: Partial<TradingData>) => void;
 addTrade: (trade: Trade) => void;
 closeTrade: (id: string) => void;
 togglePaper: (val: boolean) => void;
}

export const useTradingStore = create<TradingState>((set) => ({
 portfolioValue: 124580,
 dailyChange: 2340,
 dailyChangePercent: 1.92,
 realizedPnl: 1840,
 unrealizedPnl: 1400,
 winRate: 71.3,
 activeTrades: [
 {
 id:"T1",
 asset:"EURUSD",
 type:"Long",
 entry: 1.0820,
 current: 1.0845,
 amount: 0.5,
 pnl: 1240,
 pnlPercent: 1.2,
 status:"Open",
 timestamp: new Date(Date.now() - 1000 * 60 * 134).toISOString(),
 strategyId:"S1"
 },
 {
 id:"T2",
 asset:"GBPUSD",
 type:"Short",
 entry: 1.2650,
 current: 1.2662,
 amount: 1.0,
 pnl: -320,
 pnlPercent: -0.5,
 status:"Open",
 timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
 strategyId:"S2"
 }
 ],
 activeStrategies: [
 { id: 'S1', name: 'MomentumApex', status: 'active', pnlToday: 842, winRate: 68, confidence: 85 },
 { id: 'S2', name: 'SentinelTrend', status: 'active', pnlToday: 1240, winRate: 72, confidence: 92 },
 ],
 isPaper: true,

 updateSimulatedData: (data) => set((state) => ({ ...state, ...data })),
 addTrade: (trade) => set((state) => ({ activeTrades: [trade, ...state.activeTrades] })),
 closeTrade: (id) => set((state) => {
   const trade = state.activeTrades.find((t) => t.id === id);
   if (!trade) return state;
   return {
     activeTrades: state.activeTrades.filter((t) => t.id !== id),
     realizedPnl: state.realizedPnl + trade.pnl,
     unrealizedPnl: state.unrealizedPnl - trade.pnl,
   };
 }),
 togglePaper: (isPaper) => set({ isPaper }),
}));
