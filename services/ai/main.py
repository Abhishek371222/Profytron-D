from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
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

@app.post("/ai/explain-trade")
async def explain_trade(req: TradeExplainRequest):
    prompt = f"Explain this {req.type} trade on {req.asset} entered at {req.entry}. Reason given: {req.reason}. Keep it technical and quant-focused."
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api-inference.huggingface.co/models/{HF_MODEL}",
            headers={"Authorization": f"Bearer {HF_API_KEY}"},
            json={"inputs": prompt}
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="AI Service unreachable")
            
        return response.json()

@app.post("/ai/market-regime")
async def market_regime(data: dict):
    # Mocking ADX/ATR rule-based logic
    # In production, this would use pandas to calculate from real bars
    return {
        "regime": "BULL_TREND",
        "adx": 32.5,
        "atr_volatility": "MEDIUM",
        "timestamp": "2024-04-10T20:00:00Z"
    }

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
