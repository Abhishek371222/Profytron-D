import { evaluatePaperStopLevels } from './paper-sl-tp.util';
import * as fs from 'fs';
import * as path from 'path';

describe('evaluatePaperStopLevels', () => {
  it('LONG hits stop loss at or below SL', () => {
    expect(
      evaluatePaperStopLevels(
        { direction: 'LONG', stopLoss: 1.1, takeProfit: 1.2 },
        1.1,
      ),
    ).toBe('STOP_LOSS');
    expect(
      evaluatePaperStopLevels(
        { direction: 'LONG', stopLoss: 1.1, takeProfit: 1.2 },
        1.09,
      ),
    ).toBe('STOP_LOSS');
  });

  it('LONG hits take profit at or above TP', () => {
    expect(
      evaluatePaperStopLevels(
        { direction: 'LONG', stopLoss: 1.0, takeProfit: 1.2 },
        1.2,
      ),
    ).toBe('TAKE_PROFIT');
  });

  it('SHORT hits stop loss when price rises to SL', () => {
    expect(
      evaluatePaperStopLevels(
        { direction: 'SHORT', stopLoss: 1.15, takeProfit: 1.05 },
        1.15,
      ),
    ).toBe('STOP_LOSS');
  });

  it('SHORT hits take profit when price falls to TP', () => {
    expect(
      evaluatePaperStopLevels(
        { direction: 'SHORT', stopLoss: 1.15, takeProfit: 1.05 },
        1.05,
      ),
    ).toBe('TAKE_PROFIT');
  });

  it('prefers SL when both levels would hit in the same tick', () => {
    // Pathological: price far through both bands
    expect(
      evaluatePaperStopLevels(
        { direction: 'LONG', stopLoss: 1.1, takeProfit: 1.0 },
        0.99,
      ),
    ).toBe('STOP_LOSS');
  });

  it('returns null while price is inside the band', () => {
    expect(
      evaluatePaperStopLevels(
        { direction: 'LONG', stopLoss: 1.0, takeProfit: 1.2 },
        1.1,
      ),
    ).toBeNull();
  });

  it('returns null for invalid price', () => {
    expect(
      evaluatePaperStopLevels(
        { direction: 'LONG', stopLoss: 1.0, takeProfit: 1.2 },
        0,
      ),
    ).toBeNull();
  });
});

describe('paper trade lifecycle (PT1 regression)', () => {
  it('does not auto-close paper trades after 10s with random PnL', () => {
    const processorPath = path.join(__dirname, '..', 'trade.processor.ts');
    const src = fs.readFileSync(processorPath, 'utf8');
    expect(src).not.toMatch(/Paper trade auto-close failed/);
    expect(src).not.toMatch(/Math\.random\(\)\s*\*\s*0\.02/);
    expect(src).not.toMatch(/setTimeout\([\s\S]*?},\s*10000\s*\)/);
  });
});
