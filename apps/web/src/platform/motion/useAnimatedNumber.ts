'use client';

import React from 'react';
import {
  animateNumber,
  formatAnimatedNumber,
  type NumberFormatKind,
} from './motion-number';
import { assertMotionContract } from './motion-contracts';
import { animationApi } from '../animation';
import { isMotionEngineEnabled } from './index-flag';

export type UseAnimatedNumberOptions = {
  id: string;
  value: number;
  kind?: NumberFormatKind;
  currency?: string;
  decimals?: number;
  changeKey?: string;
  contractId?: string;
};

/**
 * Interruptible animated number for dashboard metrics.
 * Continues from current visual value on rapid updates.
 */
export function useAnimatedNumber({
  id,
  value,
  kind = 'currency',
  currency = 'USD',
  decimals = 2,
  changeKey,
  contractId = 'metric-card',
}: UseAnimatedNumberOptions) {
  const [visual, setVisual] = React.useState(value);
  const [highlight, setHighlight] = React.useState(false);
  const engineOn = isMotionEngineEnabled();

  React.useEffect(() => {
    if (!engineOn) {
      setVisual(value);
      return;
    }
    assertMotionContract(contractId, 'counter');
    animateNumber({
      id,
      to: value,
      onUpdate: setVisual,
      elementKey: contractId,
    });
  }, [id, value, engineOn, contractId]);

  React.useEffect(() => {
    if (!changeKey || !engineOn) return;
    if (animationApi.consumeChanged(changeKey)) {
      setHighlight(true);
      const t = window.setTimeout(() => setHighlight(false), 320);
      return () => clearTimeout(t);
    }
  }, [value, changeKey, engineOn]);

  const formatted = React.useMemo(
    () =>
      formatAnimatedNumber(visual, kind, {
        currency,
        decimals: kind === 'integer' ? 0 : decimals,
      }),
    [visual, kind, currency, decimals],
  );

  return { visual, formatted, highlight };
}
