import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface MTConnectionResult {
  connected: boolean;
  balance?: number;
  equity?: number;
  margin?: number;
  freeMargin?: number;
  currency?: string;
  leverage?: number;
  accountName?: string;
  accountType?: string;
  broker?: string;
  server?: string;
  metaApiAccountId?: string;
  error?: string;
}

/**
 * MetaTrader 4 / 5 adapter via MetaAPI.cloud REST API.
 *
 * MetaAPI is a managed bridge that connects to any live/demo MT4 or MT5
 * account using the user's trading credentials. It handles the proprietary
 * MetaQuotes protocol so we never need to run MT terminals locally.
 *
 * Sign up at https://metaapi.cloud — free tier allows up to 5 accounts.
 * Set METAAPI_TOKEN in apps/api/.env to activate real connections.
 *
 * Without the token, the adapter returns a clearly-labelled mock so
 * development still works without credentials.
 */
@Injectable()
export class MetaTraderAdapter {
  private readonly logger = new Logger(MetaTraderAdapter.name);
  private readonly token: string | undefined;
  private readonly baseUrl = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';
  private readonly tradingUrl = 'https://mt-client-api-v1.london.agiliumtrade.ai';
  private readonly http: AxiosInstance;

  constructor() {
    this.token = process.env.METAAPI_TOKEN;
    this.http = axios.create({ timeout: 30_000 });
  }

  /** Returns true when a real MetaAPI token is configured. */
  get isLive(): boolean {
    return !!this.token;
  }

  /**
   * Provision a new MetaAPI account and verify the credentials are valid.
   * On success returns account info including balance and equity.
   * On failure (bad password / unreachable server) returns connected:false.
   */
  async connect(
    login: string,
    password: string,
    server: string,
    platform: 'mt4' | 'mt5' = 'mt5',
  ): Promise<MTConnectionResult> {
    if (!this.isLive) {
      return this.mockResult(login, server, platform);
    }

    try {
      // 1. Create a MetaAPI account (provisioning step)
      const provision = await this.http.post(
        `${this.baseUrl}/users/current/accounts`,
        {
          login,
          password,
          server,
          platform,
          type: 'cloud',
          name: `${login}@${server}`,
          magic: 0,
        },
        { headers: this.headers() },
      );

      const accountId: string = provision.data.id;

      // 2. Wait for the account to reach DEPLOYED state (poll up to 30s)
      await this.waitForDeployment(accountId);

      // 3. Fetch account information
      const info = await this.http.get(
        `${this.tradingUrl}/users/current/accounts/${accountId}/account-information`,
        { headers: this.headers() },
      );

      const d = info.data;
      return {
        connected: true,
        balance: d.balance,
        equity: d.equity,
        margin: d.margin,
        freeMargin: d.freeMargin,
        currency: d.currency,
        leverage: d.leverage,
        accountName: d.name,
        accountType: d.type,
        broker: d.broker,
        server: d.server,
        metaApiAccountId: accountId,
      };
    } catch (err) {
      const msg = err?.response?.data?.message || err.message;
      this.logger.warn(`MetaAPI connect failed for ${login}@${server}: ${msg}`);
      return { connected: false, error: msg };
    }
  }

  /**
   * Test an already-provisioned account using its stored MetaAPI account ID.
   */
  async testExisting(metaApiAccountId: string): Promise<MTConnectionResult> {
    if (!this.isLive) {
      return { connected: true, balance: 100_000, equity: 100_000, currency: 'USD' };
    }

    try {
      const info = await this.http.get(
        `${this.tradingUrl}/users/current/accounts/${metaApiAccountId}/account-information`,
        { headers: this.headers() },
      );
      const d = info.data;
      return {
        connected: true,
        balance: d.balance,
        equity: d.equity,
        margin: d.margin,
        freeMargin: d.freeMargin,
        currency: d.currency,
        leverage: d.leverage,
        accountName: d.name,
        broker: d.broker,
        server: d.server,
        metaApiAccountId,
      };
    } catch (err) {
      return { connected: false, error: err?.response?.data?.message || err.message };
    }
  }

  /**
   * Place a market order on a MetaAPI-provisioned account.
   * Returns the orderId assigned by the broker.
   */
  async executeTrade(
    metaApiAccountId: string,
    order: {
      actionType: 'ORDER_TYPE_BUY' | 'ORDER_TYPE_SELL';
      symbol: string;
      volume: number;
      stopLoss?: number;
      takeProfit?: number;
      comment?: string;
    },
  ): Promise<{ orderId: string; executionTime?: string }> {
    if (!this.isLive) {
      return { orderId: `mock-order-${Date.now()}`, executionTime: new Date().toISOString() };
    }
    const res = await this.http.post(
      `${this.tradingUrl}/users/current/accounts/${metaApiAccountId}/trade`,
      order,
      { headers: this.headers() },
    );
    return { orderId: res.data.orderId, executionTime: res.data.tradeExecutionTime };
  }

  /** Close an open position by its position ID. */
  async closePosition(metaApiAccountId: string, positionId: string): Promise<void> {
    if (!this.isLive) return;
    await this.http.post(
      `${this.tradingUrl}/users/current/accounts/${metaApiAccountId}/trade`,
      { actionType: 'POSITION_CLOSE_ID', positionId },
      { headers: this.headers() },
    );
  }

  /**
   * Fetch all currently open positions for an account.
   * Returns raw MetaAPI position objects.
   */
  async getPositions(metaApiAccountId: string): Promise<any[]> {
    if (!this.isLive) return [];
    const res = await this.http.get(
      `${this.tradingUrl}/users/current/accounts/${metaApiAccountId}/positions`,
      { headers: this.headers() },
    );
    return Array.isArray(res.data) ? res.data : [];
  }

  /** Remove a MetaAPI account when the user disconnects. */
  async deprovision(metaApiAccountId: string): Promise<void> {
    if (!this.isLive || !metaApiAccountId) return;
    try {
      await this.http.delete(
        `${this.baseUrl}/users/current/accounts/${metaApiAccountId}`,
        { headers: this.headers() },
      );
    } catch (err) {
      this.logger.warn(`Failed to deprovision MetaAPI account ${metaApiAccountId}: ${err.message}`);
    }
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  private headers() {
    return { 'auth-token': this.token };
  }

  private async waitForDeployment(accountId: string, maxMs = 30_000): Promise<void> {
    const interval = 3_000;
    const attempts = Math.ceil(maxMs / interval);
    for (let i = 0; i < attempts; i++) {
      const res = await this.http.get(
        `${this.baseUrl}/users/current/accounts/${accountId}`,
        { headers: this.headers() },
      );
      const state: string = res.data.state;
      if (state === 'DEPLOYED') return;
      if (state === 'DEPLOY_FAILED') throw new Error('MetaAPI deployment failed — check your login/password/server');
      await new Promise((r) => setTimeout(r, interval));
    }
    throw new Error('MetaAPI account deployment timed out');
  }

  private mockResult(login: string, server: string, platform: string): MTConnectionResult {
    this.logger.warn('METAAPI_TOKEN not set — returning mock connection result');
    return {
      connected: true,
      balance: 10_000,
      equity: 10_240,
      margin: 200,
      freeMargin: 10_040,
      currency: 'USD',
      leverage: 100,
      accountName: `Demo Account (${login})`,
      accountType: 'DEMO',
      broker: server.split('-')[0] ?? 'Unknown',
      server,
      metaApiAccountId: `mock-${login}-${Date.now()}`,
    };
  }
}
