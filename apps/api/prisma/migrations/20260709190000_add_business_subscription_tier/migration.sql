-- Add BUSINESS as a distinct subscription tier, separate from INSTITUTIONAL,
-- so the Business (₹1,299) and Enterprise plans can have independent quota limits.
ALTER TYPE "SubscriptionTier" ADD VALUE IF NOT EXISTS 'BUSINESS' BEFORE 'INSTITUTIONAL';
