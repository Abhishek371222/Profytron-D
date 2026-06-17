'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  tradingApi,
  type BulkCloseScope,
  type ManualOrderPayload,
  type ModifyTradePayload,
} from '@/lib/api/trading';
import { invalidateAccountQueries } from '@/lib/queries/account-queries';

const errText = (e: any) =>
  e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Something went wrong';

/**
 * React Query mutations for every trade action exposed by the backend
 * trading controller. All mutations refresh account-scoped queries
 * (open trades, portfolio, risk, wallet) on success.
 */
export function useTradeActions() {
  const qc = useQueryClient();
  const refresh = () => invalidateAccountQueries(qc);

  const closeTrade = useMutation({
    mutationFn: ({ id, volume }: { id: string; volume?: number }) =>
      tradingApi.closeTrade(id, volume),
    onSuccess: (_d, vars) => {
      refresh();
      toast.success(vars.volume != null ? 'Partial close queued' : 'Close order queued');
    },
    onError: (e) => toast.error('Close failed', { description: errText(e) }),
  });

  const modifyTrade = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ModifyTradePayload }) =>
      tradingApi.modifyTrade(id, payload),
    onSuccess: () => {
      refresh();
      toast.success('Stop-loss / take-profit updated');
    },
    onError: (e) => toast.error('Modify failed', { description: errText(e) }),
  });

  const breakEven = useMutation({
    mutationFn: ({ id, offsetPips }: { id: string; offsetPips?: number }) =>
      tradingApi.breakEven(id, offsetPips),
    onSuccess: () => {
      refresh();
      toast.success('Stop moved to break-even');
    },
    onError: (e) => toast.error('Break-even failed', { description: errText(e) }),
  });

  const trailingStop = useMutation({
    mutationFn: ({ id, distance }: { id: string; distance: number }) =>
      tradingApi.setTrailingStop(id, distance),
    onSuccess: () => {
      refresh();
      toast.success('Trailing stop attached');
    },
    onError: (e) => toast.error('Trailing stop failed', { description: errText(e) }),
  });

  const bulkClose = useMutation({
    mutationFn: (scope: BulkCloseScope) => tradingApi.bulkClose(scope),
    onSuccess: (_d, scope) => {
      refresh();
      toast.success(`Bulk close queued`, { description: `Scope: ${scope}` });
    },
    onError: (e) => toast.error('Bulk close failed', { description: errText(e) }),
  });

  const placeOrder = useMutation({
    mutationFn: (payload: ManualOrderPayload) => tradingApi.placeManualOrder(payload),
    onSuccess: (_d, vars) => {
      refresh();
      toast.success('Order queued', { description: `${vars.side} ${vars.volume} ${vars.symbol}` });
    },
    onError: (e) => toast.error('Order failed', { description: errText(e) }),
  });

  return { closeTrade, modifyTrade, breakEven, trailingStop, bulkClose, placeOrder };
}
