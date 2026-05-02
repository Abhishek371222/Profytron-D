import { NextRequest, NextResponse } from 'next/server';

interface TrainingItem {
  question: string;
  answer: string;
}

function buildSystemPrompt(customTraining: TrainingItem[]): string {
  let prompt = `You are Profytron AI Assistant — a knowledgeable, concise, and professional chatbot for the Profytron trading platform. Help traders with platform features, trading concepts, broker setup, and general finance questions.

## About Profytron:
Profytron is an institutional-grade algorithmic trading and portfolio management platform.

**Core Features:**
- AI Coach: Personalized trading coaching, trade-by-trade explanation, market regime analysis, coaching reports
- Strategy Builder: Visual drag-and-drop node-based strategy creation with live backtesting
- Strategy Marketplace: Browse, subscribe to, and deploy community-created strategies
- Copy Trading: Automatically copy top traders' strategies from the leaderboard
- Live Trading: Real-time execution across 20+ broker integrations

**Broker Integrations (20+ supported):**
- Paper Trading — risk-free demo sandbox with virtual capital, instant fills, zero deposit required
- MT5 Bridge — universal connector for any MT5-compatible broker
- Named brokers: IC Markets, Pepperstone, Exness, XM, FOREX.com, OANDA, AvaTrade, FP Markets, Admirals, Tickmill, Axi, FXTM, RoboForex, HFM, BlackBull Markets, CMC Markets, IG, Swissquote, Saxo

**Analytics:**
- Performance tab: Win rate, P&L curves, drawdown metrics
- Risk tab: Risk-reward ratios, volatility exposure
- Trade Analysis: Per-trade breakdown and pattern detection
- Global Intelligence: Market-wide signals and macro trends
- Trading Journal: Log trades with notes, tags, and reflection prompts

**Account & Payments:**
- Wallet: Deposit / withdraw via Stripe
- Subscription tiers for premium marketplace access
- Leaderboard: Ranked traders to browse and copy

**Security & Auth:**
- Email/password login with optional 2FA
- Google OAuth single sign-on
- AES-GCM encrypted broker credentials
- JWT-based session management with automatic refresh

**Platform:**
- Progressive Web App (PWA) — installable on mobile
- Dark-first interface with real-time WebSocket price updates
- Firebase push notifications for trade alerts

## Response Guidelines:
- Keep replies to 2–4 sentences unless depth is genuinely needed
- Use plain conversational text — avoid heavy markdown in short answers
- Always note that trading involves risk and past results don't guarantee future returns
- For bugs or billing issues, guide users to the support section in the platform`;

  if (customTraining.length > 0) {
    prompt +=
      '\n\n## Custom Training (answer these questions exactly as specified):';
    customTraining.forEach(({ question, answer }) => {
      prompt += `\n\nQ: ${question}\nA: ${answer}`;
    });
  }

  return prompt;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, customTraining = [] } = await req.json();

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'AI service not configured. Add OPENROUTER_API_KEY to your environment variables.',
        },
        { status: 500 },
      );
    }

    const model =
      process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct';

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://profytron.com',
          'X-Title': 'Profytron AI Assistant',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: buildSystemPrompt(customTraining) },
            ...messages,
          ],
          max_tokens: 600,
          temperature: 0.7,
        }),
      },
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error('[chatbot] OpenRouter error:', response.status, errBody);
      const isAuthError = response.status === 401 || response.status === 403;
      return NextResponse.json(
        {
          error: isAuthError
            ? 'Invalid API key. Update OPENROUTER_API_KEY in apps/web/.env.local and restart the server.'
            : 'AI service temporarily unavailable. Please try again.',
        },
        { status: 502 },
      );
    }

    const data = await response.json();
    const content =
      data.choices?.[0]?.message?.content?.trim() ||
      'I could not generate a response. Please try again.';

    return NextResponse.json({ message: content });
  } catch (err) {
    console.error('[chatbot] Route error:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 },
    );
  }
}
