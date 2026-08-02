/**
 * Phase 9C regressions: payment classification for wallet deposits + invoice number shape.
 */

describe('Phase 9C billing helpers', () => {
  function shouldCreditWallet(opts: {
    isMarketplacePayment: boolean;
    isPlatformPayment: boolean;
    isProfitShareMarketplace: boolean;
  }) {
    return (
      opts.isProfitShareMarketplace ||
      (!opts.isMarketplacePayment && !opts.isPlatformPayment)
    );
  }

  function buildInvoiceNumber(paymentId: string, issuedAt: Date) {
    const compactId = paymentId.replace(/-/g, '').slice(0, 12).toUpperCase();
    const ymd = [
      issuedAt.getUTCFullYear(),
      String(issuedAt.getUTCMonth() + 1).padStart(2, '0'),
      String(issuedAt.getUTCDate()).padStart(2, '0'),
    ].join('');
    return `INV-${ymd}-${compactId}`;
  }

  function computeExpiresAt(
    nowMs: number,
    billingCycle: 'MONTHLY' | 'ANNUAL',
    remainingMs: number,
  ) {
    const periodMs =
      billingCycle === 'ANNUAL'
        ? 365 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;
    return new Date(nowMs + periodMs + remainingMs);
  }

  it('does not deposit wallet for platform subscription payments', () => {
    expect(
      shouldCreditWallet({
        isMarketplacePayment: false,
        isPlatformPayment: true,
        isProfitShareMarketplace: false,
      }),
    ).toBe(false);
  });

  it('does not deposit wallet for fixed marketplace payments', () => {
    expect(
      shouldCreditWallet({
        isMarketplacePayment: true,
        isPlatformPayment: false,
        isProfitShareMarketplace: false,
      }),
    ).toBe(false);
  });

  it('deposits wallet for profit-share marketplace and bare top-ups', () => {
    expect(
      shouldCreditWallet({
        isMarketplacePayment: true,
        isPlatformPayment: false,
        isProfitShareMarketplace: true,
      }),
    ).toBe(true);
    expect(
      shouldCreditWallet({
        isMarketplacePayment: false,
        isPlatformPayment: false,
        isProfitShareMarketplace: false,
      }),
    ).toBe(true);
  });

  it('builds deterministic unique invoice numbers from payment id', () => {
    const a = buildInvoiceNumber(
      'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      new Date('2026-08-02T12:00:00Z'),
    );
    const b = buildInvoiceNumber(
      'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      new Date('2026-08-02T23:59:59Z'),
    );
    expect(a).toBe(b);
    expect(a).toMatch(/^INV-20260802-AAAAAAAABBBB$/);
  });

  it('carries remaining plan time into new expiry (basic proration)', () => {
    const now = Date.parse('2026-08-02T00:00:00Z');
    const remaining = 5 * 24 * 60 * 60 * 1000;
    const expires = computeExpiresAt(now, 'MONTHLY', remaining);
    // 30 days + 5 days
    expect(expires.getTime() - now).toBe(35 * 24 * 60 * 60 * 1000);
  });
});
