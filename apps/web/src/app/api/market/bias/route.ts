import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type BiasDirection = 'bullish' | 'bearish' | 'neutral';

type FrameInput = {
  timeframe: string;
  open: number;
  high: number;
  low: number;
  close: number;
  changePct: number;
  closes?: number[];
};

type BiasResult = {
  direction: BiasDirection;
  confidence: number;
  note: string;
  trend: string;
  trade: string;
  source: string;
};

function heuristicBias(frame: FrameInput): Omit<BiasResult, 'source'> {
  const closes = (frame.closes ?? []).filter((v) => Number.isFinite(v) && v > 0);
  const last = closes[closes.length - 1] ?? frame.close;
  const first = closes[0] ?? frame.open;
  const mid = closes[Math.floor(closes.length / 2)] ?? frame.open;
  const range = Math.max(frame.high - frame.low, Math.abs(frame.close) * 0.0001);
  const body = frame.close - frame.open;
  const trendMove = last - first;
  const score =
    (body / range) * 0.45 +
    (trendMove / Math.max(Math.abs(first) * 0.01, range)) * 0.35 +
    ((last - mid) / range) * 0.2;

  const tf = frame.timeframe.toUpperCase();
  const nearHigh = (frame.high - frame.close) / range < 0.2;
  const nearLow = (frame.close - frame.low) / range < 0.2;

  if (score > 0.12) {
    return {
      direction: 'bullish',
      confidence: Math.min(0.92, 0.55 + Math.abs(score) * 0.4),
      note: 'Buyers holding control above mid-range.',
      trend: `On the ${tf}, price is trending higher with closes firming toward the top of the recent range. Momentum favors continuation unless ${frame.low.toFixed(2)} fails.`,
      trade: nearHigh
        ? `Trend longs can wait for a shallow pullback toward mid-range; protect below ${frame.low.toFixed(2)} and trail if highs keep expanding.`
        : `Look for long entries on dips that hold above ${Math.min(frame.open, mid).toFixed(2)}; invalidation sits under ${frame.low.toFixed(2)}.`,
    };
  }
  if (score < -0.12) {
    return {
      direction: 'bearish',
      confidence: Math.min(0.92, 0.55 + Math.abs(score) * 0.4),
      note: 'Sellers pressing price below mid-range.',
      trend: `On the ${tf}, sellers are in control and price is leaning into the lower half of the range. Pressure stays bearish while ${frame.high.toFixed(2)} caps rebounds.`,
      trade: nearLow
        ? `Shorts can fade weak bounces into mid-range; cover/stop above ${frame.high.toFixed(2)} if the session reclaim sticks.`
        : `Prefer short setups on failed rallies under ${Math.max(frame.open, mid).toFixed(2)}; risk defined above ${frame.high.toFixed(2)}.`,
    };
  }
  return {
    direction: 'neutral',
    confidence: 0.5,
    note: 'Range-bound — wait for a clearer break.',
    trend: `On the ${tf}, price is chopping between ${frame.low.toFixed(2)} and ${frame.high.toFixed(2)} with no lasting edge. Expect fake breaks until a close clears the range.`,
    trade: `Stand aside or trade the edges only: fade extremes back to mid-range, or wait for a decisive break and hold beyond ${frame.high.toFixed(2)} / ${frame.low.toFixed(2)}.`,
  };
}

function parseAiJson(text: string): Record<
  string,
  {
    direction?: string;
    confidence?: number;
    note?: string;
    trend?: string;
    trade?: string;
  }
> | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/\{[\s\S]*\}/);
  const raw = fenced?.[0] ?? trimmed;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeDirection(value: unknown): BiasDirection {
  const v = String(value || '')
    .toLowerCase()
    .trim();
  if (v.includes('bull')) return 'bullish';
  if (v.includes('bear')) return 'bearish';
  return 'neutral';
}

function clip(text: string, max: number) {
  const t = text.trim().replace(/\s+/g, ' ');
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const symbol = String(body?.symbol || 'XAUUSD').toUpperCase();
    const frames = (Array.isArray(body?.frames) ? body.frames : []) as FrameInput[];
    if (!frames.length) {
      return NextResponse.json({ error: 'frames required' }, { status: 400 });
    }

    const fallback: Record<string, BiasResult> = {};
    for (const frame of frames) {
      fallback[frame.timeframe] = {
        ...heuristicBias(frame),
        source: 'heuristic',
      };
    }

    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        data: { symbol, biases: fallback },
      });
    }

    const model =
      process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct';

    const prompt = `You are a concise FX/crypto desk analyst for active traders.
Symbol: ${symbol}

Return ONLY valid JSON (no markdown) shaped like:
{
  "1h": {
    "direction": "bullish|bearish|neutral",
    "confidence": 0.0-1.0,
    "note": "short label, max 10 words",
    "trend": "1-2 sentences on market trend / structure for this timeframe",
    "trade": "1-2 sentences on practical trade idea: entry bias, invalidation, what to avoid"
  },
  "4h": { ... },
  "1d": { ... }
}

Rules:
- Be specific to the OHLC numbers given.
- Do not promise profits; frame as analysis, not financial advice.
- Keep trend and trade to 1-2 sentences each.

Timeframe snapshots:
${frames
  .map(
    (f) =>
      `${f.timeframe}: O=${f.open} H=${f.high} L=${f.low} C=${f.close} changePct=${f.changePct.toFixed(3)} recentCloses=${(f.closes ?? []).slice(-10).join(',')}`,
  )
  .join('\n')}`;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://profytron.com',
          'X-Title': 'Profytron Markets Bias',
        },
        body: JSON.stringify({
          model,
          temperature: 0.25,
          max_tokens: 700,
          messages: [
            {
              role: 'system',
              content:
                'Reply with JSON only. No markdown. Include direction, confidence, note, trend, and trade for each timeframe.',
            },
            { role: 'user', content: prompt },
          ],
        }),
        signal: AbortSignal.timeout(25_000),
      });

      if (!response.ok) {
        return NextResponse.json({
          success: true,
          data: { symbol, biases: fallback },
        });
      }

      const payload = await response.json();
      const content = String(payload?.choices?.[0]?.message?.content || '');
      const parsed = parseAiJson(content);
      if (!parsed) {
        return NextResponse.json({
          success: true,
          data: { symbol, biases: fallback },
        });
      }

      const biases = { ...fallback };
      for (const frame of frames) {
        const ai = parsed[frame.timeframe];
        if (!ai) continue;
        const base = fallback[frame.timeframe];
        biases[frame.timeframe] = {
          direction: normalizeDirection(ai.direction),
          confidence: Math.min(
            1,
            Math.max(0.35, Number(ai.confidence) || base.confidence),
          ),
          note: clip(String(ai.note || base.note), 80) || base.note,
          trend: clip(String(ai.trend || base.trend), 280) || base.trend,
          trade: clip(String(ai.trade || base.trade), 280) || base.trade,
          source: 'openrouter',
        };
      }

      return NextResponse.json({
        success: true,
        data: { symbol, biases },
      });
    } catch {
      return NextResponse.json({
        success: true,
        data: { symbol, biases: fallback },
      });
    }
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Bias failed' },
      { status: 500 },
    );
  }
}
