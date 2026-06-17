export type BlogPost = { id: string; category: string; tag: string; title: string; excerpt: string; date: string; readTime: string; content: string; };

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'backtesting-lies',
    category: 'Strategy Engineering',
    tag: 'bg-primary/10 border-primary/20 text-primary',
    title: 'Why Your Backtest Is Probably Lying to You',
    excerpt:
      'Survivorship bias, look-ahead bias, and overfitting are the three silent killers of algorithmic strategies. Here\'s how we think about them at Profytron.',
    date: 'Apr 8, 2026',
    readTime: '7 min read',
    content: `Most traders encounter backtesting the same way: you spend hours perfecting a strategy, run it against five years of historical data, and watch the equity curve climb beautifully to the top right. Then you go live — and it bleeds.

This isn't bad luck. It's a predictable result of three structural problems that corrupt almost every backtest if you're not deliberately guarding against them.

## 1. Survivorship Bias

When you run a strategy against "the S&P 500" using today's index constituents, you're only testing against companies that survived to today. The companies that went bankrupt, got delisted, or were dropped from the index during your test period simply don't appear in your data.

This creates an invisible thumb on the scale. Strategies that buy dips, for example, look far better than they actually are — because the dips in your backtest all recovered (the companies were still around to recover). The dips that didn't recover aren't in your dataset.

**The fix:** Use point-in-time data that reflects what the universe of tradeable assets actually looked like at each moment in history, not what it looks like today.

## 2. Look-Ahead Bias

Look-ahead bias is using information at decision time that you couldn't have actually had at that moment. It's surprisingly easy to introduce accidentally.

A common example: using a daily bar's closing price to trigger a signal "at the open" of the same day. In your code, the close is already in the data row. But in real life, you wouldn't have known the closing price at market open — you'd only know it hours later.

Another example: using adjusted price data without realizing that dividend adjustments are retroactively applied. Your strategy in 2019 is "seeing" prices that weren't available to anyone in 2019.

**The fix:** Implement strict temporal discipline. Your signal-generation logic should only consume data that was observable before the timestamp of the trade it generates.

## 3. Overfitting (Curve-Fitting)

This is the most seductive trap. You have 15 parameters. You run thousands of combinations through an optimizer. You find the one that produces a 340% return over the test period with a Sharpe of 2.4. You call it done.

What you've actually done is memorized historical noise. That specific parameter set performed because of random idiosyncrasies in that particular slice of market data — not because of any persistent market inefficiency.

A robustness test is simple: if your strategy only works at exactly one parameter setting (say, a 14-period moving average window) and breaks down at 13 or 15, it's overfit. A real edge should be relatively stable across a neighbourhood of parameter values.

**The fix:** Walk-forward analysis. Train on a window of data, test on the next unseen period, roll forward, repeat. If the out-of-sample performance isn't directionally consistent with in-sample, you don't have an edge — you have a curve fit.

## What We Build For

At Profytron, our backtesting engine uses point-in-time constituent data, enforces strict event-time sequencing, and includes realistic transaction costs (spread, slippage, and market impact) by default. We also run automatic walk-forward validation on all strategies submitted through the platform.

The goal isn't to make your backtest look good. It's to make your live performance match your backtest.`,
  },
  {
    id: 'llm-trading-signals',
    category: 'Signal AI',
    tag: 'bg-chart-5/10 border-chart-5/20 text-chart-5',
    title: 'How LLMs Are Changing the Signal Pipeline in 2026',
    excerpt:
      'Large language models have moved from research curiosity to production infrastructure in finance. Here\'s how modern signal pipelines actually use them — and where they still fall short.',
    date: 'Mar 24, 2026',
    readTime: '9 min read',
    content: `In 2023, using a large language model in a trading pipeline was a research project. In 2026, it's becoming table stakes for competitive quant shops. The shift happened faster than most expected.

But the way LLMs are actually being used in production is quite different from what most people imagine when they hear "AI trading."

## What LLMs Are Good At in Markets

LLMs are exceptional at converting unstructured text into structured, queryable signals. The volume of market-relevant text generated every day is staggering — earnings calls, analyst reports, press releases, regulatory filings, social media, and central bank communications. No human team can process it at the speed and scale required.

The key breakthrough is that domain-specific models — fine-tuned on financial language — outperform general-purpose LLMs significantly on finance-specific tasks. A phrase like "maintaining price targets despite headwinds" carries a very different implication than its surface reading suggests. General-purpose models often miss this nuance. Models fine-tuned on years of financial text understand it.

## From Discrete Labels to Continuous Scores

Early sentiment analysis in finance was binary or ternary: positive, negative, neutral. That's too coarse to be useful for execution.

The current approach uses logit-to-score conversion — extracting continuous, rankable sentiment scores from LLMs rather than discrete labels. Instead of "this earnings call was positive," you get a score that can be compared across hundreds of assets at once and fed directly into portfolio construction models.

This is a much richer signal that integrates naturally with traditional quantitative frameworks.

## The Real Bottleneck: Speed

The honest limitation of LLMs in trading is speed. Generating a high-quality inference from a frontier model takes time — often hundreds of milliseconds, sometimes seconds. For strategies operating on minute-bars or longer, this is fine. For anything that needs to react to a news event within ten seconds of publication, today's LLM inference pipelines are often too slow.

The current solution is a two-layer approach: smaller, specialized models handle the high-frequency, low-Speed signal generation, while larger models run in parallel for longer-horizon contextual analysis. The outputs are fused at the strategy level.

## Where Signal Core AI Fits

Signal Core AI is built around this hybrid architecture. Lightweight domain-specific models handle real-time event classification and sentiment scoring across news and social feeds, with inference latencies measured in single-digit milliseconds for most signal types. Larger contextual models run on longer cycles and inform the macro regime layer that all strategies share.

The result is that strategies deployed on Profytron have access to real-time textual signal data without paying a Speed penalty that would make the signals arrive after the market has already moved.

## Where LLMs Still Fall Short

Interpretability remains the hardest unsolved problem. When a model assigns a strong bearish sentiment score to a CEO's quarterly remarks, it's not always clear which phrases drove the score. For risk management purposes, unexplainable signals are dangerous — you can't know if the model is responding to the right features or to irrelevant noise.

The industry is making progress on explainable AI for financial models, but it's not production-ready yet. For now, LLM-derived signals are treated as one input among many, with human-interpretable guardrails around position sizing and drawdown limits.`,
  },
  {
    id: 'colocation-real-talk',
    category: 'Infrastructure',
    tag: 'bg-chart-2/10 border-chart-2/20 text-chart-2',
    title: 'Colocation in 2026: What\'s Still an Edge and What Isn\'t',
    excerpt:
      'NY4 and LD4 are the two most important data centers in global electronic trading. But in 2026, proximity alone is no longer enough. Here\'s what we learned building our execution infrastructure.',
    date: 'Mar 10, 2026',
    readTime: '8 min read',
    content: `When Profytron started building its execution layer, we had a decision to make: shared cloud, dedicated VPS, or true colocation inside the exchange data centers. We chose colocation. Here's what we've learned about what that advantage actually looks like in practice in 2026.

## What NY4 and LD4 Are

Equinix NY4 in Secaucus, New Jersey, and LD4 in Slough, UK, are the two most critical data centers for global electronic trading. NY4 is cross-connected to NYSE, NASDAQ, CBOE, major dark pools, and the primary Forex ECNs. LD4 hosts the London Stock Exchange, ICE, Euronext, and virtually every major European venue.

Being inside these buildings — with your server physically cross-connected via short copper or fiber runs to the exchange matching engines — eliminates a class of Speed that you simply cannot buy your way out of from outside. The speed of light is not negotiable.

## What Colocation Still Buys You

The honest answer in 2026 is that raw speed is table stakes, not a differentiator. The top-tier HFT firms — those running at the sub-microsecond level with FPGA-accelerated order routing — have largely commoditized the "fastest pipe" advantage among themselves.

What colocation still meaningfully provides for non-HFT algorithmic traders is **consistency**. The variance in execution Speed from inside NY4 versus a cloud VPS in the same region is stark. From inside NY4, your tick-to-trade Speed is measured in low double-digit microseconds, and it's consistent. From a cloud instance — even a well-optimized one — you see occasional spikes of tens of milliseconds that happen at the worst possible times: during news events, when the market is moving fastest.

That variance eats into alpha in ways that don't show up in backtests, which typically assume deterministic execution.

## FPGA: The Real Hardware Advantage

For strategies that truly need microsecond execution, the technology that matters now isn't the CPU — it's the FPGA (Field-Programmable Gate Array). FPGAs process market data and manage order flows at the hardware level, completely bypassing the operating system stack.

Most algorithmic traders don't need FPGA. But for market-making strategies or anything that's competing to be first in a queue when an event occurs, a software-only stack is now at a structural disadvantage against counterparties running hardware execution.

## What Our Infrastructure Looks Like

Profytron's NY4 and LD4 nodes run on dedicated bare-metal, cross-connected directly to the primary matching engines. Strategies on our Institution tier get direct FIX and WebSocket TCP sessions, no shared infrastructure, and guaranteed Speed SLAs.

For Alpha Desk subscribers, we route through our low-Speed infrastructure layer, which provides the consistency advantage without the full bare-metal commitment. Most strategies at this tier see round-trip execution at a level that would have been considered competitive HFT infrastructure five years ago.

## The Honest Takeaway

If your strategy's edge comes from being faster than competing algorithms by 50 nanoseconds, colocation alone won't save you — you need FPGAs, custom networking, and a team of people whose only job is to squeeze out cycles.

If your edge comes from better signals, better risk management, or better strategy design, then colocation is about removing execution noise from the equation — not winning a pure speed race. That's a solvable problem, and it's what we built Profytron's infrastructure layer to address.`,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.id === slug);
}

export function getAllBlogSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.id);
}
