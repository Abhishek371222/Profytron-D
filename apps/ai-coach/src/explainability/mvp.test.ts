import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyIntent,
  isMvpIntent,
  toolsForIntent,
  runExplainability,
} from '../index';

describe('intent-routing', () => {
  it('classifies MVP performance intents', () => {
    assert.equal(classifyIntent('Why am I down today?'), 'performance_down_today');
    assert.equal(classifyIntent('Summarize this week'), 'performance_summarize_week');
    assert.equal(classifyIntent('Explain my drawdown'), 'performance_drawdown');
    assert.equal(
      classifyIntent('Which strategy contributed most?'),
      'performance_best_strategy',
    );
  });

  it('classifies trade intents', () => {
    assert.equal(classifyIntent('Why was this trade opened?'), 'trade_why_open');
    assert.equal(classifyIntent('Why did it close?'), 'trade_why_close');
    assert.equal(classifyIntent('Explain this trade'), 'trade_explain_position');
  });

  it('classifies Program 2 portfolio intents', () => {
    assert.equal(classifyIntent('How is my portfolio today?'), 'portfolio_briefing');
    assert.equal(classifyIntent('Give me a 30-second summary'), 'portfolio_briefing');
    assert.equal(
      classifyIntent('What changed since yesterday?'),
      'portfolio_changed_since_yesterday',
    );
    assert.equal(classifyIntent('What needs attention?'), 'portfolio_needs_attention');
    assert.equal(
      classifyIntent('Where am I making money?'),
      'portfolio_where_making_money',
    );
  });

  it('classifies Programs 3–6 intents', () => {
    assert.equal(classifyIntent('Compare my strategies'), 'strategy_compare_all');
    assert.equal(classifyIntent("What's my exposure?"), 'risk_exposure_summary');
    assert.equal(classifyIntent('What’s my exposure?'), 'risk_exposure_summary');
    assert.equal(classifyIntent('Is my margin healthy?'), 'risk_margin_health');
    assert.equal(
      classifyIntent('Am I improving or declining?'),
      'trend_improving_or_declining',
    );
    assert.equal(classifyIntent('What should I review?'), 'advisory_review_suggestion');
  });

  it('unknown falls back', () => {
    assert.equal(classifyIntent('Tell me a joke about forex'), 'unknown');
    assert.equal(isMvpIntent('unknown'), false);
  });
});

describe('tool-routing', () => {
  it('routes drawdown to risk tools', () => {
    const tools = toolsForIntent('performance_drawdown');
    assert.ok(tools.includes('analytics_risk'));
  });

  it('routes trade explain to ai_explain_trade', () => {
    const tools = toolsForIntent('trade_why_open');
    assert.ok(tools.includes('ai_explain_trade'));
  });

  it('routes portfolio briefing to portfolio + strategies', () => {
    const tools = toolsForIntent('portfolio_briefing');
    assert.ok(tools.includes('analytics_portfolio'));
    assert.ok(tools.includes('analytics_strategy_comparison'));
  });

  it('unknown uses no tools', () => {
    assert.deepEqual(toolsForIntent('unknown'), []);
  });
});

describe('grounding + confidence + citations', () => {
  it('builds grounded answer without hallucinating when tools empty', async () => {
    const result = await runExplainability({
      message: 'Why am I down today?',
      fetchers: {
        analyticsTrades: async () => [],
        tradingHistory: async () => [],
        tradingOpen: async () => [],
      },
    });
    assert.equal(result.intent, 'performance_down_today');
    assert.match(result.plainText, /What happened/i);
    assert.ok(['High', 'Medium', 'Low'].includes(result.confidence));
    assert.ok(result.sections.nextStep.length > 10);
    assert.doesNotMatch(result.plainText, /you should buy|guaranteed profit/i);
  });

  it('builds portfolio briefing with health label', async () => {
    const result = await runExplainability({
      message: 'How is my portfolio today?',
      fetchers: {
        analyticsPortfolio: async () => ({
          totalProfit: -120,
          winRate: 42,
          liveEquity: 10000,
          liveBalance: 10200,
          liveFreeMargin: 8000,
          liveMargin: 2000,
          maxDrawdown: 3.2,
        }),
        analyticsStrategyComparison: async () => ({
          strategies: [
            { name: 'Gold Momentum', netPnl: -200, trades: 12 },
            { name: 'London Scalper', netPnl: 80, trades: 20 },
          ],
        }),
        analyticsRisk: async () => ({ maxDrawdown: 3.2 }),
        analyticsTrades: async () => [],
        tradingHistory: async () => [],
        tradingOpen: async () => [{ symbol: 'XAUUSD' }],
      },
    });
    assert.equal(result.intent, 'portfolio_briefing');
    assert.match(result.plainText, /portfolio briefing|Health|health/i);
    assert.ok(result.evidence.healthLabel);
    assert.ok(result.citations.length >= 1);
    assert.doesNotMatch(result.plainText, /I will (close|open|pause) your/i);
  });

  it('advisory never claims execution', async () => {
    const result = await runExplainability({
      message: 'What should I review?',
      fetchers: {
        analyticsPortfolio: async () => ({ totalProfit: -50, winRate: 40, maxDrawdown: 9 }),
        analyticsRisk: async () => ({ maxDrawdown: 9, largestLoss: -400 }),
        analyticsStrategyComparison: async () => ({
          strategies: [{ name: 'A', netPnl: -80, trades: 10 }],
        }),
        analyticsTrades: async () => [],
        tradingHistory: async () => [],
        tradingOpen: async () => [],
      },
    });
    assert.equal(result.intent, 'advisory_review_suggestion');
    assert.match(result.plainText, /advisory|review/i);
    assert.doesNotMatch(
      result.plainText,
      /I (will|have) (close|closed|paused|opened|executed)/i,
    );
  });

  it('does not invent trade rationale when explain missing', async () => {
    const result = await runExplainability({
      message: 'Why was this trade opened?',
      tradeIdHint: 'abc-123',
      fetchers: {
        explainTrade: async () => {
          throw new Error('unavailable');
        },
        tradingHistory: async () => [
          { id: 'abc-123', symbol: 'XAUUSD', status: 'OPEN', side: 'BUY' },
        ],
        tradingOpen: async () => [],
      },
    });
    assert.match(result.plainText, /No stored entry\/exit rationale|will not invent/i);
    assert.ok(result.confidence === 'Low' || result.confidence === 'Medium');
  });

  it('unknown intent suggests follow-ups', async () => {
    const result = await runExplainability({
      message: 'Write me a haiku',
      fetchers: {},
    });
    assert.equal(result.intent, 'unknown');
    assert.ok(result.followUps.length >= 3);
  });
});

describe('hallucination / action policy', () => {
  it('never suggests autonomous execution', async () => {
    const result = await runExplainability({
      message: 'Summarize this week',
      fetchers: {
        analyticsPortfolio: async () => ({ totalPnl: -50, winRate: 40 }),
        analyticsTrades: async () => [],
        analyticsStrategyComparison: async () => [],
        tradingHistory: async () => [],
      },
    });
    assert.doesNotMatch(
      result.plainText,
      /I (will|have) (close|closed|paused|opened) (your|the) (trade|position|bot)/i,
    );
  });
});
