export type Guide = {
  slug: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  title: string;
  desc: string;
  readTime: string;
  content: string;
};

export const GUIDES: Guide[] = [
  {
    slug: 'introduction-to-algorithmic-trading',
    category: 'Algorithmic Strategies',
    level: 'Beginner',
    title: 'Introduction to Algorithmic Trading',
    desc: 'The fundamentals of systematic trading: how algorithms replace discretion and why execution consistency creates an edge over time.',
    readTime: '10 min',
    content: `Algorithmic trading means encoding a trading decision — when to enter, when to exit, how much to risk — into rules a computer executes without you clicking a button. It sounds simple, but the reason it works is not speed. It's consistency.

## Why Discretion Fails Over Time

A human trader makes the same decision differently on a good day versus a bad day. Fear after a loss makes the next entry late. Confidence after a win makes the next position too large. None of this shows up as a single bad trade — it shows up as a slow erosion of edge across hundreds of trades, invisible until you look at the aggregate numbers.

An algorithm applies the same rule the 500th time it fires as it did the first time. That's the entire value proposition before you even talk about backtesting or optimization.

## The Three Components of Any Strategy

Every algorithmic strategy, however sophisticated, reduces to three parts:

**Entry logic** — the condition that triggers a position. This can be as simple as a moving-average crossover or as complex as a multi-factor model blending technical, fundamental, and sentiment inputs.

**Exit logic** — when to close the position, win or lose. This is where most retail strategies are weakest: entries get all the attention, exits are an afterthought.

**Risk sizing** — how much capital to commit to a given signal. A strategy with a mediocre entry and disciplined sizing will usually outperform a strategy with a brilliant entry and no sizing discipline.

## Paper Trading Before Capital

Before any strategy touches live capital, it should run against real-time data with simulated fills. This surfaces problems a backtest can't: how the strategy behaves during a flat, directionless market; how often it's stopped out only for price to reverse immediately after; whether the signal frequency matches what you expected.

## Where This Goes on Profytron

A bot on Profytron is exactly this: entry logic, exit logic, and risk sizing, running against your connected broker account (or paper trading) without you needing to watch a screen. The AI Risk Engine sits on top as a portfolio-level backstop — independent of any individual bot's logic — so a single bad signal doesn't compound into an account-level problem.

The next guide in this series, Kelly Criterion & Position Sizing, goes deeper into the risk-sizing component specifically, since it's the piece most beginner strategies get wrong first.`,
  },
  {
    slug: 'kelly-criterion-position-sizing',
    category: 'Risk Management',
    level: 'Intermediate',
    title: 'Kelly Criterion & Position Sizing',
    desc: 'How to size positions to maximize geometric growth without risking ruin — the mathematics behind institutional bankroll management.',
    readTime: '14 min',
    content: `Most traders spend their time on entries and almost none on sizing. This is backwards. A mediocre edge with correct sizing compounds; a great edge with careless sizing eventually blows up. The Kelly Criterion is the formal answer to "how much should I bet."

## The Core Formula

For a simple win/loss bet, the Kelly fraction is:

f* = W − [(1 − W) / R]

Where W is your win probability and R is your win/loss payoff ratio (average win divided by average loss). The output, f*, is the fraction of your bankroll to risk on the next trade.

If you win 55% of the time and your average win is 1.2x your average loss, Kelly says risk roughly 10% of capital on the next signal. That number surprises most people — it's usually far smaller than what discretionary traders risk intuitively after a winning streak, and it changes every time your estimated win rate or payoff ratio changes.

## Why Full Kelly Is Rarely Used in Practice

Full Kelly sizing maximizes long-run geometric growth, but it comes with brutal short-term volatility — drawdowns of 50%+ are mathematically expected even when the strategy is working exactly as designed. Almost no institutional desk runs full Kelly for this reason.

The common practice is **fractional Kelly** — typically 25-50% of the full Kelly fraction. You give up some theoretical growth rate in exchange for a drawdown profile a human (or a risk committee) can actually tolerate without panicking and abandoning the strategy at the worst possible time.

## The Estimation Problem

Kelly sizing is only as good as your inputs. Win rate and payoff ratio are estimated from historical data, and both are noisy, especially for strategies with a limited trade history. Overestimating your edge and sizing on the resulting inflated Kelly fraction is a common way accounts blow up.

The practical fix is to size conservatively — fractional Kelly using a deliberately pessimistic win-rate estimate — and let sizing scale up gradually only as the strategy accumulates a longer live track record.

## Position Sizing Beyond a Single Bet

Real portfolios run multiple concurrent strategies, and Kelly sizing for a single bet doesn't directly generalize to correlated, simultaneous positions. Two strategies that look independent in isolation can draw down together if they're both long the same underlying market regime. Position sizing at the portfolio level needs to account for this correlation, not just each strategy's individual Kelly fraction.

## How This Maps to Profytron's Risk Controls

Every bot on Profytron has explicit drawdown limits and maximum position-size controls, and the AI Risk Engine monitors correlated exposure across every bot and copy-trading relationship in your account — not just the sizing rules a single strategy declares for itself. If aggregate drawdown breaches your configured limit, the platform stops new trade execution automatically, regardless of what any individual strategy's internal logic wants to do next.

Sizing discipline is the least exciting part of trading and the most important. Get the entries roughly right and the sizing exactly right, and you have something durable.`,
  },
  {
    slug: 'order-flow-toxicity-adverse-selection',
    category: 'Market Microstructure',
    level: 'Advanced',
    title: 'Order Flow Toxicity & Adverse Selection',
    desc: 'Understanding why certain order flows are exploited by market makers, and how to measure the "toxicity" of your execution.',
    readTime: '18 min',
    content: `Every time you send a market order, someone on the other side is deciding whether trading against you is profitable. If your order flow is predictable — "toxic," in market microstructure terms — market makers price that risk into the spread you pay, and you lose money on execution before your strategy's edge even has a chance to play out.

## What Makes Flow Toxic

Order flow is toxic when it's informed and directional in a way a market maker can detect. If you consistently buy right before price moves up, market makers who trade against you lose money on average, so they either widen spreads for flow that resembles yours, or they pull quotes entirely when they suspect informed flow is present.

Retail algorithmic strategies often generate accidentally toxic-looking flow — for example, an execution algorithm that always crosses the spread the moment a signal fires produces a very recognizable, exploitable pattern, even if the strategy's actual signal has no real informational edge.

## The VPIN Framework

Volume-synchronized Probability of Informed Trading (VPIN) is one common way practitioners estimate how toxic current order flow is, using volume-bucketed order imbalance rather than clock time. Elevated VPIN readings tend to precede periods of adverse selection risk and, historically, some flash-crash-style liquidity events — market makers widen or withdraw, liquidity thins, and execution quality for anyone still trading degrades sharply.

For a systematic trader, tracking a proxy for order flow toxicity isn't about predicting a flash crash. It's a practical signal for when to reduce order aggressiveness or pause execution — periods of high estimated toxicity are exactly when crossing the spread with a market order is most expensive relative to its historical average.

## Reducing Your Own Adverse Selection Cost

A few practical mitigations that don't require institutional infrastructure:

**Randomize execution timing.** A strategy that always executes at the exact same interval after signal generation is trivially detectable. Adding controlled randomness to order timing reduces pattern recognition risk.

**Use limit orders where the strategy tolerates it.** Market orders guarantee execution but pay the full spread and signal urgency. Limit orders cost you fill-rate certainty but avoid paying for information you're not confident you have.

**Split large orders.** A single large order reveals size and urgency. Slicing it into smaller pieces over time reduces market impact, at the cost of execution-price uncertainty across the slicing window.

## Why This Matters More Than It Seems

A strategy can have a genuinely positive edge in its entry logic and still lose money after execution costs, if those costs are dominated by adverse selection rather than the visible bid-ask spread. This is one of the most common reasons a promising backtest — which usually assumes fills at the mid or at the quoted spread — underperforms live, where realized execution cost includes the toxicity premium market makers charge for flow that looks like yours.

Profytron's backtesting engine models transaction costs including spread and estimated slippage by default (see our related article on backtest bias), but no backtest can fully substitute for live execution data. Monitoring realized slippage against expected slippage on your live trades is the single best early-warning signal that your flow has become more predictable — and more expensive to execute — than it used to be.`,
  },
  {
    slug: 'mean-reversion-vs-momentum-strategies',
    category: 'Algorithmic Strategies',
    level: 'Intermediate',
    title: 'Mean Reversion vs. Momentum Strategies',
    desc: 'When markets mean-revert and when they trend — a framework for regime detection and strategy selection.',
    readTime: '12 min',
    content: `Mean reversion and momentum are the two dominant strategy families in systematic trading, and they are structurally opposed: a mean-reversion strategy bets that a large move will partially reverse, while a momentum strategy bets that a move will continue. Running both without regime awareness means one is usually fighting the other.

## Why Both Exist

Markets aren't in one persistent state. Range-bound, low-trend regimes reward mean reversion — price oscillates around a level, and betting on reversion after an extreme captures that oscillation. Trending regimes punish mean reversion badly, because "buying the dip" during a genuine trend break means repeatedly buying into a decline that keeps declining.

Momentum strategies have the inverse problem: they perform well during sustained trends and get chopped up during range-bound, mean-reverting periods, where every breakout attempt fails and reverses.

## Simple Regime Indicators

You don't need a sophisticated hidden Markov model to get useful regime signal. A few practical, well-understood approaches:

**ADX (Average Directional Index)** measures trend strength independent of direction. Low ADX suggests a ranging market where mean reversion is more likely to work; high and rising ADX suggests a trending regime favoring momentum.

**Realized volatility relative to its own historical average.** Volatility expansion often (though not always) accompanies trend regime changes, while volatility compression tends to precede or accompany range-bound conditions.

**Autocorrelation of returns.** Positive short-term autocorrelation is a momentum signature; negative autocorrelation is a mean-reversion signature. This can be estimated on a rolling window as a direct, if noisy, regime classifier.

## Why Running Both Blindly Fails

If you deploy a mean-reversion bot and a momentum bot on the same instrument without regime gating, you get a strategy that's effectively flat on average — the momentum bot's wins during trends are offset by the mean-reversion bot's losses during the same trends, and vice versa during ranges. This isn't diversification; it's cancellation, and it usually comes with double the transaction costs of running either strategy alone.

The fix isn't necessarily to pick one family permanently. It's to gate exposure — reduce or disable the mean-reversion bot's position sizing when regime indicators point to a strong trend, and vice versa.

## Building This on Profytron

Profytron's Strategy Builder lets you compose conditional logic — including regime-gating conditions like ADX thresholds — directly into a bot's entry rules, so a mean-reversion strategy can be configured to reduce size or stand down when trend-strength indicators exceed a threshold, rather than trading blind through every regime. (Strategy Builder is in active development; check the in-app roadmap for current availability.)

Neither family is "better." The traders who struggle with both are usually running one family through every regime instead of matching the strategy to the market's current character.`,
  },
  {
    slug: 'building-a-sentiment-driven-signal-pipeline',
    category: 'AI & Signal Analysis',
    level: 'Advanced',
    title: 'Building a Sentiment-Driven Signal Pipeline',
    desc: 'Ingesting news, social, and alternative data sources into a real-time scoring pipeline that feeds execution logic.',
    readTime: '20 min',
    content: `A sentiment pipeline turns unstructured text — news, filings, social posts — into a structured, numeric input a trading strategy can consume. The hard part isn't calling a language model; it's building a pipeline that's fast enough, filtered enough, and calibrated enough to be useful rather than noisy.

## Stage 1: Ingestion and Filtering

Raw text volume is enormous, and most of it is irrelevant to any given instrument. The first pipeline stage needs to filter aggressively: entity extraction to tag which tickers or assets a piece of text actually references, source-quality filtering (a regulatory filing and an anonymous social post shouldn't be weighted the same), and deduplication, since the same story often gets re-reported dozens of times within minutes.

Skipping this stage and feeding raw, unfiltered text volume into a scoring model is the single most common reason sentiment pipelines produce noisy, low-value signals.

## Stage 2: Scoring

Discrete positive/negative/neutral labels are too coarse for anything beyond a rough filter. A continuous, rankable score — extracted from logits rather than the model's final text label — is far more useful, because it lets you compare sentiment intensity across many instruments simultaneously and feed a graded signal into portfolio construction rather than a binary flag.

Domain-tuned models meaningfully outperform general-purpose models on this task. Financial language is full of phrasing that reads neutral or even positive on the surface but carries a clearly negative implication to anyone familiar with earnings-call conventions — "maintaining guidance despite headwinds" is a common example. A model fine-tuned on financial text tends to catch this; a general-purpose model often doesn't.

## Stage 3: Latency Budgeting

Not every use case needs the same speed. A pipeline informing a multi-day positioning model can tolerate seconds of latency from a larger, more capable model. A pipeline meant to react to a breaking headline within a market's reaction window needs a smaller, faster model running inference in low double-digit milliseconds, even if it sacrifices some nuance versus a larger model.

Most production pipelines run both tiers in parallel — a fast, lightweight model for immediate classification and a slower, larger model that revises the signal shortly after with more context — rather than picking one tradeoff for every use case.

## Stage 4: Guardrails, Not Blind Trust

Sentiment scores should never directly control position sizing without bounds. Model outputs are wrong sometimes — a sarcastic headline, an ambiguous quote, a mistranslated or misattributed report can produce a confidently wrong score. Production pipelines cap the maximum position-sizing influence any single sentiment reading can have, and treat sentiment as one input that's combined with price-based and fundamental signals rather than the sole trigger for a trade.

## How Profytron's Alpha Coach and Signal Core AI Relate

Signal Core AI's real-time classification layer follows this same two-tier architecture — lightweight models for immediate event scoring, larger contextual models for longer-horizon analysis — and its outputs feed into strategy logic as one input among several, bounded by the same drawdown and position-sizing limits enforced by the AI Risk Engine for every other signal type.

A sentiment pipeline is a genuinely useful input. It is not, on its own, a trading strategy — treat it as a filter and a tilt, not a trigger.`,
  },
  {
    slug: 'understanding-drawdown-and-maximum-risk',
    category: 'Risk Management',
    level: 'Beginner',
    title: 'Understanding Drawdown & Maximum Risk',
    desc: "How to measure, monitor, and set hard limits on portfolio drawdown — the system behind Profytron's AI Risk Engine.",
    readTime: '8 min',
    content: `Drawdown is the single most important number in trading that beginners underweight. It's the percentage decline from your account's highest recorded value (a "peak") to its current value. A strategy can have an excellent average return and still be unusable in practice if its drawdowns are deep enough to be psychologically or financially unbearable.

## Why Average Return Isn't Enough

A strategy that returns 30% a year on average but occasionally draws down 60% is not the same product as one that returns 20% a year with a 15% maximum drawdown, even though the first has the better average. Most traders — and most capital allocators — cannot tolerate a 60% drawdown without abandoning the strategy, usually at the worst possible moment, right before it recovers.

This is why maximum drawdown, not average return, is the number that determines whether a strategy is actually usable, not just theoretically profitable.

## Two Kinds of Drawdown Limits

**Per-trade risk** caps how much a single position can lose — typically expressed as a percentage of account equity, enforced via a stop-loss or equivalent exit rule.

**Portfolio-level drawdown** caps the account's total decline from its peak, across every open position and strategy simultaneously. This is the more important limit, because it catches correlated losses across multiple positions that no single per-trade stop would flag — several strategies losing modestly at the same time can still breach a portfolio-level limit even if no individual trade looks alarming.

## Setting a Realistic Limit

A common starting point is capping maximum portfolio drawdown well below the level that would cause real financial or psychological distress — often in the 10-20% range for most retail accounts, though the right number depends entirely on your own capital, timeline, and risk tolerance. The important part isn't the specific number; it's that the limit is set in advance, before a losing streak, and enforced automatically rather than relying on willpower in the moment.

## What Happens When a Limit Is Breached

A well-designed system doesn't just alert you — it acts. That typically means halting new trade entries, and in more severe cases, closing open positions to stop further loss, without requiring you to be watching a screen at the exact moment the limit is crossed.

## Profytron's AI Risk Engine

This is exactly what the AI Risk Engine does at the account level: it monitors drawdown in real time across every bot and copy-trading relationship you're running, and if your configured drawdown limit is breached, it automatically stops new copy trading and can close open positions rather than waiting for you to intervene manually. It also watches for unusual volatility events — news spikes, flash-crash-style moves — and can pause trading temporarily even before a hard drawdown limit is technically breached.

Set your limit deliberately, before you need it. A drawdown limit you configure calmly in advance is far more reliable than a decision you'll make in the middle of a losing streak.`,
  },
  {
    slug: 'the-economics-of-market-making',
    category: 'Market Microstructure',
    level: 'Intermediate',
    title: 'The Economics of Market Making',
    desc: 'Why spreads exist, how market makers profit from them, and how directional traders can avoid being picked off.',
    readTime: '16 min',
    content: `The bid-ask spread isn't an arbitrary fee — it's compensation a market maker demands for the risk of holding inventory and trading against potentially better-informed counterparties. Understanding this economic relationship explains a surprising amount about why your orders get filled the way they do.

## Why Market Makers Exist

A market maker continuously quotes both a bid (price they'll buy at) and an ask (price they'll sell at), providing liquidity so other participants don't need to wait for a natural counterparty. In exchange for providing this immediacy, they capture the spread — buying at the bid, selling at the ask, profiting from the difference when both sides execute.

This only works if, on average, the spread they earn exceeds the losses they take from two sources: inventory risk (holding a position while price moves against them before they can offload it) and adverse selection (trading against a counterparty who has better information than they do).

## How Spreads Widen

Spreads aren't fixed — they respond to perceived risk in real time. During high volatility, a market maker's inventory risk rises (price can move further against them before they exit), so spreads widen to compensate. When order flow looks informed or directional (see our related article on order flow toxicity), adverse selection risk rises, and spreads widen again, or market makers pull quotes entirely.

This is why spreads during news events or the first minutes after market open are often several times wider than during calm, liquid mid-session trading — market makers are pricing in genuinely elevated risk, not arbitrarily extracting more profit.

## What This Means for Directional Traders

If you're a directional trader (as opposed to a market maker), the spread is a cost you pay on every round trip, and it's largest exactly when you might be most tempted to trade — during volatile, news-driven moves. A strategy that trades frequently in exactly these conditions can find spread costs eating a large share of its gross edge.

Two practical implications: first, backtests that don't model realistic, time-varying spread costs (assuming a fixed average spread) will systematically overstate strategy performance during volatile periods. Second, all else equal, a strategy that can tolerate limit orders instead of market orders avoids paying the full spread on entry, at the cost of fill-rate uncertainty.

## Picking Off and Latency

"Picking off" refers to trading against a market maker's stale quote before they've had a chance to update it — for example, if news breaks and a fast trader executes against the market maker's old bid before it widens. This is one of the reasons market makers invest heavily in low-latency infrastructure themselves: the faster they can update quotes in response to new information, the less exposure they have to being picked off by faster counterparties.

## The Practical Takeaway

You don't need to out-compete market makers on speed — that's a race retail traders generally can't win. What you can control is when and how you cross the spread: avoiding unnecessary market orders during known high-spread windows, using limit orders where your strategy's timing tolerance allows, and treating realized (not assumed) spread cost as a live input to whether a strategy is actually profitable after execution.`,
  },
  {
    slug: 'macd-rsi-and-signal-stacking',
    category: 'AI & Signal Analysis',
    level: 'Beginner',
    title: 'MACD, RSI, and Signal Stacking',
    desc: 'Classic technical indicators explained rigorously — and how Signal Core AI validates or overrides them with multi-modal inputs.',
    readTime: '9 min',
    content: `MACD and RSI are two of the oldest technical indicators still in wide use, and for good reason — they're computationally simple, well understood, and capture genuinely different information. Used together, and understood rigorously rather than as black-box signals, they remain a reasonable foundation for a beginner strategy.

## MACD: Trend and Momentum

MACD (Moving Average Convergence Divergence) is the difference between a fast and a slow exponential moving average, plotted alongside a signal line (typically a moving average of the MACD line itself). When the MACD line crosses above its signal line, it suggests short-term momentum is turning positive relative to the longer trend; a cross below suggests the opposite.

MACD is fundamentally a trend/momentum indicator — it tends to perform reasonably in trending regimes and generate frequent, low-quality whipsaw signals in range-bound markets, which is exactly the regime problem covered in our mean-reversion vs. momentum guide.

## RSI: Overbought and Oversold Conditions

RSI (Relative Strength Index) measures the magnitude of recent gains versus recent losses on a 0-100 scale. Readings above 70 are conventionally read as "overbought," below 30 as "oversold." The common beginner mistake is treating these thresholds as automatic reversal signals — in a strong trend, RSI can remain above 70 for an extended period while price keeps climbing, and shorting "overbought" conditions during a genuine trend is a reliable way to lose money.

RSI is more useful as a divergence signal — when price makes a new high but RSI fails to make a corresponding new high, that divergence can indicate weakening momentum before it shows up in price. This is a meaningfully different (and generally more robust) use than a naive threshold-crossing rule.

## Why Stacking Beats Either Alone

Neither indicator alone is a strategy — they're each one data point about market state. Stacking MACD (trend/momentum context) with RSI (mean-reversion/exhaustion context) gives a strategy a way to distinguish "trend continuation" setups from "reversal" setups, rather than applying the same rule blindly regardless of what regime the market is actually in.

A simple, well-understood stacking approach: use MACD direction to establish the dominant trend bias, and use RSI divergence — not raw threshold crossing — to time entries within that established trend, rather than fighting it.

## Where Signal Core AI Fits In

Classic indicators like MACD and RSI are deterministic and fully explainable — you always know exactly why a signal fired. Signal Core AI is designed to sit alongside these, not replace them: it can validate a technical signal against real-time sentiment and event context (does the news environment support this technical setup, or contradict it?) and can down-weight or override a technical signal when contextual signals disagree strongly.

The goal isn't to replace indicators traders already understand — it's to give well-understood, explainable signals a second, independent check before they translate into a live position.`,
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function getAllGuideSlugs(): string[] {
  return GUIDES.map((g) => g.slug);
}
