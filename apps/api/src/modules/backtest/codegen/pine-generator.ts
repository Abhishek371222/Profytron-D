import { StrategyDefinition } from '../types';

function sym(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[0-9]/, '_s');
}

function ruleToPine(rule: any): string {
  const l = typeof rule.left === 'number' ? String(rule.left) : sym(String(rule.left));
  const r = typeof rule.right === 'number' ? String(rule.right) : sym(String(rule.right));
  switch (rule.comparator) {
    case '>': return `${l} > ${r}`;
    case '<': return `${l} < ${r}`;
    case '>=': return `${l} >= ${r}`;
    case '<=': return `${l} <= ${r}`;
    case '==': return `${l} == ${r}`;
    case 'crossesAbove': return `ta.crossover(${l}, ${r})`;
    case 'crossesBelow': return `ta.crossunder(${l}, ${r})`;
    default: return 'true';
  }
}

function groupToPine(group: any): string {
  const parts: string[] = (group.rules ?? []).map(ruleToPine);
  if (parts.length === 0) return 'true';
  const op = group.op === 'OR' ? ' or ' : ' and ';
  return parts.length === 1 ? parts[0] : `(${parts.join(op)})`;
}

export function generatePine(def: StrategyDefinition): string {
  const lines: string[] = [];
  const risk = def.risk ?? {};

  lines.push(`//@version=5`);
  lines.push(
    `strategy("${def.name}", overlay=true, ` +
      `default_qty_type=strategy.percent_of_equity, ` +
      `default_qty_value=${risk.riskPerTradePct ?? 1})`,
  );
  lines.push('');

  // Indicator declarations
  for (const [refId, cfg] of Object.entries(def.indicators)) {
    const v = sym(refId);
    const src = cfg.source ?? 'close';
    switch (cfg.type) {
      case 'SMA':
        lines.push(`${v} = ta.sma(${src}, ${cfg.period ?? 14})`);
        break;
      case 'EMA':
        lines.push(`${v} = ta.ema(${src}, ${cfg.period ?? 14})`);
        break;
      case 'RSI':
        lines.push(`${v} = ta.rsi(${src}, ${cfg.period ?? 14})`);
        break;
      case 'MACD':
        lines.push(
          `[${v}_macd, ${v}_signal, ${v}_hist] = ta.macd(${src}, ` +
            `${cfg.fastPeriod ?? 12}, ${cfg.slowPeriod ?? 26}, ${cfg.signalPeriod ?? 9})`,
        );
        break;
      case 'BOLLINGER':
        lines.push(
          `[${v}_upper, ${v}_mid, ${v}_lower] = ta.bb(${src}, ` +
            `${cfg.period ?? 20}, ${cfg.stdDevMultiplier ?? 2})`,
        );
        break;
      case 'ATR':
        lines.push(`${v} = ta.atr(${cfg.period ?? 14})`);
        break;
      case 'ADX':
        lines.push(`[${v}_pdi, ${v}_mdi, ${v}] = ta.dmi(${cfg.period ?? 14}, ${cfg.period ?? 14})`);
        break;
      case 'VWAP':
        lines.push(`${v} = ta.vwap(hlc3)`);
        break;
    }
  }

  lines.push('');
  lines.push(`longCond = ${groupToPine(def.entryRules)}`);
  lines.push(`exitCond = ${groupToPine(def.exitRules)}`);
  lines.push('');

  if (risk.slPct != null) lines.push(`slDist = close * ${risk.slPct / 100}`);
  if (risk.tpPct != null) lines.push(`tpDist = close * ${risk.tpPct / 100}`);
  lines.push('');

  if (def.direction !== 'SHORT') {
    lines.push('if longCond');
    lines.push('    strategy.entry("Long", strategy.long)');
    if (risk.slPct != null && risk.tpPct != null) {
      lines.push(
        '    strategy.exit("Long Exit", "Long", stop=close - slDist, limit=close + tpDist)',
      );
    }
  }
  if (def.direction !== 'LONG') {
    lines.push('if longCond');
    lines.push('    strategy.entry("Short", strategy.short)');
    if (risk.slPct != null && risk.tpPct != null) {
      lines.push(
        '    strategy.exit("Short Exit", "Short", stop=close + slDist, limit=close - tpDist)',
      );
    }
  }
  lines.push('if exitCond');
  lines.push('    strategy.close_all()');

  return lines.join('\n');
}
