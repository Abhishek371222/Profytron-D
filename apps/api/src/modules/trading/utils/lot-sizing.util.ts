
export type SizingMode = 'FIXED' | 'MULTIPLIER' | 'EQUITY_RATIO';

export interface SizingInput {
  mode?: SizingMode | null;
  masterVolume?: number | null;
  multiplier?: number | null;
  fixedLot?: number | null;
  masterEquity?: number | null;
  followerEquity?: number | null;
  minLot?: number;
  maxLot?: number;
  lotStep?: number;
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
  const decimals = (step.toString().split('.')[1] ?? '').length;
  return Number(rounded.toFixed(decimals));
}

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
