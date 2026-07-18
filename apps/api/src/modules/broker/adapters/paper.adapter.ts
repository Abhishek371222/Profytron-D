import { Injectable } from '@nestjs/common';

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

  async closeTrade(ticket: string) {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 200 + 30),
    );
    return { success: true, ticket, close_price: 0, profit: 0 };
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
    return { success: true, ticket, close_price: 0, profit: 0 };
  }
}
