from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import logging
import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Profytron AI Coach", version="1.0.0")

# OpenRouter API configuration
OPENROUTER_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.io/api/v1"

class TradeAnalysisRequest(BaseModel):
    symbol: str
    direction: str
    entry_price: float
    exit_price: Optional[float] = None
    take_profit: Optional[float] = None
    stop_loss: Optional[float] = None
    volume: float
    pnl: Optional[float] = None

class PsychologyCoachRequest(BaseModel):
    emotion: str
    trade_count_today: int
    win_rate: float
    recent_losses: int

class StrategyAnalysisRequest(BaseModel):
    strategy_name: str
    win_rate: float
    avg_rr: float
    total_trades: int
    monthly_return: float

class TradeJournalAnalysisRequest(BaseModel):
    emotions: list[str]
    lessons: str
    trade_outcomes: list[float]

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "AI Coach"}

async def call_openrouter(prompt: str, model: str = "openai/gpt-3.5-turbo"):
    """Call OpenRouter API for AI analysis"""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "https://profytron.com",
        "X-Title": "Profytron AI Coach",
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{OPENROUTER_BASE_URL}/chat/completions",
                headers=headers,
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 500,
                }
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"OpenRouter API error: {e}")
            raise

@app.post("/analyze-trade")
async def analyze_trade(request: TradeAnalysisRequest):
    """Analyze a trade using AI"""
    logger.info(f"Analyzing trade: {request.symbol} {request.direction}")

    prompt = f"""Analyze this trading decision:
- Symbol: {request.symbol}
- Direction: {request.direction}
- Entry: ${request.entry_price}
- Exit: ${request.exit_price}
- Take Profit: ${request.take_profit}
- Stop Loss: ${request.stop_loss}
- Volume: {request.volume}
- P&L: ${request.pnl if request.pnl else 'TBD'}

Provide: 1) Risk/Reward analysis 2) Entry/Exit quality 3) Risk level 4) 2-3 specific recommendations."""

    try:
        analysis = await call_openrouter(prompt)
        return {
            "symbol": request.symbol,
            "direction": request.direction,
            "analysis": analysis,
            "confidence_score": 0.85,
            "risk_level": "MEDIUM",
            "alerts": ["Monitor resistance at 1.0900"]
        }
    except Exception as e:
        logger.error(f"Trade analysis failed: {e}")
        raise HTTPException(status_code=500, detail="AI analysis failed")

@app.post("/psychology-coach")
async def psychology_coach(request: PsychologyCoachRequest):
    """AI psychology coaching"""
    logger.info(f"Psychology analysis for user with emotion: {request.emotion}")

    prompt = f"""Provide psychological coaching for a trader experiencing {request.emotion}:
- Emotion: {request.emotion}
- Trades today: {request.trade_count_today}
- Win rate: {request.win_rate * 100:.1f}%
- Recent losses: {request.recent_losses}

Provide: 1) Root cause analysis 2) Psychological impact on trading 3) 3 actionable recommendations to manage this emotion."""

    try:
        analysis = await call_openrouter(prompt)
        return {
            "emotion": request.emotion,
            "analysis": analysis,
            "recommendation": "Follow your trading plan consistently",
            "daily_trades": request.trade_count_today,
            "suggested_break": request.win_rate < 0.5,
        }
    except Exception as e:
        logger.error(f"Psychology coaching failed: {e}")
        raise HTTPException(status_code=500, detail="Psychology analysis failed")

@app.post("/analyze-strategy")
async def analyze_strategy(request: StrategyAnalysisRequest):
    """Analyze trading strategy performance"""
    logger.info(f"Analyzing strategy: {request.strategy_name}")

    prompt = f"""Analyze this trading strategy:
- Strategy: {request.strategy_name}
- Win rate: {request.win_rate * 100:.1f}%
- Average Risk/Reward: {request.avg_rr:.2f}
- Total trades: {request.total_trades}
- Monthly return: {request.monthly_return * 100:.1f}%

Provide: 1) Profitability assessment 2) Risk management evaluation 3) 3 recommendations for improvement."""

    try:
        analysis = await call_openrouter(prompt)
        profitability = min(100, int(request.win_rate * 100 + (request.monthly_return * 10)))
        return {
            "strategy_name": request.strategy_name,
            "analysis": analysis,
            "profitability_score": profitability,
            "rating": "EXCELLENT" if profitability > 80 else "GOOD" if profitability > 60 else "FAIR",
            "total_trades": request.total_trades,
        }
    except Exception as e:
        logger.error(f"Strategy analysis failed: {e}")
        raise HTTPException(status_code=500, detail="Strategy analysis failed")

@app.post("/analyze-journal")
async def analyze_journal(request: TradeJournalAnalysisRequest):
    """Analyze trading journal entries"""
    logger.info(f"Analyzing journal with emotions: {request.emotions}")

    prompt = f"""Analyze these trading journal entries:
- Emotions recorded: {', '.join(request.emotions)}
- Trade lessons: {request.lessons}
- Trade outcomes (P&L): {', '.join(f'${x:.2f}' for x in request.trade_outcomes)}

Provide: 1) Emotional patterns and psychological triggers 2) Correlation between emotions and trading results 3) 3 specific recommendations to improve journal-keeping and emotional management."""

    try:
        analysis = await call_openrouter(prompt)
        avg_outcome = sum(request.trade_outcomes) / len(request.trade_outcomes) if request.trade_outcomes else 0
        return {
            "emotions": request.emotions,
            "average_outcome": avg_outcome,
            "analysis": analysis,
            "psychology_score": 7.5,
            "lessons_identified": request.lessons,
        }
    except Exception as e:
        logger.error(f"Journal analysis failed: {e}")
        raise HTTPException(status_code=500, detail="Journal analysis failed")

@app.post("/market-summary")
async def market_summary():
    """Generate AI market summary"""
    logger.info("Generating market summary")

    prompt = """Analyze current market conditions and provide trading opportunities:
1. What are the major market trends across FX, stocks, and crypto?
2. What are the best trading opportunities for today?
3. What are the main risks to watch?

Provide concise, actionable market insights suitable for traders."""

    try:
        summary = await call_openrouter(prompt)
        return {
            "summary": summary,
            "confidence": 0.72,
            "generated_at": "2024-12-20T10:30:00Z"
        }
    except Exception as e:
        logger.error(f"Market summary generation failed: {e}")
        raise HTTPException(status_code=500, detail="Market summary generation failed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
