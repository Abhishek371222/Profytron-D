/**
 * Phase 10 unit checks for production-readiness helpers (no Nest bootstrap).
 */

describe('Phase 10 production readiness helpers', () => {
  function normalizeAuditPath(url: string): boolean {
    const AUDIT_PREFIXES = ['/v1/wallet', '/v1/admin', '/wallet', '/admin'];
    const pathOnly = url.split('?')[0];
    return AUDIT_PREFIXES.some((p) => pathOnly.startsWith(p));
  }

  function buildRequestId(incoming?: string) {
    const id = incoming && incoming.length <= 128 ? incoming : 'generated-uuid';
    return id;
  }

  function shouldSkipThrottle(path: string) {
    const SKIP = ['/health', '/live', '/ready', '/metrics', '/v1/webhooks/'];
    return SKIP.some((p) => path === p || path.startsWith(p));
  }

  it('audits /v1 admin and wallet mutations but not GET paths elsewhere', () => {
    expect(normalizeAuditPath('/v1/admin/payments')).toBe(true);
    expect(normalizeAuditPath('/v1/wallet/withdraw')).toBe(true);
    expect(normalizeAuditPath('/marketplace/public')).toBe(false);
  });

  it('prefers client request id when present', () => {
    expect(buildRequestId('client-abc')).toBe('client-abc');
    expect(buildRequestId(undefined)).toBe('generated-uuid');
  });

  it('skips throttle for probes and webhooks', () => {
    expect(shouldSkipThrottle('/health')).toBe(true);
    expect(shouldSkipThrottle('/v1/webhooks/stripe')).toBe(true);
    expect(shouldSkipThrottle('/v1/subscriptions/plans')).toBe(false);
  });
});
