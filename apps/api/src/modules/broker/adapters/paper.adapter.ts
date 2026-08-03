import { Injectable } from '@nestjs/common';
import { estimateUnrealizedPnl } from '../../trading/utils/pnl.util';

/** Inputs already known on an open paper trade when closing. */
export type PaperCloseTradeParams = {
  direction: string;
  volume: number;
  openPrice: number;
  fillPrice?: number | null;
  /** Market/mark price used as close (from existing paper engine / quote path). */
  closePrice: number;
  openedAt?: Date | string | null;
};

export type PaperCloseTradeResult = {
  success: boolean;
  ticket: string;
  /** Snake_case matches MT5Adapter contract used by broker code. */
  close_price: number | null;
  profit: number | null;
  pnl: number | null;
  /** Absolute loss when PnL is negative; 0 when profitable; null if PnL unknown. */
  loss: number | null;
  /** Paper engine does not model commission — null, not a fabricated 0. */
  commission: null;
  /** Paper engine does not model swap — null, not a fabricated 0. */
  swap: null;
  closedAt: string;
  /** Milliseconds open → close when openedAt provided; otherwise null. */
  duration: number | null;
  status: 'CLOSED';
  /** When false, close_price/profit left null (insufficient inputs — not zeros). */
  calculated: boolean;
};

@Injectable()
export class PaperBrokerAdapter {
  async connect(account: string, _password?: string, _server?: string) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const seed = account
      ? account.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
      : 0;
    const balance = 100_000 + (seed % 50_000);

    return {
      connected: true,
      balance,
      equity: balance,
      margin: 0,
      freeMargin: balance,
      currency: 'USD',
      leverage: 100,
      accountName: `Paper Account (${account})`,
      accountType: 'DEMO',
      broker: 'PaperBroker',
      server: 'demo',
      metaApiAccountId: null,
    };
  }

  async getPositions() {
    return [];
  }

  /**
   * Close a paper position using the same PnL estimator as the trade processor.
   * Does not invent prices: caller must supply entry, size, direction, and close mark.
   */
  async closeTrade(
    ticket: string,
    params?: PaperCloseTradeParams,
  ): Promise<PaperCloseTradeResult> {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 200 + 30),
    );

    const closedAt = new Date();
    const closedAtIso = closedAt.toISOString();

    const openedAt = params?.openedAt;
    if (!this.canCalculate(params)) {
      return {
        success: true,
        ticket,
        close_price: null,
        profit: null,
        pnl: null,
        loss: null,
        commission: null,
        swap: null,
        closedAt: closedAtIso,
        duration: this.durationMs(openedAt, closedAt),
        status: 'CLOSED',
        calculated: false,
      };
    }

    const profit = estimateUnrealizedPnl(
      {
        direction: params.direction,
        volume: params.volume,
        openPrice: params.openPrice,
        fillPrice: params.fillPrice ?? null,
      },
      params.closePrice,
    );

    return {
      success: true,
      ticket,
      close_price: params.closePrice,
      profit,
      pnl: profit,
      loss: profit < 0 ? Math.abs(profit) : 0,
      commission: null,
      swap: null,
      closedAt: closedAtIso,
      duration: this.durationMs(openedAt, closedAt),
      status: 'CLOSED',
      calculated: true,
    };
  }

  async modifyTrade(
    _ticket: string,
    _changes: { stopLoss?: number; takeProfit?: number },
  ) {
    await new Promise((resolve) => setTimeout(resolve, 30));
    return { success: true };
  }

  async closePartial(ticket: string, _volume: number) {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 150 + 30),
    );
    // Out of scope for PT2 (closeTrade only); leave stub unchanged.
    return { success: true, ticket, close_price: 0, profit: 0 };
  }

  private canCalculate(
    params?: PaperCloseTradeParams,
  ): params is PaperCloseTradeParams {
    if (!params) return false;
    if (!Number.isFinite(params.volume) || params.volume <= 0) return false;
    if (!Number.isFinite(params.openPrice) || params.openPrice <= 0) return false;
    if (!Number.isFinite(params.closePrice) || params.closePrice <= 0)
      return false;
    if (!params.direction) return false;
    return true;
  }

  private durationMs(
    openedAt: Date | string | null | undefined,
    closedAt: Date,
  ): number | null {
    if (openedAt == null) return null;
    const open = openedAt instanceof Date ? openedAt : new Date(openedAt);
    if (Number.isNaN(open.getTime())) return null;
    return Math.max(0, closedAt.getTime() - open.getTime());
  }
}
