/**
 * Deterministic follower lot-sizing engine for copy trading.
 *
 * Three sizing methods (see Profytron copy-trading spec, Module 7):
 *   FIXED         L = fixedLot
 *   MULTIPLIER    L = masterVolume * multiplier
 *   EQUITY_RATIO  L = masterVolume * (followerEquity / masterEquity) * multiplier
 *
 * All results are clamped to [minLot, maxLot] and rounded down to the broker
 * lot step so we never request a size the broker would reject.
 */

export type SizingMode = 'FIXED' | 'MULTIPLIER' | 'EQUITY_RATIO';

export interface SizingInput {
  mode?: SizingMode | null;
  /** Master/source position volume in lots (copy trades). */
  masterVolume?: number | null;
  /** Risk multiplier applied in MULTIPLIER / EQUITY_RATIO modes. */
  multiplier?: number | null;
  /** Lot size used in FIXED mode. */
  fixedLot?: number | null;
  /** Equity of the master account (EQUITY_RATIO mode). */
  masterEquity?: number | null;
  /** Equity of the follower account (EQUITY_RATIO mode). */
  followerEquity?: number | null;
  minLot?: number;
  maxLot?: number;
  lotStep?: number;
  /**
   * When true, return null instead of forcing minLot when the scaled size
   * rounds below the broker minimum (safe for ~$100 accounts).
   */
  skipIfBelowMin?: boolean;
}

const DEFAULT_MIN_LOT = 0.01;
const DEFAULT_MAX_LOT = 100;
const DEFAULT_LOT_STEP = 0.01;

function isPositive(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0;
}

function roundToStep(value: number, step: number): number {
  if (!isPositive(step)) return value;
  const rounded = Math.floor(value / step) * step;
  // Avoid floating-point dust like 0.30000000000000004.
  const decimals = (step.toString().split('.')[1] ?? '').length;
  return Number(rounded.toFixed(decimals));
}

/**
 * Computes the follower lot size for a copied trade. Returns a value already
 * clamped and rounded to the broker lot step. Falls back gracefully to the
 * multiplier method (then minLot) when inputs for a richer mode are missing.
 *
 * When `skipIfBelowMin` is set and the scaled size is below minLot, returns
 * null so the caller can skip the trade instead of oversizing a $100 account.
 */
export function computeFollowerVolume(input: SizingInput): number | null {
  const minLot = isPositive(input.minLot) ? input.minLot : DEFAULT_MIN_LOT;
  const maxLot = isPositive(input.maxLot) ? input.maxLot : DEFAULT_MAX_LOT;
  const lotStep = isPositive(input.lotStep) ? input.lotStep : DEFAULT_LOT_STEP;
  const multiplier = isPositive(input.multiplier) ? input.multiplier : 1.0;

  let raw: number;

  switch (input.mode) {
    case 'FIXED':
      raw = isPositive(input.fixedLot) ? input.fixedLot : minLot;
      break;

    case 'EQUITY_RATIO':
      if (
        isPositive(input.masterVolume) &&
        isPositive(input.masterEquity) &&
        isPositive(input.followerEquity)
      ) {
        raw =
          input.masterVolume *
          (input.followerEquity / input.masterEquity) *
          multiplier;
      } else if (isPositive(input.masterVolume)) {
        // Missing equity data — degrade to plain multiplier.
        raw = input.masterVolume * multiplier;
      } else {
        raw = isPositive(input.fixedLot) ? input.fixedLot : minLot;
      }
      break;

    case 'MULTIPLIER':
    default:
      if (isPositive(input.masterVolume)) {
        raw = input.masterVolume * multiplier;
      } else if (isPositive(input.fixedLot)) {
        raw = input.fixedLot;
      } else {
        raw = minLot;
      }
      break;
  }

  const stepped = roundToStep(raw, lotStep);
  if (stepped < minLot) {
    if (input.skipIfBelowMin) return null;
    return minLot;
  }
  return Math.min(stepped, maxLot);
}
