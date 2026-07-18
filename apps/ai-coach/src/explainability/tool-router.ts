import type { CoachIntent, ToolId } from './types';

/** Minimum tool set per intent — no recursive agent loops. */
export function toolsForIntent(intent: CoachIntent): ToolId[] {
  switch (intent) {
    case 'performance_down_today':
    case 'portfolio_trades_today':
    case 'portfolio_largest_loss':
    case 'portfolio_largest_gain':
    case 'portfolio_changed_since_yesterday':
    case 'strategy_losing_symbols':
      return ['analytics_trades', 'trading_history', 'trading_open'];

    case 'performance_summarize_week':
    case 'portfolio_how_performing':
    case 'portfolio_briefing':
    case 'portfolio_needs_attention':
    case 'portfolio_where_making_money':
    case 'portfolio_where_losing':
    case 'advisory_review_suggestion':
    case 'advisory_what_to_watch':
    case 'advisory_improve_consistency':
      return [
        'analytics_portfolio',
        'analytics_trades',
        'analytics_strategy_comparison',
        'analytics_risk',
        'trading_history',
        'trading_open',
      ];

    case 'performance_drawdown':
    case 'portfolio_whats_my_risk':
    case 'performance_highest_risk':
    case 'risk_exposure_summary':
    case 'risk_margin_health':
    case 'risk_concentration':
    case 'risk_heat':
    case 'risk_worst_case':
    case 'risk_by_symbol':
    case 'risk_by_strategy':
      return ['analytics_risk', 'analytics_portfolio', 'trading_open', 'coaching_report'];

    case 'performance_best_strategy':
    case 'performance_worst_strategy':
    case 'performance_highest_profit':
    case 'strategy_compare_all':
    case 'strategy_underperforming_why':
    case 'strategy_degraded':
    case 'strategy_improving':
    case 'strategy_session_performance':
    case 'strategy_holding_time':
      return [
        'analytics_strategy_comparison',
        'analytics_portfolio',
        'analytics_trades',
        'coaching_report',
      ];

    case 'trend_improving_or_declining':
    case 'trend_winrate_vs_avg_loss':
    case 'trend_volatility_change':
      return ['analytics_portfolio', 'analytics_risk', 'analytics_trades'];

    case 'trade_why_open':
    case 'trade_why_close':
    case 'trade_explain_position':
      return ['ai_explain_trade', 'trading_history', 'trading_open'];

    default:
      return [];
  }
}
