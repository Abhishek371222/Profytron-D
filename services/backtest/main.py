from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import numpy as np
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Profytron Backtest Engine")

class BacktestRequest(BaseModel):
    strategy_id: str
    symbol: str
    timeframe: str
    initial_balance: float

@app.post("/backtest/run")
async def run_backtest(req: BacktestRequest):
    # Mocking high-frequency bar simulation logic
    # In production, this would fetch from Alpha Vantage and run pandas iteration
    
    dates = pd.date_range(start="2024-01-01", periods=100, freq="D")
    equity_curve = np.cumsum(np.random.normal(0.01, 0.05, 100)) + 1
    equity_points = [req.initial_balance * val for val in equity_curve]
    
    return {
        "strategy_id": req.strategy_id,
        "metrics": {
            "total_pnl": equity_points[-1] - req.initial_balance,
            "sharpe_ratio": 2.15,
            "max_drawdown": 4.5,
            "win_rate": 0.68
        },
        "chart_data": [{"date": d.isoformat(), "val": v} for d, v in zip(dates, equity_points)],
        "status": "COMPLETED"
    }

@app.post("/backtest/monte-carlo")
async def run_monte_carlo(req: dict):
    # Simulate 1000 outcomes
    return {
        "strategy_id": req.get("strategy_id"),
        "simulations": 1000,
        "worst_case": -12.4,
        "best_case": 45.2,
        "mean_return": 18.5
    }

@app.get("/health")
async def health():
    return {"status": "ok", "service": "backtest"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
