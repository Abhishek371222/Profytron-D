import { randomBytes } from 'crypto';

/** Fake company settlement account used until real payout rails are wired. */
export const COMPANY_RECEIVER_ADDRESS = 'PRF-CO-ACCT-IN91-000987654321';

/**
 * Canonical support-facing billing ID.
 * Format: PRF-WLT-YYYYMMDD-XXXXXXXX (8 hex chars)
 * Example: PRF-WLT-20260712-A1B2C3D4
 *
 * Rules:
 * - Generated once at WalletTransaction create time
 * - Never regenerated on status updates (pending → confirmed/failed)
 * - Globally unique (@unique in DB) — quote this ID to support for the exact txn
 */
export const BILLING_ID_REGEX = /^PRF-WLT-\d{8}-[A-F0-9]{8}$/i;

export type WalletPaymentCategory =
  | 'Wallet Deposit'
  | 'Wallet Withdrawal'
  | 'Subscription Payment'
  | 'Trading P&L'
  | 'Commission'
  | 'Marketplace Sale'
  | 'Affiliate Payout'
  | 'Other';

const TYPE_CATEGORY: Record<string, WalletPaymentCategory> = {
  DEPOSIT: 'Wallet Deposit',
  WITHDRAWAL: 'Wallet Withdrawal',
  SUBSCRIPTION_PAYMENT: 'Subscription Payment',
  TRADING_PNL: 'Trading P&L',
  COMMISSION: 'Commission',
  MARKETPLACE_SALE: 'Marketplace Sale',
};

export function generateBillingId(at: Date = new Date()): string {
  const stamp = at.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = randomBytes(4).toString('hex').toUpperCase();
  return `PRF-WLT-${stamp}-${suffix}`;
}

/** Build a stable canonical billing ID from an existing row (migration / repair). */
export function billingIdFromTransactionId(
  id: string,
  createdAt: Date,
): string {
  const stamp = createdAt.toISOString().slice(0, 10).replace(/-/g, '');
  const hex = id.replace(/-/g, '').toUpperCase();
  // Use chars 0-7 + 8-11 mixed for 8 hex that stay unique per UUID
  const suffix = (hex.slice(0, 6) + hex.slice(-2)).padEnd(8, '0').slice(0, 8);
  return `PRF-WLT-${stamp}-${suffix}`;
}

export function isValidBillingId(value: string | null | undefined): boolean {
  return typeof value === 'string' && BILLING_ID_REGEX.test(value.trim());
}

export function normalizeBillingId(value: string): string {
  return value.trim().toUpperCase();
}

export function fakeUserAccountAddress(userId: string): string {
  const fragment =
    userId.replace(/-/g, '').slice(0, 10).toUpperCase() || 'UNKNOWN';
  return `USR-ACCT-${fragment}`;
}

export function paymentCategoryForType(
  type: string,
  override?: string,
  // `string & {}` (not plain `string`) keeps IDE autocomplete showing the
  // known WalletPaymentCategory literals while still allowing an arbitrary
  // override — `WalletPaymentCategory | string` collapses to plain `string`
  // and loses that, which is what the lint rule flags.
): WalletPaymentCategory | (string & {}) {
  if (override) return override;
  return TYPE_CATEGORY[type] ?? 'Other';
}

export function buildWalletPaymentFields(input: {
  type: string;
  direction: 'IN' | 'OUT';
  userId: string;
  externalTxnId?: string | null;
  userAccountAddress?: string | null;
  paymentCategory?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}) {
  const userAddress =
    input.userAccountAddress?.trim() || fakeUserAccountAddress(input.userId);

  // Deposit / credit: user sends → company receives
  // Withdrawal / debit: company sends → user receives
  const isCredit = input.direction === 'IN';
  const billingId = generateBillingId(input.createdAt ?? new Date());

  return {
    billingId,
    paymentCategory: paymentCategoryForType(input.type, input.paymentCategory),
    senderAddress: isCredit ? userAddress : COMPANY_RECEIVER_ADDRESS,
    receiverAddress: isCredit ? COMPANY_RECEIVER_ADDRESS : userAddress,
    externalTxnId: input.externalTxnId ?? null,
    metadataJson: {
      ...(input.metadata ?? {}),
      billingId,
      companyAccountAddress: COMPANY_RECEIVER_ADDRESS,
      userAccountAddress: userAddress,
    },
  };
}
