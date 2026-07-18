import type { CoachIntent, EvidenceBundle } from './types';

function money(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return 'unavailable';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}`;
}

function pct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return 'unavailable';
  return `${n.toFixed(2)}%`;
}

function errSuffix(evidence: EvidenceBundle): string {
  return evidence.toolErrors.length > 0
    ? ` Some data sources failed: ${evidence.toolErrors.map((e) => e.tool).join(', ')}.`
    : '';
}

/** Explainability Framework: What → Why → Evidence → Meaning → Next */
export function buildResponseSections(
  intent: CoachIntent,
  evidence: EvidenceBundle,
): {
  whatHappened: string;
  why: string;
  evidence: string;
  meaning: string;
  nextStep: string;
} {
  const errors = errSuffix(evidence);

  switch (intent) {
    case 'performance_down_today': {
      const pnl = evidence.todayPnL;
      const what =
        pnl == null
          ? `I could not compute today's closed P&L from available trade data.${errors}`
          : pnl < 0
            ? `On your active account, today's closed P&L is about ${money(pnl)}.`
            : pnl === 0
              ? `Today's closed P&L looks flat (${money(0)}) on the trades I can see.`
              : `Today's closed P&L is actually positive (${money(pnl)}) on the trades I can see — not down.`;
      const why =
        evidence.largestLoss?.pnl != null && (pnl ?? 0) < 0
          ? `The largest drag I can see is ${evidence.largestLoss.symbol || 'a trade'} at ${money(evidence.largestLoss.pnl)}.`
          : 'I can only attribute moves to trades present in history/analytics — I will not invent causes.';
      return {
        whatHappened: what,
        why,
        evidence: `Trades counted today: ${evidence.tradeCountToday ?? 'n/a'}. Scope: ${evidence.scopeNote}`,
        meaning:
          'A single down day is not automatically strategy failure. It can be normal variance — or a signal to review risk if drawdown is also elevated.',
        nextStep:
          'Ask “Explain my drawdown” or “Which strategy contributed most?” — or open Analytics for charts. I will not place or close trades for you.',
      };
    }

    case 'portfolio_briefing': {
      const lines = [
        `Today closed P&L: ${money(evidence.todayPnL)}`,
        `Period net: ${money(evidence.weekPnL)} · win rate ${pct(evidence.winRate)}`,
        evidence.bestStrategy
          ? `Strongest tagged strategy: ${evidence.bestStrategy.name} (${money(evidence.bestStrategy.pnl)})`
          : null,
        evidence.worstStrategy
          ? `Weakest tagged strategy: ${evidence.worstStrategy.name} (${money(evidence.worstStrategy.pnl)})`
          : null,
        `Margin: ${evidence.marginHealthLabel || 'Unknown'}`,
        evidence.syncError
          ? `Sync issue: ${evidence.syncError}`
          : 'No broker sync error flagged on portfolio payload.',
        `Overall health: ${evidence.healthLabel || 'Unknown'}`,
      ]
        .filter(Boolean)
        .join(' · ');
      return {
        whatHappened: `30-second portfolio briefing (active account): ${lines}${errors}`,
        why:
          evidence.worstStrategy && (evidence.worstStrategy.pnl ?? 0) < 0
            ? `Attribution points to “${evidence.worstStrategy.name}” as the main drag among tagged strategies.`
            : 'Attribution uses strategy comparison + today’s closed trades when present.',
        evidence: `Open: ${evidence.openCount ?? 0}. Equity ${money(evidence.liveEquity)} / Balance ${money(evidence.liveBalance)}. ${evidence.scopeNote}`,
        meaning:
          'This is a grounded snapshot of platform data — not a forecast or advice to trade.',
        nextStep:
          'Ask “What needs attention?” or “Where am I losing money?” for deeper attribution.',
      };
    }

    case 'portfolio_changed_since_yesterday': {
      return {
        whatHappened:
          evidence.equityChange1d != null
            ? `Equity change across the last two curve points is about ${money(evidence.equityChange1d)}. Today’s closed P&L sample: ${money(evidence.todayPnL)}.${errors}`
            : `I could not read a clean day-over-day equity delta; today’s closed P&L sample is ${money(evidence.todayPnL)}.${errors}`,
        why: 'Day delta uses equity-curve endpoints and/or today’s closed trades — not invented market moves.',
        evidence: evidence.scopeNote,
        meaning: 'Missing curve points reduce confidence in “since yesterday” claims.',
        nextStep: 'Ask for a 30-second portfolio summary for the fuller picture.',
      };
    }

    case 'portfolio_needs_attention': {
      const flags = evidence.attentionFlags?.length
        ? evidence.attentionFlags.join('; ')
        : 'No acute attention flags from available metrics.';
      return {
        whatHappened: `Attention check: ${flags}${errors}`,
        why: 'Flags are derived from drawdown, margin, sync errors, today P&L, and weakest strategy.',
        evidence: `Health label: ${evidence.healthLabel}. ${evidence.scopeNote}`,
        meaning: '“Needs attention” means review in the product — not that I will change positions.',
        nextStep:
          'Open Trading Workspace / Risk analytics, or ask “Is my margin healthy?”',
      };
    }

    case 'portfolio_where_making_money': {
      return {
        whatHappened: evidence.bestStrategy
          ? `Among tagged strategies, “${evidence.bestStrategy.name}” shows the strongest P&L (${money(evidence.bestStrategy.pnl)}). Largest trade gain in sample: ${evidence.largestGain?.symbol || 'n/a'} (${money(evidence.largestGain?.pnl ?? null)}).${errors}`
          : `Strategy attribution limited. Largest trade gain in sample: ${evidence.largestGain?.symbol || 'n/a'} (${money(evidence.largestGain?.pnl ?? null)}).${errors}`,
        why: 'Uses strategy comparison + trade history P&L fields.',
        evidence: evidence.symbolRiskNote || evidence.scopeNote,
        meaning: 'Untagged trades can hide true winners.',
        nextStep: 'Ask “Compare my strategies” for a fuller ranking.',
      };
    }

    case 'portfolio_where_losing': {
      return {
        whatHappened: evidence.worstStrategy
          ? `Among tagged strategies, “${evidence.worstStrategy.name}” shows the weakest P&L (${money(evidence.worstStrategy.pnl)}). Largest trade loss in sample: ${evidence.largestLoss?.symbol || 'n/a'} (${money(evidence.largestLoss?.pnl ?? null)}).${errors}`
          : `Strategy attribution limited. Largest trade loss in sample: ${evidence.largestLoss?.symbol || 'n/a'} (${money(evidence.largestLoss?.pnl ?? null)}).${errors}`,
        why: 'Uses strategy comparison + trade history P&L fields.',
        evidence: evidence.symbolRiskNote || evidence.scopeNote,
        meaning: 'A weak window is not automatic proof a strategy should be deleted.',
        nextStep: 'Ask why a strategy is underperforming, or review that bot’s recent trades.',
      };
    }

    case 'performance_summarize_week':
    case 'portfolio_how_performing': {
      return {
        whatHappened: `Period performance summary (active account): net P&L ${money(evidence.weekPnL)}, win rate ${pct(evidence.winRate)}, trades in sample ${evidence.tradeCountPeriod ?? 'n/a'}.${errors}`,
        why:
          evidence.bestStrategy || evidence.worstStrategy
            ? `Best tagged strategy: ${evidence.bestStrategy?.name || 'n/a'} (${money(evidence.bestStrategy?.pnl ?? null)}). Weakest: ${evidence.worstStrategy?.name || 'n/a'} (${money(evidence.worstStrategy?.pnl ?? null)}).`
            : 'Strategy attribution was limited — some trades may be untagged.',
        evidence: `Open positions now: ${evidence.openCount ?? 'n/a'}. Health: ${evidence.healthLabel}. ${evidence.scopeNote}`,
        meaning:
          'This is a plain-language read of your platform data, not a forecast or financial advice.',
        nextStep:
          'Ask about drawdown or a specific trade, or review Analytics → Portfolio for the full picture.',
      };
    }

    case 'strategy_compare_all': {
      const list =
        evidence.strategies
          ?.slice()
          .sort((a, b) => b.pnl - a.pnl)
          .slice(0, 5)
          .map((s) => `${s.name}: ${money(s.pnl)} (${s.trades} trades)`)
          .join('; ') || 'No strategy rows returned.';
      return {
        whatHappened: `Strategy comparison (sample): ${list}${errors}`,
        why: 'Ranked by net P&L from analytics strategy comparison.',
        evidence: evidence.scopeNote,
        meaning: 'Sample size and tagging quality affect rankings.',
        nextStep: 'Ask which strategy degraded or underperformed for deeper context.',
      };
    }

    case 'strategy_underperforming_why':
    case 'strategy_degraded': {
      const s = evidence.worstStrategy;
      return {
        whatHappened: s
          ? `“${s.name}” is the weakest tagged strategy in sample (${money(s.pnl)}, ${s.trades ?? 0} trades).${errors}`
          : `I could not identify an underperforming strategy from available data.${errors}`,
        why:
          s && (s.trades ?? 0) < 5
            ? 'Sample size is small — underperformance may be noise.'
            : 'Ranking uses comparison P&L; I will not invent market-regime causes without data.',
        evidence: evidence.concentrationNote || evidence.scopeNote,
        meaning: 'Degradation here means relative P&L weakness in the window — not a proven broken edge.',
        nextStep: 'Review that strategy’s recent trades in Analytics / My Bots.',
      };
    }

    case 'strategy_improving': {
      const s = evidence.bestStrategy;
      return {
        whatHappened: s
          ? `“${s.name}” leads tagged strategies in this window (${money(s.pnl)}).${errors}`
          : `No improving strategy signal from comparison data.${errors}`,
        why: '“Improving” is proxied by best relative P&L in the available window — not multi-period regression yet.',
        evidence: evidence.scopeNote,
        meaning: 'A strong window can reverse; treat as descriptive, not predictive.',
        nextStep: 'Ask about performance trends for a broader improving/declining read.',
      };
    }

    case 'strategy_session_performance': {
      return {
        whatHappened: `Session win-rate breakdown is not fully exposed on the strategy-comparison payload I can see.${errors}`,
        why: 'I will not invent London/NY session stats without a session field in the tool response.',
        evidence: evidence.scopeNote,
        meaning: 'Open Analytics advanced metrics if your plan surfaces session performance there.',
        nextStep: 'Ask to compare strategies overall, or review Analytics → Advanced.',
      };
    }

    case 'strategy_losing_symbols': {
      return {
        whatHappened: evidence.symbolRiskNote || `No symbol P&L aggregation available.${errors}`,
        why: 'Aggregated from trade history / analytics trade rows in sample.',
        evidence: evidence.scopeNote,
        meaning: 'Symbol stats are sample-limited.',
        nextStep: 'Ask where you are losing money for strategy-level attribution.',
      };
    }

    case 'strategy_holding_time': {
      return {
        whatHappened: `Average holding time is not present on the strategy comparison rows I received.${errors}`,
        why: 'I will not invent hold-time diagnostics.',
        evidence: evidence.scopeNote,
        meaning: 'Check Analytics advanced metrics for holding-time fields when available.',
        nextStep: 'Ask for a strategy comparison or risk summary instead.',
      };
    }

    case 'performance_drawdown':
    case 'portfolio_whats_my_risk':
    case 'performance_highest_risk':
    case 'risk_exposure_summary': {
      const dd = evidence.drawdownPct;
      return {
        whatHappened:
          dd == null
            ? `I could not read a drawdown/exposure figure from risk/portfolio tools.${errors}`
            : `Your account is currently about ${pct(dd)} below its recent peak (drawdown). Open positions: ${evidence.openCount ?? 0}.`,
        why:
          evidence.riskSummary ||
          evidence.heatNote ||
          'Drawdown measures peak-to-trough decline — it rises when losses stack or winners reverse.',
        evidence: `Margin ${evidence.marginHealthLabel}. ${evidence.scopeNote}`,
        meaning:
          dd != null && dd >= 8
            ? 'This level is elevated for many retail automation users — worth reviewing open risk and strategy concentration.'
            : 'Drawdown alone does not prove a broken strategy, but it is the number to watch for risk control.',
        nextStep:
          'Review open positions and risk settings in the Trading Workspace. I will not pause or close bots unless you confirm in the product UI.',
      };
    }

    case 'risk_margin_health': {
      return {
        whatHappened: `Margin health: ${evidence.marginHealthLabel || 'Unknown'}. Equity ${money(evidence.liveEquity)}, free margin ${money(evidence.liveFreeMargin)}.${errors}`,
        why: 'Derived from live equity / margin / free-margin fields on the portfolio payload when present.',
        evidence: evidence.scopeNote,
        meaning:
          evidence.marginHealthLabel === 'Tight'
            ? 'Tight margin means less room for adverse moves — review before adding risk.'
            : 'Healthy margin is descriptive, not a green light to increase size.',
        nextStep: 'Ask about portfolio heat or concentration next.',
      };
    }

    case 'risk_concentration': {
      return {
        whatHappened: evidence.concentrationNote || `Could not assess concentration.${errors}`,
        why: 'Uses strategy P&L share or open-book symbol counts.',
        evidence: evidence.scopeNote,
        meaning: 'Concentration increases path-dependency of results.',
        nextStep: 'Ask risk by strategy or by symbol for detail.',
      };
    }

    case 'risk_heat': {
      return {
        whatHappened: `${evidence.heatNote || 'Heat unavailable.'} Drawdown ${pct(evidence.drawdownPct)}.${errors}`,
        why: 'Heat is a plain-language proxy from open count + drawdown — not a proprietary heat model.',
        evidence: evidence.scopeNote,
        meaning: 'Busy open books raise operational risk even when P&L is flat.',
        nextStep: 'Ask “What needs attention?” or review open positions.',
      };
    }

    case 'risk_worst_case': {
      return {
        whatHappened: evidence.worstCaseNote || `No worst-case loss figure in sample.${errors}`,
        why: 'Uses risk analytics largest loss or sample trade extremes — not VaR invention beyond returned fields.',
        evidence: evidence.scopeNote,
        meaning: 'Past largest loss is not a guaranteed future floor.',
        nextStep: 'Ask about margin health if you are sizing new risk.',
      };
    }

    case 'risk_by_symbol': {
      return {
        whatHappened: evidence.symbolRiskNote || `Symbol risk aggregation unavailable.${errors}`,
        why: 'Aggregated from trade P&L by symbol in the sample.',
        evidence: evidence.scopeNote,
        meaning: 'Open-book risk may differ from closed-trade symbol stats.',
        nextStep: 'Ask exposure summary for drawdown context.',
      };
    }

    case 'risk_by_strategy': {
      const list =
        evidence.strategies
          ?.slice()
          .sort(
            (a, b) => (b.maxDrawdown ?? 0) - (a.maxDrawdown ?? 0) || a.pnl - b.pnl,
          )
          .slice(0, 4)
          .map(
            (s) =>
              `${s.name}: PnL ${money(s.pnl)}${s.maxDrawdown != null ? `, DD ${pct(s.maxDrawdown)}` : ''}`,
          )
          .join('; ') || 'No strategy risk rows.';
      return {
        whatHappened: `Strategy risk snapshot: ${list}${errors}`,
        why: 'From strategy comparison metrics when drawdown/P&L fields exist.',
        evidence: evidence.scopeNote,
        meaning: 'Missing per-strategy drawdown reduces ranking quality.',
        nextStep: 'Ask which strategy underperformed for attribution.',
      };
    }

    case 'trend_improving_or_declining': {
      return {
        whatHappened: `Trend read: ${evidence.trendLabel || 'Unknown'}. Period P&L ${money(evidence.weekPnL)}, win rate ${pct(evidence.winRate)}.${errors}`,
        why: 'Trend is a coarse label from period P&L + win rate — not a predictive model.',
        evidence: evidence.volatilityNote || evidence.scopeNote,
        meaning: 'Short windows flip often; use as a review cue, not a trading signal.',
        nextStep: 'Ask win rate vs average loss for behavior detail.',
      };
    }

    case 'trend_winrate_vs_avg_loss': {
      return {
        whatHappened: `Win rate ${pct(evidence.winRate)}; average win ${money(evidence.avgWin)}; average loss ${money(evidence.avgLoss)}.${errors}`,
        why: 'Pulled from portfolio / risk analytics fields when present.',
        evidence: evidence.scopeNote,
        meaning:
          evidence.winRate != null &&
          evidence.avgLoss != null &&
          Math.abs(evidence.avgLoss) > (evidence.avgWin ?? 0) * 1.2
            ? 'Win rate may look fine while losses are larger than wins — consistency risk.'
            : 'Compare these to your own targets; I will not prescribe position size.',
        nextStep: 'Ask how to improve consistency for advisory review ideas.',
      };
    }

    case 'trend_volatility_change': {
      return {
        whatHappened: evidence.volatilityNote || `Volatility proxy unavailable.${errors}`,
        why: 'Uses return % and drawdown as available volatility proxies — not a full vol model.',
        evidence: evidence.scopeNote,
        meaning: 'Rising drawdown with flat returns often feels like “volatility up”.',
        nextStep: 'Ask about portfolio heat or exposure next.',
      };
    }

    case 'advisory_review_suggestion':
    case 'advisory_what_to_watch':
    case 'advisory_improve_consistency': {
      const hints = (evidence.advisoryHints || []).join(' ');
      return {
        whatHappened: `Based on your recent account evidence: ${hints}${errors}`,
        why: 'Hints are generated only from flags already present in the evidence bundle.',
        evidence: `Health ${evidence.healthLabel}; trend ${evidence.trendLabel}. ${evidence.scopeNote}`,
        meaning:
          'This is advisory review guidance only — not financial advice, and not an instruction to buy, sell, or change bots automatically.',
        nextStep:
          'Use Analytics / Trading Workspace to review. Confirm any bot or risk changes yourself in the UI — I will not execute them.',
      };
    }

    case 'performance_best_strategy':
    case 'performance_highest_profit': {
      const s = evidence.bestStrategy;
      return {
        whatHappened: s
          ? `Among tagged strategies I can see, “${s.name}” contributed the most (${money(s.pnl)}).`
          : `I could not rank strategies — comparison data was missing.${errors}`,
        why: 'Ranking uses strategy-comparison / portfolio attribution available to your account.',
        evidence: evidence.scopeNote,
        meaning: 'Untagged trades are excluded — rankings can understate true contribution.',
        nextStep: 'Open My Bots / Analytics strategy comparison to verify, or ask about the weakest strategy.',
      };
    }
    case 'performance_worst_strategy': {
      const s = evidence.worstStrategy;
      return {
        whatHappened: s
          ? `Among tagged strategies I can see, “${s.name}” contributed the least (${money(s.pnl)}).`
          : `I could not identify a weakest strategy from available data.${errors}`,
        why: 'Based on strategy comparison P&L in the selected window.',
        evidence: evidence.scopeNote,
        meaning: 'A weak window is not automatic grounds to delete a strategy — check sample size and risk.',
        nextStep: 'Review that strategy’s recent trades, or ask me to summarize the week.',
      };
    }
    case 'trade_why_open':
    case 'trade_why_close':
    case 'trade_explain_position': {
      const te = evidence.tradeExplanation;
      if (!te) {
        return {
          whatHappened: 'No trade context available.',
          why: 'Select a trade or provide a ticket id.',
          evidence: evidence.scopeNote,
          meaning: 'I will not invent an entry/exit reason.',
          nextStep: 'Pick a trade from the live rail, then ask again.',
        };
      }
      if (te.available && te.summary) {
        return {
          whatHappened: `Stored explanation for trade ${te.tradeId}: ${te.summary}`,
          why: 'This came from Profytron’s existing trade explanation record — not a guess.',
          evidence: (te.knownFacts || []).join(' · ') || 'AITradeExplanation store',
          meaning: 'Treat this as an interpretation of recorded analysis, not a guarantee.',
          nextStep: 'Ask about drawdown or week performance for broader context.',
        };
      }
      return {
        whatHappened: `No stored entry/exit rationale for trade ${te.tradeId || '(none)'}.`,
        why: 'The Trade model does not always keep an entry-reason, and explain-trade may not have run yet.',
        evidence: (te.knownFacts || []).join(' · ') || 'No explanation record',
        meaning: 'I will not invent signal logic. Here is only what the platform knows.',
        nextStep:
          'Open the trade in history for fills/timing, or ask me to summarize recent trades instead.',
      };
    }
    case 'portfolio_trades_today':
      return {
        whatHappened: `I count about ${evidence.tradeCountToday ?? 0} trade events touching today (open/close timestamps in sample).${errors}`,
        why: 'Counted from trade history / analytics available to your session.',
        evidence: evidence.scopeNote,
        meaning: 'Counts depend on timestamp fields returned by the API.',
        nextStep: 'Ask “Why am I down today?” for P&L context.',
      };
    case 'portfolio_largest_loss':
      return {
        whatHappened: evidence.largestLoss
          ? `Largest loss in sample: ${evidence.largestLoss.symbol || 'trade'} at ${money(evidence.largestLoss.pnl)}.`
          : `No loss found in the trade sample.${errors}`,
        why: 'Derived from trade P&L fields in history/analytics.',
        evidence: evidence.scopeNote,
        meaning: 'Sample-limited — not all-time unless tools returned full history.',
        nextStep: 'Ask to explain that trade if you select it.',
      };
    case 'portfolio_largest_gain':
      return {
        whatHappened: evidence.largestGain
          ? `Largest gain in sample: ${evidence.largestGain.symbol || 'trade'} at ${money(evidence.largestGain.pnl)}.`
          : `No gain found in the trade sample.${errors}`,
        why: 'Derived from trade P&L fields in history/analytics.',
        evidence: evidence.scopeNote,
        meaning: 'Sample-limited.',
        nextStep: 'Ask for a weekly summary for broader context.',
      };
    default:
      return {
        whatHappened: 'I can help with grounded portfolio, strategy, risk, trend, and advisory questions.',
        why: 'That question is outside the current grounded intent set.',
        evidence: 'No tools run for unknown intents.',
        meaning: 'Try a suggested question so I can pull Profytron data first.',
        nextStep:
          'Ask: “How is my portfolio today?”, “Compare my strategies”, “What’s my exposure?”, or “What should I review?”',
      };
  }
}

export function sectionsToPlainText(sections: {
  whatHappened: string;
  why: string;
  evidence: string;
  meaning: string;
  nextStep: string;
}): string {
  return [
    `What happened\n${sections.whatHappened}`,
    `Why\n${sections.why}`,
    `Evidence\n${sections.evidence}`,
    `What it means\n${sections.meaning}`,
    `Suggested next step\n${sections.nextStep}`,
  ].join('\n\n');
}

export const MVP_FOLLOW_UPS = [
  'How is my portfolio today?',
  'What needs attention?',
  'Compare my strategies',
  'What’s my exposure?',
  'Am I improving or declining?',
  'What should I review?',
  'Why am I down today?',
  'Explain this trade',
];
