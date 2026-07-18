export type ExecutionMode = 'master_only' | 'copyfactory';

export function getExecutionMode(): ExecutionMode {
  const raw = (process.env.EXECUTION_MODE || '').trim().toLowerCase();
  if (raw === 'copyfactory') return 'copyfactory';
  return 'master_only';
}

export function isMasterOnlyExecution(): boolean {
  return getExecutionMode() === 'master_only';
}
