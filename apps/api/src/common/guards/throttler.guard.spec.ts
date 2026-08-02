import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Guards the Day-13 finding that authenticated traffic must not raise
 * *route-level* @Throttle limits (wallet deposit/withdraw, etc.).
 * The module default (100) may still be raised to 1000 for signed-in users.
 */
describe('AppThrottlerGuard authenticated limit scope', () => {
  const source = readFileSync(join(__dirname, 'throttler.guard.ts'), 'utf8');

  it('only elevates when the request still carries the module default limit', () => {
    expect(source).toMatch(/MODULE_DEFAULT_LIMIT\s*=\s*100/);
    expect(source).toMatch(/AUTHENTICATED_LIMIT\s*=\s*1000/);
    expect(source).toContain(
      'isAuthenticated && requestProps.limit === MODULE_DEFAULT_LIMIT',
    );
  });

  it('does not unconditionally replace every limit with AUTHENTICATED_LIMIT', () => {
    // Historical bug pattern: `{ ...requestProps, limit: AUTHENTICATED_LIMIT }` on all authed traffic.
    const unconditional =
      /isAuthenticated\s*\?\s*\{\s*\.\.\.requestProps,\s*limit:\s*AUTHENTICATED_LIMIT/;
    expect(source).not.toMatch(unconditional);
  });
});
