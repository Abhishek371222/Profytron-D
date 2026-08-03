# Market, Limit, Stop, and Stop-Limit Orders

<!-- internal: series day 9/30 suggest 2026-08-11 -->

## Market orders

Execute now at available prices. Simple; can slip. Useful when speed > precision.

## Limit orders

Fill only at your price or better. May never fill. Useful for passive entry.

## Stop / stop-limit

Stops trigger when price hits a threshold (often for breakout entries or protection). Understand broker semantics for stop-limit vs stop-market.

## Bots and order choice

A bot's edge can evaporate if it uses the wrong order type for its thesis. Scalpers using limbo limits in fast markets miss moves; brutes using market into news pay the wrong price.

## Try this

Paper-place one limit and one stop order concept on a demo. Watch how fill logic differs from 'I wanted this exact pixel'.

---

This article is for education. It is not financial advice. Trading forex involves risk of loss, including the possible loss of capital.

**Labels:** order types, stop loss, limit order