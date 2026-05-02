'use client';

import React from 'react';
import { useTradingStore } from '@/lib/stores/useTradingStore';

export function TradingSimulator() {
 const { 
 portfolioValue, 
 dailyChange, 
 updateSimulatedData,
 activeTrades
 } = useTradingStore();

 React.useEffect(() => {
 const interval = setInterval(() => {
 // Simulate micro-fluctuations
 const drift = (Math.random() - 0.45) * 10; // Slight upward bias
 const newPortfolioValue = portfolioValue + drift;
 const newDailyChange = dailyChange + drift;
 
 // Update trades Earnings
 const updatedTrades = activeTrades.map(trade => {
 const pnlChange = (Math.random() - 0.48) * 5;
 return {
 ...trade,
 current: trade.current + (pnlChange / trade.amount / 100),
 pnl: trade.pnl + pnlChange,
 pnlPercent: ((trade.pnl + pnlChange) / (trade.entry * trade.amount)) * 100
 };
 });

 // Update unrealized Earnings sum
 const newUnrealized = updatedTrades.reduce((acc, t) => acc + t.pnl, 0);

 updateSimulatedData({
 portfolioValue: newPortfolioValue,
 dailyChange: newDailyChange,
 activeTrades: updatedTrades,
 unrealizedPnl: newUnrealized
 });
 
 }, 1000);

 return () => clearInterval(interval);
 }, [portfolioValue, dailyChange, updateSimulatedData, activeTrades]);

 return null; // Side-effect only component
}
