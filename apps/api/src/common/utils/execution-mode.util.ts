/**
 * Execution modes for copy trading.
 *
 * copyfactory — MetaApi cloud seat per live user (~$2–3/mo G2) + CopyFactory
 *               SUBSCRIBER role. Balance, deploy, and master→follower copy
 *               run through MetaApi. Opt-in via EXECUTION_MODE=copyfactory.
 *
 * master_only — MetaApi only for the operator master. User MT5 credentials
 *               stay in Profytron DB; optional bridge EA for live fills.
 *               Default when EXECUTION_MODE is unset (no accidental seats).
 */
export type ExecutionMode = 'master_only' | 'copyfactory';

export function getExecutionMode(): ExecutionMode {
  const raw = (process.env.EXECUTION_MODE || '').trim().toLowerCase();
  if (raw === 'copyfactory') return 'copyfactory';
  return 'master_only';
}

export function isMasterOnlyExecution(): boolean {
  return getExecutionMode() === 'master_only';
}
