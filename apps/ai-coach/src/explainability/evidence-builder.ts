import type {
  CoachIntent,
  EvidenceBundle,
  ToolFetchers,
  ToolId,
  SessionMemory,
} from './types';
import { toolsForIntent } from './tool-router';

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

function asArray(v: unknown): any[] {
  if (Array.isArray(v)) return v;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    for (const k of ['trades', 'data', 'items', 'strategies', 'results']) {
      if (Array.isArray(o[k])) return o[k] as any[];
    }
  }
  return [];
}

function tradePnl(t: any): number {
  return (
    num(t?.pnl) ??
    num(t?.profit) ??
    num(t?.netPnl) ??
    num(t?.realizedPnl) ??
    0
  );
}

function isToday(iso?: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate()
  );
}

function deriveHealth(params: {
  drawdownPct: number | null;
  todayPnL: number | null;
  syncError: string | null;
  openCount: number;
  marginHealth: EvidenceBundle['marginHealthLabel'];
}): EvidenceBundle['healthLabel'] {
  if (params.syncError) return 'Needs attention';
  if (params.marginHealth === 'Tight') return 'Elevated risk';
  if (params.drawdownPct != null && params.drawdownPct >= 10) return 'Elevated risk';
  if (params.drawdownPct != null && params.drawdownPct >= 5) return 'Needs attention';
  if (params.todayPnL != null && params.todayPnL < -500) return 'Needs attention';
  if (
    params.drawdownPct == null &&
    params.todayPnL == null &&
    params.openCount === 0
  )
    return 'Unknown';
  return 'Stable';
}

function marginLabel(
  equity: number | null,
  margin: number | null,
  free: number | null,
): EvidenceBundle['marginHealthLabel'] {
  if (equity == null || equity <= 0) return 'Unknown';
  if (free != null && equity > 0) {
    const freePct = (free / equity) * 100;
    if (freePct < 20) return 'Tight';
    return 'Healthy';
  }
  if (margin != null && equity > 0) {
    const usedPct = (margin / equity) * 100;
    if (usedPct > 70) return 'Tight';
    return 'Healthy';
  }
  return 'Unknown';
}

export async function buildEvidence(params: {
  intent: CoachIntent;
  fetchers: ToolFetchers;
  session?: SessionMemory;
  tradeIdHint?: string | null;
}): Promise<{ evidence: EvidenceBundle; toolsUsed: ToolId[] }> {
  const tools = toolsForIntent(params.intent);
  const toolErrors: EvidenceBundle['toolErrors'] = [];
  const rawNotes: string[] = [];
  const results: Partial<Record<ToolId, unknown>> = {};

  const portfolioRange =
    params.intent.startsWith('trend_') || params.intent.startsWith('advisory_')
      ? '1m'
      : params.intent.includes('week') ||
          params.intent === 'performance_summarize_week'
        ? '7d'
        : '7d';

  await Promise.all(
    tools.map(async (tool) => {
      try {
        switch (tool) {
          case 'analytics_portfolio':
            results[tool] = await params.fetchers.analyticsPortfolio?.(portfolioRange);
            break;
          case 'analytics_risk':
            results[tool] = await params.fetchers.analyticsRisk?.('30d');
            break;
          case 'analytics_strategy_comparison':
            results[tool] = await params.fetchers.analyticsStrategyComparison?.(
              '30d',
            );
            break;
          case 'analytics_trades':
            results[tool] = await params.fetchers.analyticsTrades?.('7d');
            break;
          case 'trading_history':
            results[tool] = await params.fetchers.tradingHistory?.({ limit: 100 });
            break;
          case 'trading_open':
            results[tool] = await params.fetchers.tradingOpen?.();
            break;
          case 'ai_explain_trade': {
            const id =
              params.tradeIdHint || params.session?.selectedTradeId || null;
            if (!id) {
              rawNotes.push('No trade id selected for explain-trade.');
              break;
            }
            results[tool] = await params.fetchers.explainTrade?.(id);
            break;
          }
          case 'coaching_report':
            results[tool] = await params.fetchers.coachingReport?.();
            break;
          default:
            break;
        }
      } catch (e: any) {
        toolErrors.push({
          tool,
          message: String(e?.message || e || 'Tool failed'),
        });
      }
    }),
  );

  // Extra short-window portfolio for day-delta / briefing (no new tool id).
  let portfolio1d: any = null;
  if (
    params.fetchers.analyticsPortfolio &&
    (params.intent === 'portfolio_briefing' ||
      params.intent === 'portfolio_changed_since_yesterday' ||
      params.intent.startsWith('trend_'))
  ) {
    try {
      portfolio1d = await params.fetchers.analyticsPortfolio('1d');
    } catch (e: any) {
      rawNotes.push(`1d portfolio fetch: ${String(e?.message || e)}`);
    }
  }

  const history = asArray(results.trading_history);
  const open = asArray(results.trading_open);
  const analyticsTrades = asArray(results.analytics_trades);
  const tradePool = history.length ? history : analyticsTrades;

  const todayTrades = tradePool.filter(
    (t) =>
      isToday(t?.closedAt || t?.closeTime || t?.updatedAt || t?.createdAt) ||
      isToday(t?.openedAt || t?.openTime),
  );
  const todayClosed = todayTrades.filter(
    (t) => t?.status === 'CLOSED' || t?.closedAt || t?.closeTime || t?.pnl != null,
  );

  let todayPnL: number | null = null;
  if (todayClosed.length) {
    todayPnL = todayClosed.reduce((s, t) => s + tradePnl(t), 0);
  } else if (portfolio1d) {
    todayPnL =
      num(portfolio1d?.totalProfit) ??
      num(portfolio1d?.totalPnl) ??
      num(portfolio1d?.netPnl) ??
      null;
  }

  const portfolio = results.analytics_portfolio as any;
  const weekPnL =
    num(portfolio?.totalProfit) ??
    num(portfolio?.totalPnl) ??
    num(portfolio?.netPnl) ??
    num(portfolio?.pnl) ??
    num(portfolio?.summary?.pnl) ??
    null;

  const monthPnL = weekPnL; // same payload when range is 1m
  const periodReturnPct =
    num(portfolio?.totalReturnPct) ?? num(portfolio1d?.totalReturnPct) ?? null;

  const risk = results.analytics_risk as any;
  const drawdownPct =
    num(risk?.maxDrawdown) ??
    num(risk?.drawdown) ??
    num(risk?.currentDrawdown) ??
    num(risk?.metrics?.maxDrawdownPct) ??
    num(portfolio?.maxDrawdown) ??
    null;

  const winRate =
    num(portfolio?.winRate) ??
    num((results.coaching_report as any)?.winRate) ??
    null;

  const avgWin = num(portfolio?.avgWin) ?? num(risk?.bestSingleWin) ?? null;
  const avgLoss =
    num(portfolio?.avgLoss) ??
    (num(risk?.largestLoss) != null ? Math.abs(num(risk!.largestLoss)!) * -1 : null);

  let largestLoss: EvidenceBundle['largestLoss'] = null;
  let largestGain: EvidenceBundle['largestGain'] = null;
  const symbolPnl = new Map<string, number>();
  for (const t of tradePool) {
    const p = tradePnl(t);
    const sym = String(t?.symbol || t?.instrument || t?.pair || 'unknown');
    symbolPnl.set(sym, (symbolPnl.get(sym) || 0) + p);
    const row = {
      symbol: sym,
      pnl: p,
      id: String(t?.id || t?.ticket || ''),
    };
    if (largestLoss == null || p < (largestLoss.pnl ?? 0)) largestLoss = row;
    if (largestGain == null || p > (largestGain.pnl ?? 0)) largestGain = row;
  }

  const strategiesRaw = asArray(results.analytics_strategy_comparison);
  const strategies: NonNullable<EvidenceBundle['strategies']> = [];
  let bestStrategy: EvidenceBundle['bestStrategy'] = null;
  let worstStrategy: EvidenceBundle['worstStrategy'] = null;
  for (const s of strategiesRaw) {
    const p =
      num(s?.pnl) ?? num(s?.netPnl) ?? num(s?.totalPnl) ?? num(s?.profit) ?? 0;
    const name = String(s?.name || s?.strategyName || s?.title || 'Strategy');
    const trades = num(s?.trades) ?? num(s?.tradeCount) ?? 0;
    const row = {
      name,
      pnl: p,
      trades: trades || 0,
      winRate: num(s?.winRate),
      maxDrawdown: num(s?.maxDrawdown),
    };
    strategies.push(row);
    if (!bestStrategy || p > (bestStrategy.pnl ?? -Infinity))
      bestStrategy = { name, pnl: p, trades: row.trades };
    if (!worstStrategy || p < (worstStrategy.pnl ?? Infinity))
      worstStrategy = { name, pnl: p, trades: row.trades };
  }

  const explain = results.ai_explain_trade as any;
  const tradeId =
    params.tradeIdHint || params.session?.selectedTradeId || explain?.tradeId;
  let tradeExplanation: EvidenceBundle['tradeExplanation'] = null;
  if (tools.includes('ai_explain_trade')) {
    if (explain && (explain.summary || explain.explanation || explain.data)) {
      const summary =
        explain.summary ||
        explain.explanation ||
        explain.data?.summary ||
        undefined;
      tradeExplanation = {
        tradeId: String(tradeId || 'unknown'),
        summary: typeof summary === 'string' ? summary : undefined,
        confidenceScore: num(explain.confidenceScore ?? explain.confidence) ?? undefined,
        available: true,
        knownFacts: Array.isArray(explain.riskFactorsJson)
          ? explain.riskFactorsJson.map(String)
          : undefined,
      };
    } else if (tradeId) {
      const t =
        tradePool.find((x) => String(x?.id || x?.ticket) === String(tradeId)) ||
        open.find((x) => String(x?.id || x?.ticket) === String(tradeId));
      tradeExplanation = {
        tradeId: String(tradeId),
        available: false,
        knownFacts: t
          ? [
              `Symbol: ${t.symbol || t.instrument || 'unknown'}`,
              `Side: ${t.side || t.type || 'unknown'}`,
              `Status: ${t.status || (t.closedAt ? 'CLOSED' : 'OPEN')}`,
            ]
          : ['Trade id provided but no row found in recent history/open book.'],
      };
    } else {
      tradeExplanation = {
        tradeId: '',
        available: false,
        knownFacts: [
          'No trade selected. Open a trade from the live rail or mention a ticket id.',
        ],
      };
    }
  }

  const liveBalance = num(portfolio?.liveBalance) ?? num(portfolio1d?.liveBalance);
  const liveEquity = num(portfolio?.liveEquity) ?? num(portfolio1d?.liveEquity);
  const liveMargin = num(portfolio?.liveMargin) ?? num(portfolio1d?.liveMargin);
  const liveFreeMargin =
    num(portfolio?.liveFreeMargin) ?? num(portfolio1d?.liveFreeMargin);
  const liveCurrency =
    (portfolio?.liveCurrency as string) ||
    (portfolio1d?.liveCurrency as string) ||
    null;
  const syncError =
    (typeof portfolio?.syncError === 'string' && portfolio.syncError) ||
    (typeof portfolio1d?.syncError === 'string' && portfolio1d.syncError) ||
    null;

  const marginHealthLabel = marginLabel(liveEquity, liveMargin, liveFreeMargin);

  // Equity curve day delta
  let equityChange1d: number | null = null;
  const curve = Array.isArray(portfolio?.equityCurve)
    ? portfolio.equityCurve
    : Array.isArray(portfolio1d?.equityCurve)
      ? portfolio1d.equityCurve
      : [];
  if (curve.length >= 2) {
    const a = num(curve[curve.length - 2]?.equity);
    const b = num(curve[curve.length - 1]?.equity);
    if (a != null && b != null) equityChange1d = b - a;
  }

  const attentionFlags: string[] = [];
  if (syncError) attentionFlags.push(`Broker sync: ${syncError}`);
  if (drawdownPct != null && drawdownPct >= 5)
    attentionFlags.push(`Drawdown near ${drawdownPct.toFixed(1)}%`);
  if (marginHealthLabel === 'Tight') attentionFlags.push('Margin looks tight');
  if (worstStrategy && (worstStrategy.pnl ?? 0) < 0)
    attentionFlags.push(
      `Weakest strategy: ${worstStrategy.name} (${worstStrategy.pnl?.toFixed(2)})`,
    );
  if (todayPnL != null && todayPnL < 0)
    attentionFlags.push(`Today closed P&L ${todayPnL.toFixed(2)}`);

  let concentrationNote: string | null = null;
  if (strategies.length) {
    const totalAbs = strategies.reduce((s, x) => s + Math.abs(x.pnl), 0) || 1;
    const top = [...strategies].sort(
      (a, b) => Math.abs(b.pnl) - Math.abs(a.pnl),
    )[0];
    const share = (Math.abs(top.pnl) / totalAbs) * 100;
    concentrationNote =
      share >= 60
        ? `P&L is concentrated: “${top.name}” is ~${share.toFixed(0)}% of absolute strategy P&L in sample.`
        : `Strategy P&L looks relatively distributed (top share ~${share.toFixed(0)}%).`;
  } else if (open.length) {
    const bySym = new Map<string, number>();
    for (const t of open) {
      const sym = String(t?.symbol || t?.instrument || 'unknown');
      bySym.set(sym, (bySym.get(sym) || 0) + 1);
    }
    const top = [...bySym.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top)
      concentrationNote = `Open book: ${top[1]}/${open.length} positions on ${top[0]}.`;
  }

  const heatNote =
    open.length >= 8
      ? `Open book is busy (${open.length} positions) — heat may be elevated.`
      : open.length > 0
        ? `Open positions: ${open.length}.`
        : 'No open positions in sample.';

  const worstCaseNote =
    risk?.largestLoss != null
      ? `Largest loss in risk window: ${num(risk.largestLoss)?.toFixed(2)}.`
      : largestLoss?.pnl != null
        ? `Largest sample loss: ${largestLoss.symbol} at ${largestLoss.pnl.toFixed(2)}.`
        : null;

  const sortedSyms = [...symbolPnl.entries()].sort((a, b) => a[1] - b[1]);
  const symbolRiskNote =
    sortedSyms.length > 0
      ? `Weakest symbol in sample: ${sortedSyms[0][0]} (${sortedSyms[0][1].toFixed(2)}). Strongest: ${sortedSyms[sortedSyms.length - 1][0]} (${sortedSyms[sortedSyms.length - 1][1].toFixed(2)}).`
      : null;

  let trendLabel: EvidenceBundle['trendLabel'] = 'Unknown';
  if (weekPnL != null && winRate != null) {
    if (weekPnL > 0 && winRate >= 50) trendLabel = 'Improving';
    else if (weekPnL < 0 && winRate < 45) trendLabel = 'Declining';
    else trendLabel = 'Mixed / flat';
  } else if (weekPnL != null) {
    trendLabel = weekPnL > 0 ? 'Improving' : weekPnL < 0 ? 'Declining' : 'Mixed / flat';
  }

  const volatilityNote =
    drawdownPct != null && periodReturnPct != null
      ? `Return ~${periodReturnPct.toFixed(2)}% with drawdown ~${drawdownPct.toFixed(2)}% in window.`
      : drawdownPct != null
        ? `Drawdown ~${drawdownPct.toFixed(2)}% is the main volatility proxy available.`
        : null;

  const advisoryHints: string[] = [];
  if (attentionFlags.length)
    advisoryHints.push('Review items flagged under “needs attention”.');
  if (worstStrategy && (worstStrategy.pnl ?? 0) < 0)
    advisoryHints.push(
      `Review recent trades for strategy “${worstStrategy.name}” before changing size.`,
    );
  if (marginHealthLabel === 'Tight')
    advisoryHints.push('Watch free margin before adding exposure.');
  if (drawdownPct != null && drawdownPct >= 5)
    advisoryHints.push('Compare current drawdown to your personal risk comfort.');
  if (!advisoryHints.length)
    advisoryHints.push(
      'No acute flags — keep reviewing win rate vs average loss weekly.',
    );

  const healthLabel = deriveHealth({
    drawdownPct,
    todayPnL,
    syncError,
    openCount: open.length,
    marginHealth: marginHealthLabel,
  });

  const evidence: EvidenceBundle = {
    generatedAt: new Date().toISOString(),
    scopeNote:
      'Active account scope only — multi-account portfolio IQ is not enabled yet.',
    todayPnL,
    weekPnL,
    monthPnL,
    periodReturnPct,
    drawdownPct,
    winRate,
    avgWin,
    avgLoss: avgLoss ?? (num(portfolio?.avgLoss) != null ? num(portfolio.avgLoss) : null),
    tradeCountToday: todayTrades.length || null,
    tradeCountPeriod: tradePool.length || null,
    largestLoss,
    largestGain,
    bestStrategy,
    worstStrategy,
    strategies,
    openCount: open.length || null,
    riskSummary:
      typeof risk?.summary === 'string'
        ? risk.summary
        : drawdownPct != null
          ? `Approx drawdown ${drawdownPct.toFixed(2)}%`
          : null,
    liveBalance,
    liveEquity,
    liveMargin,
    liveFreeMargin,
    liveCurrency,
    syncError,
    healthLabel,
    attentionFlags,
    equityChange1d,
    concentrationNote,
    marginHealthLabel,
    heatNote,
    worstCaseNote,
    symbolRiskNote,
    trendLabel,
    volatilityNote,
    advisoryHints,
    tradeExplanation,
    toolErrors,
    rawNotes,
  };

  return { evidence, toolsUsed: tools };
}
