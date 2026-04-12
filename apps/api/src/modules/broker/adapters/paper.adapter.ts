import { Injectable } from '@nestjs/common';

@Injectable()
export class PaperBrokerAdapter {
  private balance = 100000;
  private equity = 100000;

  async connect(account: string, password?: string, server?: string) {
    await new Promise((resolve) => setTimeout(resolve, 50));

    return {
      connected: true,
      balance: this.balance,
      equity: this.equity,
      currency: 'USD',
    };
  }

  async getPositions() {
    return [];
  }

  async closeTrade(ticket: string) {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 250 + 50),
    );
    return { success: true, ticket, close_price: 0, profit: 0 };
  }
}
