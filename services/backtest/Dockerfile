FROM python:3.11-slim

WORKDIR /app

COPY services/backtest/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY services/backtest/ ./

ENV PORT=8080
EXPOSE 8080

CMD ["python", "main.py"]
