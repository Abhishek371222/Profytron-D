import { BadRequestException } from '@nestjs/common';
import { StrategyDefinition, IndicatorConfig, RuleGroup } from '../types';

interface GraphNode {
  id: string;
  nodeType: string;
  config: Record<string, any>;
  label: string;
}

interface GraphEdge {
  fromNodeId: string;
  toNodeId: string;
}

function hasCycle(nodes: GraphNode[], edges: GraphEdge[]): boolean {
  const adj = new Map<string, string[]>();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) adj.get(e.fromNodeId)?.push(e.toNodeId);

  const state = new Map<string, 'white' | 'gray' | 'black'>();
  for (const n of nodes) state.set(n.id, 'white');

  function dfs(id: string): boolean {
    state.set(id, 'gray');
    for (const next of adj.get(id) ?? []) {
      if (state.get(next) === 'gray') return true;
      if (state.get(next) === 'white' && dfs(next)) return true;
    }
    state.set(id, 'black');
    return false;
  }

  for (const n of nodes) {
    if (state.get(n.id) === 'white' && dfs(n.id)) return true;
  }
  return false;
}

export function compileGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
): StrategyDefinition {
  if (hasCycle(nodes, edges)) {
    throw new BadRequestException('Strategy graph contains a cycle');
  }

  const indicators: Record<string, IndicatorConfig> = {};
  let symbol = 'EURUSD';
  let timeframe = '1h';
  let direction: 'LONG' | 'SHORT' | 'BOTH' = 'BOTH';
  const entryRules: any[] = [];
  const exitRules: any[] = [];
  const risk: any = {};

  for (const node of nodes) {
    const cfg: Record<string, any> = node.config ?? {};
    switch (node.nodeType) {
      case 'INDICATOR':
        indicators[node.id] = {
          type: cfg.type ?? 'SMA',
          period: cfg.period ?? 14,
          fastPeriod: cfg.fastPeriod,
          slowPeriod: cfg.slowPeriod,
          signalPeriod: cfg.signalPeriod,
          stdDevMultiplier: cfg.stdDevMultiplier ?? 2,
          source: cfg.source ?? 'close',
        } as IndicatorConfig;
        break;

      case 'ENTRY':
      case 'CONDITION':
        if (cfg.symbol) symbol = cfg.symbol as string;
        if (cfg.timeframe) timeframe = cfg.timeframe as string;
        if (cfg.direction) direction = cfg.direction as 'LONG' | 'SHORT' | 'BOTH';
        entryRules.push({
          left: cfg.left ?? node.id,
          comparator: cfg.comparator ?? '>',
          right: cfg.right ?? 50,
        });
        break;

      case 'EXIT':
        exitRules.push({
          left: cfg.left ?? node.id,
          comparator: cfg.comparator ?? '<',
          right: cfg.right ?? 70,
        });
        break;

      case 'ACTION':
        if (cfg.slPct != null) risk.slPct = Number(cfg.slPct);
        if (cfg.tpPct != null) risk.tpPct = Number(cfg.tpPct);
        if (cfg.riskPerTradePct != null) risk.riskPerTradePct = Number(cfg.riskPerTradePct);
        break;
    }
  }

  const entryGroup: RuleGroup = {
    op: 'AND',
    rules: entryRules.length > 0
      ? entryRules
      : [{ left: 'price', comparator: '>', right: 0 }],
  };

  const exitGroup: RuleGroup = {
    op: 'OR',
    rules: exitRules.length > 0
      ? exitRules
      : [{ left: 'price', comparator: '<', right: 0 }],
  };

  return {
    version: 1,
    name: nodes.find((n) => n.nodeType === 'ENTRY')?.label ?? 'Compiled Strategy',
    symbol,
    timeframe,
    indicators,
    entryRules: entryGroup,
    exitRules: exitGroup,
    risk: { slPct: 1, tpPct: 2, riskPerTradePct: 1, ...risk },
    direction,
  };
}
