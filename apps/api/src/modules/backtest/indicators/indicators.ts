export function sma(values: number[], period: number): number[] {
  const result: number[] = new Array(values.length).fill(NaN);
  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += values[i - j];
    result[i] = sum / period;
  }
  return result;
}

export function ema(values: number[], period: number): number[] {
  const result: number[] = new Array(values.length).fill(NaN);
  if (values.length < period) return result;
  const k = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  result[period - 1] = sum / period;
  for (let i = period; i < values.length; i++) {
    result[i] = values[i] * k + result[i - 1] * (1 - k);
  }
  return result;
}

export function rsi(values: number[], period = 14): number[] {
  const result: number[] = new Array(values.length).fill(NaN);
  if (values.length <= period) return result;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  result[period] = 100 - 100 / (1 + avgGain / (avgLoss || 0.0001));
  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
    result[i] = 100 - 100 / (1 + avgGain / (avgLoss || 0.0001));
  }
  return result;
}

export interface MACDResult {
  macd: number[];
  signal: number[];
  histogram: number[];
}

export function macd(
  values: number[],
  fast = 12,
  slow = 26,
  signal = 9,
): MACDResult {
  const fastEma = ema(values, fast);
  const slowEma = ema(values, slow);
  const macdLine = values.map((_, i) =>
    isNaN(fastEma[i]) || isNaN(slowEma[i]) ? NaN : fastEma[i] - slowEma[i],
  );
  // Build signal from valid MACD values
  const validMacd: number[] = [];
  const validIndices: number[] = [];
  for (let i = 0; i < macdLine.length; i++) {
    if (!isNaN(macdLine[i])) {
      validMacd.push(macdLine[i]);
      validIndices.push(i);
    }
  }
  const rawSignal = ema(validMacd, signal);
  const signalLine: number[] = new Array(values.length).fill(NaN);
  for (let v = 0; v < validIndices.length; v++) {
    if (!isNaN(rawSignal[v])) signalLine[validIndices[v]] = rawSignal[v];
  }
  const histogram = values.map((_, i) =>
    isNaN(macdLine[i]) || isNaN(signalLine[i])
      ? NaN
      : macdLine[i] - signalLine[i],
  );
  return { macd: macdLine, signal: signalLine, histogram };
}

export interface BollingerResult {
  upper: number[];
  middle: number[];
  lower: number[];
}

export function bollinger(
  values: number[],
  period = 20,
  stdMult = 2,
): BollingerResult {
  const middle = sma(values, period);
  const upper: number[] = new Array(values.length).fill(NaN);
  const lower: number[] = new Array(values.length).fill(NaN);
  for (let i = period - 1; i < values.length; i++) {
    let variance = 0;
    for (let j = 0; j < period; j++) {
      variance += Math.pow(values[i - j] - middle[i], 2);
    }
    const std = Math.sqrt(variance / period);
    upper[i] = middle[i] + stdMult * std;
    lower[i] = middle[i] - stdMult * std;
  }
  return { upper, middle, lower };
}

export function atr(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14,
): number[] {
  const trs: number[] = [highs[0] - lows[0]];
  for (let i = 1; i < highs.length; i++) {
    trs.push(
      Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1]),
      ),
    );
  }
  const result: number[] = new Array(highs.length).fill(NaN);
  let sum = 0;
  for (let i = 0; i < period && i < trs.length; i++) sum += trs[i];
  if (period <= trs.length) result[period - 1] = sum / period;
  for (let i = period; i < highs.length; i++) {
    result[i] = (result[i - 1] * (period - 1) + trs[i]) / period;
  }
  return result;
}

export interface ADXResult {
  adx: number[];
  pdi: number[];
  mdi: number[];
}

export function adx(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14,
): ADXResult {
  const n = highs.length;
  const atrVals = atr(highs, lows, closes, period);
  const pdi: number[] = new Array(n).fill(NaN);
  const mdi: number[] = new Array(n).fill(NaN);
  const dxArr: number[] = new Array(n).fill(NaN);
  const adxArr: number[] = new Array(n).fill(NaN);

  for (let i = 1; i < n; i++) {
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];
    const plusDM = upMove > downMove && upMove > 0 ? upMove : 0;
    const minusDM = downMove > upMove && downMove > 0 ? downMove : 0;
    const atrV = atrVals[i] || 0.0001;
    pdi[i] = (plusDM / atrV) * 100;
    mdi[i] = (minusDM / atrV) * 100;
    const dSum = pdi[i] + mdi[i];
    dxArr[i] = dSum !== 0 ? (Math.abs(pdi[i] - mdi[i]) / dSum) * 100 : 0;
  }

  // Smooth DX → ADX (Wilder's smoothing)
  let dxSum = 0;
  let cnt = 0;
  for (let i = 1; i < n; i++) {
    if (!isNaN(dxArr[i])) {
      dxSum += dxArr[i];
      cnt++;
      if (cnt === period) {
        adxArr[i] = dxSum / period;
      } else if (cnt > period && !isNaN(adxArr[i - 1])) {
        adxArr[i] = (adxArr[i - 1] * (period - 1) + dxArr[i]) / period;
      }
    }
  }
  return { adx: adxArr, pdi, mdi };
}

export function vwap(
  highs: number[],
  lows: number[],
  closes: number[],
  volumes: number[],
): number[] {
  const result: number[] = [];
  let cumulativePV = 0;
  let cumulativeV = 0;
  for (let i = 0; i < closes.length; i++) {
    const typical = (highs[i] + lows[i] + closes[i]) / 3;
    cumulativePV += typical * (volumes[i] || 0);
    cumulativeV += volumes[i] || 0;
    result.push(cumulativeV > 0 ? cumulativePV / cumulativeV : typical);
  }
  return result;
}
