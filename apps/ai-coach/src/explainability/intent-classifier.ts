import type { CoachIntent } from './types.ts';

const RULES: Array<{ intent: CoachIntent; patterns: RegExp[] }> = [
  // —— Program 2 Portfolio (before generic performance overlaps) ——
  {
    intent: 'portfolio_briefing',
    patterns: [
      /30[-\s]?second\s+summary/i,
      /portfolio\s+(briefing|summary|today)/i,
      /how\s+is\s+my\s+portfolio/i,
      /give\s+me\s+a\s+(quick\s+)?summary/i,
      /quick\s+(portfolio\s+)?summary/i,
    ],
  },
  {
    intent: 'portfolio_changed_since_yesterday',
    patterns: [
      /what\s+changed\s+(since\s+)?yesterday/i,
      /changed\s+since\s+yesterday/i,
      /vs\s+yesterday/i,
    ],
  },
  {
    intent: 'portfolio_needs_attention',
    patterns: [
      /what\s+needs\s+attention/i,
      /needs?\s+attention/i,
      /anything\s+(wrong|concerning|to\s+worry)/i,
    ],
  },
  {
    intent: 'portfolio_where_making_money',
    patterns: [
      /where\s+(am\s+i|i'?m)\s+making\s+money/i,
      /where\s+(are\s+)?(my\s+)?(profits|gains)/i,
      /making\s+money/i,
    ],
  },
  {
    intent: 'portfolio_where_losing',
    patterns: [
      /where\s+(am\s+i|i'?m)\s+losing/i,
      /where\s+(are\s+)?(my\s+)?losses/i,
      /losing\s+money/i,
    ],
  },
  // —— Program 3 Strategy ——
  {
    intent: 'strategy_compare_all',
    patterns: [
      /compare\s+(my\s+)?strateg/i,
      /strategy\s+comparison/i,
      /how\s+do\s+(my\s+)?strategies\s+compare/i,
    ],
  },
  {
    intent: 'strategy_underperforming_why',
    patterns: [
      /why\s+(is\s+)?(this\s+|my\s+)?strateg\w*\s+underperform/i,
      /underperform(ing)?/i,
    ],
  },
  {
    intent: 'strategy_degraded',
    patterns: [/degrad(ed|ing)/i, /which\s+strateg\w*\s+(has\s+)?(got\s+)?worse/i],
  },
  {
    intent: 'strategy_improving',
    patterns: [
      /which\s+strateg\w*\s+(is\s+)?improv/i,
      /strateg\w*\s+improv/i,
      /is\s+(this\s+)?strateg\w*\s+improv/i,
    ],
  },
  {
    intent: 'strategy_session_performance',
    patterns: [/win\s+rate\s+by\s+session/i, /session\s+(performance|win\s*rate)/i],
  },
  {
    intent: 'strategy_losing_symbols',
    patterns: [/losing\s+symbols?/i, /worst\s+symbols?/i, /symbols?\s+(hurting|losing)/i],
  },
  {
    intent: 'strategy_holding_time',
    patterns: [/holding\s+time/i, /avg(erage)?\s+hold/i],
  },
  // —— Program 4 Risk ——
  {
    intent: 'risk_exposure_summary',
    patterns: [
      /what(['’]?s| is)\s+my\s+exposure/i,
      /current\s+exposure/i,
      /exposure\s+summary/i,
    ],
  },
  {
    intent: 'risk_margin_health',
    patterns: [/margin\s+(healthy|health)/i, /is\s+my\s+margin/i],
  },
  {
    intent: 'risk_concentration',
    patterns: [/concentrati/i, /am\s+i\s+concentrated/i, /too\s+concentrated/i],
  },
  {
    intent: 'risk_heat',
    patterns: [/portfolio\s+heat/i, /\bheat\b.*portfolio|portfolio.*\bheat\b/i],
  },
  {
    intent: 'risk_worst_case',
    patterns: [/worst\s+case/i, /worst[-\s]?case\s+today/i],
  },
  {
    intent: 'risk_by_symbol',
    patterns: [/risk\s+by\s+symbol/i, /symbol\s+risk/i],
  },
  {
    intent: 'risk_by_strategy',
    patterns: [/risk\s+by\s+strateg/i, /strateg\w*\s+risk/i],
  },
  // —— Program 5 Trends ——
  {
    intent: 'trend_improving_or_declining',
    patterns: [
      /am\s+i\s+(improving|declining)/i,
      /improving\s+or\s+declining/i,
      /performance\s+trend/i,
      /getting\s+better\s+or\s+worse/i,
    ],
  },
  {
    intent: 'trend_winrate_vs_avg_loss',
    patterns: [/win\s*rate\s+vs/i, /win\s*rate.*average\s+loss/i, /avg(erage)?\s+loss/i],
  },
  {
    intent: 'trend_volatility_change',
    patterns: [/volatilit/i, /has\s+volatilit/i],
  },
  // —— Program 6 Advisory ——
  {
    intent: 'advisory_review_suggestion',
    patterns: [
      /what\s+should\s+i\s+review/i,
      /what\s+to\s+review/i,
      /review\s+suggestion/i,
    ],
  },
  {
    intent: 'advisory_what_to_watch',
    patterns: [/what\s+should\s+i\s+watch/i, /what\s+to\s+watch/i, /watch\s+(list|next)/i],
  },
  {
    intent: 'advisory_improve_consistency',
    patterns: [
      /improve\s+consistency/i,
      /more\s+consistent/i,
      /how\s+can\s+i\s+improve/i,
    ],
  },
  // —— Program 1 performance / trade ——
  {
    intent: 'performance_down_today',
    patterns: [
      /why\s+(am\s+i|is\s+my\s+account)\s+down/i,
      /down\s+today/i,
      /losing\s+(today|money\s+today)/i,
      /negative\s+(today|pnl|p&l)/i,
    ],
  },
  {
    intent: 'performance_summarize_week',
    patterns: [
      /summarize\s+(this\s+|my\s+)?week/i,
      /week('?s)?\s+performance/i,
      /how\s+did\s+i\s+do\s+this\s+week/i,
      /weekly\s+summary/i,
    ],
  },
  {
    intent: 'performance_drawdown',
    patterns: [
      /explain\s+(my\s+)?drawdown/i,
      /what\s+(does|is)\s+(my\s+)?drawdown/i,
      /drawdown\s+mean/i,
    ],
  },
  {
    intent: 'performance_best_strategy',
    patterns: [
      /best\s+strategy/i,
      /which\s+strategy\s+(contributed\s+)?(most|best|highest)/i,
      /top\s+strateg/i,
    ],
  },
  {
    intent: 'performance_worst_strategy',
    patterns: [/worst\s+strategy/i, /which\s+strategy\s+(hurt|worst|lowest)/i],
  },
  {
    intent: 'performance_highest_risk',
    patterns: [/highest\s+risk/i, /most\s+risk/i, /riskiest/i],
  },
  {
    intent: 'performance_highest_profit',
    patterns: [/highest\s+profit/i, /most\s+profit/i, /biggest\s+winner\s+strategy/i],
  },
  {
    intent: 'trade_why_open',
    patterns: [
      /why\s+(was\s+)?(this\s+)?trade\s+open/i,
      /why\s+(did\s+)?(this\s+)?(trade\s+)?enter/i,
      /why\s+opened/i,
    ],
  },
  {
    intent: 'trade_why_close',
    patterns: [
      /why\s+(was\s+)?(this\s+)?trade\s+clos/i,
      /why\s+(did\s+)?(it|this)\s+close/i,
      /why\s+closed/i,
    ],
  },
  {
    intent: 'trade_explain_position',
    patterns: [
      /explain\s+(this\s+)?(trade|position)/i,
      /what\s+happened\s+here/i,
      /explain\s+ticket/i,
    ],
  },
  {
    intent: 'portfolio_how_performing',
    patterns: [
      /how\s+am\s+i\s+performing/i,
      /how\s+am\s+i\s+doing/i,
      /overall\s+performance/i,
    ],
  },
  {
    intent: 'portfolio_whats_my_risk',
    patterns: [/what('?s| is)\s+my\s+risk/i, /explain\s+my\s+risk/i, /risk\s+level/i],
  },
  {
    intent: 'portfolio_trades_today',
    patterns: [/how\s+many\s+trades\s+today/i, /trades?\s+today/i],
  },
  {
    intent: 'portfolio_largest_loss',
    patterns: [/largest\s+loss/i, /biggest\s+loss/i, /worst\s+trade/i],
  },
  {
    intent: 'portfolio_largest_gain',
    patterns: [/largest\s+gain/i, /biggest\s+gain/i, /best\s+trade/i, /largest\s+winner/i],
  },
];

export function classifyIntent(message: string): CoachIntent {
  const text = message.trim();
  if (!text) return 'unknown';
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(text))) return rule.intent;
  }
  return 'unknown';
}

/** True when intent is handled by the grounded explainability pipeline. */
export function isMvpIntent(intent: CoachIntent): boolean {
  return intent !== 'unknown';
}

export const isGroundedIntent = isMvpIntent;
