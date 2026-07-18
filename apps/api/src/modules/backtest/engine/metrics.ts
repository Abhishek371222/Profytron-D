import { SimulatedTrade, BacktestMetrics } from '../types';

const EMPTY: BacktestMetrics = {
  totalTrades: 0,
  winRate: 0,
  netProfit: 0,
  netProfitPct: 0,
  maxDrawdown: 0,
  maxDrawdownPct: 0,
  profitFactor: 0,
  sharpeRatio: 0,
  recoveryFactor: 0,
  expectancy: 0,
  avgWin: 0,
  avgLoss: 0,
  total_pnl: 0,
  win_rate: 0,
  max_drawdown: 0,
  sharpe_ratio: 0,
};

export function calculateMetrics(
  trades: SimulatedTrade[],
  initialCapital: number,
): BacktestMetrics {
  if (trades.length === 0) return { ...EMPTY };

  const wins = trades.filter((t) => t.pnlAbs > 0);
  const losses = trades.filter((t) => t.pnlAbs <= 0);
  const winRate = wins.length / trades.length;

  const netProfit = trades.reduce((s, t) => s + t.pnlAbs, 0);
  const grossProfit = wins.reduce((s, t) => s + t.pnlAbs, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnlAbs, 0));
  const profitFactor =
    grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;

  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
  const expectancy = winRate * avgWin - (1 - winRate) * avgLoss;

  let equity = initialCapital;
  let peak = initialCapital;
  let maxDDPct = 0;
  const periodicReturns: number[] = [];

  for (const t of trades) {
    const prev = equity;
    equity += t.pnlAbs;
    if (equity > peak) peak = equity;
    const dd = (peak - equity) / peak;
    if (dd > maxDDPct) maxDDPct = dd;
    if (prev > 0) periodicReturns.push((equity - prev) / prev);
  }

  const avgRet =
    periodicReturns.reduce((s, r) => s + r, 0) / (periodicReturns.length || 1);
  const variance =
    periodicReturns.reduce((s, r) => s + Math.pow(r - avgRet, 2), 0) /
    (periodicReturns.length || 1);
  const stdRet = Math.sqrt(variance);
  const sharpe = stdRet > 0 ? (avgRet / stdRet) * Math.sqrt(252) : 0;

  const maxDDAbs = initialCapital * maxDDPct;
  const recoveryFactor =
    maxDDAbs > 0 ? netProfit / maxDDAbs : netProfit > 0 ? 999 : 0;

  return {
    totalTrades: trades.length,
    winRate,
    netProfit,
    netProfitPct: netProfit / initialCapital,
    maxDrawdown: maxDDAbs,
    maxDrawdownPct: maxDDPct,
    profitFactor,
    sharpeRatio: sharpe,
    recoveryFactor,
    expectancy,
    avgWin,
    avgLoss,
    total_pnl: netProfit,
    win_rate: winRate,
    max_drawdown: maxDDPct,
    sharpe_ratio: sharpe,
  };
}
