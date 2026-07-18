import { Injectable } from '@nestjs/common';

@Injectable()
export class MT5Adapter {
  async connect(account: string, password: string, server: string) {

    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      connected: true,
      balance: 100000,
      equity: 124580,
      currency: 'USD',
    };
  }

  async getPositions() {
    return [
      {
        ticket: '123456',
        symbol: 'EURUSD',
        type: 'buy',
        volume: 1.0,
        open_price: 1.09,
        profit: 450.5,
      },
    ];
  }

  async closeTrade(ticket: string) {
    return { success: true, ticket, close_price: 1.095, profit: 500 };
  }
}
