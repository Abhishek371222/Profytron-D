/**
 * Execution modes for copy trading.
 *
 * master_only — MetaApi is used ONLY for the operator master account.
 *               User MT5 accounts are never provisioned on MetaApi (cost control).
 *               MasterSync detects master fills → risk → trade_execution.
 *               Paper accounts get simulated fills; live accounts get ledger
 *               mirrors until a local/VPS bridge EA is added.
 *
 * copyfactory — MetaApi CopyFactory mirrors master→subscriber (per-seat cost).
 */
export type ExecutionMode = 'master_only' | 'copyfactory';

export function getExecutionMode(): ExecutionMode {
  const raw = (process.env.EXECUTION_MODE || '').trim().toLowerCase();
  // Explicit opt-in only — default is master_only so we never bill MetaApi
  // subscriber seats by accident on a misconfigured deploy.
  if (raw === 'copyfactory') return 'copyfactory';
  return 'master_only';
}

export function isMasterOnlyExecution(): boolean {
  return getExecutionMode() === 'master_only';
}
