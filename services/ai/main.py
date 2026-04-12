from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Profytron AI Engine")

HF_API_KEY = os.getenv("HUGGING_FACE_API_KEY")
HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2"

class TradeExplainRequest(BaseModel):
    asset: str
    type: str
    entry: float
    reason: str
    stopLoss: float | None = None
    takeProfit: float | None = None
    profit: float | None = None
    status: str | None = None


class AIChatRequest(BaseModel):
    message: str
    context: str | None = None
    recentTrades: list[dict] | None = None


async def hf_generate(prompt: str):
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"https://api-inference.huggingface.co/models/{HF_MODEL}",
            headers={"Authorization": f"Bearer {HF_API_KEY}"},
            json={"inputs": prompt},
        )

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="AI Service unreachable")

    payload = response.json()
    if isinstance(payload, list) and payload and isinstance(payload[0], dict):
        return payload[0].get("generated_text") or str(payload[0])
    return str(payload)

@app.post("/ai/explain-trade")
async def explain_trade(req: TradeExplainRequest):
    prompt = (
        f"Explain this {req.type} trade on {req.asset} entered at {req.entry}. "
        f"Reason given: {req.reason}. Stop loss: {req.stopLoss}. Take profit: {req.takeProfit}. "
        f"Current status: {req.status}. Profit: {req.profit}. Keep it technical and quant-focused."
    )
    text = await hf_generate(prompt)
    return {"reply": text, "model": HF_MODEL}


@app.post("/ai/chat")
async def chat(req: AIChatRequest):
    trades_summary = req.recentTrades or []
    prompt = (
        "You are a quant trading coach. Provide concise and practical risk-managed advice.\n"
        f"User message: {req.message}\n"
        f"Context: {req.context or 'N/A'}\n"
        f"Recent trades: {trades_summary}"
    )

    text = await hf_generate(prompt)
    return {"reply": text, "model": HF_MODEL}

@app.post("/ai/market-regime")
async def market_regime(data: dict):
    symbol = data.get("symbol", "BTCUSDT")
    return {
        "regime": "BULL_TREND",
        "symbol": symbol,
        "adx": 32.5,
        "atr_volatility": "MEDIUM",
        "timestamp": "2024-04-10T20:00:00Z"
    }

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
