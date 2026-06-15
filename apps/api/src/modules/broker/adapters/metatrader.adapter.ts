import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface MTConnectionResult {
  connected: boolean;
  pending?: boolean;
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
  metaApiRegion?: string;
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
 *
 * Region handling: a provisioned account is deployed to a MetaAPI-selected
 * region (e.g. "new-york", "vint-hill", "london"). All client/trading API
 * calls MUST target that region's host, so we read the account back after
 * creation to discover its region and cache it per account id.
 */
@Injectable()
export class MetaTraderAdapter {
  private readonly logger = new Logger(MetaTraderAdapter.name);
  private readonly token: string | undefined;
  private readonly provisioningUrl =
    'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';
  /** Fallback region used only when an account's real region can't be read. */
  private readonly defaultRegion = process.env.METAAPI_REGION || 'new-york';
  private readonly http: AxiosInstance;
  /** accountId -> region cache to avoid re-reading the account on every call. */
  private readonly regionCache = new Map<string, string>();

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
   *
   * Flow: create account -> read it to learn region/state -> deploy if needed
   * -> wait until the broker terminal connects -> fetch account information.
   *
   * If the broker hasn't fully connected within the wait window (demo servers
   * can be slow), we still return connected:true with pending:true so the
   * account is saved; live balance is filled in by a later testConnection.
   */
  async connect(
    login: string,
    password: string,
    server: string,
    platform: 'mt4' | 'mt5' = 'mt5',
    options?: { copyFactoryRoles?: Array<'PROVIDER' | 'SUBSCRIBER'> },
  ): Promise<MTConnectionResult> {
    if (!this.isLive) {
      return this.mockResult(login, server, platform);
    }

    try {
      // 1. Create the MetaAPI account (provisioning step)
      const provision = await this.http.post(
        `${this.provisioningUrl}/users/current/accounts`,
        {
          login,
          password,
          server,
          platform,
          type: 'cloud-g2',
          name: `${login}@${server}`,
          magic: 0,
          ...(options?.copyFactoryRoles?.length
            ? {
                application: 'CopyFactory',
                copyFactoryRoles: options.copyFactoryRoles,
              }
            : {}),
          ...(process.env.METAAPI_REGION
            ? { region: process.env.METAAPI_REGION }
            : {}),
        },
        { headers: this.headers() },
      );

      const accountId: string = provision.data.id;

      // 2. Read the account back to discover its assigned region + state.
      const account = await this.getAccount(accountId);
      const region: string = account.region || this.defaultRegion;
      this.regionCache.set(accountId, region);

      // 3. Deploy it if MetaAPI created it in an undeployed state.
      if (account.state !== 'DEPLOYED') {
        await this.deploy(accountId);
      }

      // 4. Wait for the terminal to connect to the broker (up to ~60s).
      const connected = await this.waitForConnection(accountId);

      // 5. Fetch account information from the region-specific client host.
      if (connected) {
        try {
          const d = await this.fetchAccountInformation(accountId, region);
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
            server: d.server || server,
            metaApiAccountId: accountId,
            metaApiRegion: region,
          };
        } catch (infoErr: any) {
          this.logger.warn(
            `Account ${accountId} deployed but account-information not ready: ${infoErr.message}`,
          );
        }
      }

      // Provisioned + deployed but the broker hasn't streamed account info yet.
      return {
        connected: true,
        pending: true,
        server,
        accountType: 'PENDING',
        metaApiAccountId: accountId,
        metaApiRegion: region,
      };
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message;
      this.logger.warn(`MetaAPI connect failed for ${login}@${server}: ${msg}`);
      return { connected: false, error: msg };
    }
  }

  /**
   * Test an already-provisioned account using its stored MetaAPI account ID.
   */
  async testExisting(
    metaApiAccountId: string,
    region?: string,
  ): Promise<MTConnectionResult> {
    if (!this.isLive) {
      return {
        connected: true,
        balance: 100_000,
        equity: 100_000,
        currency: 'USD',
      };
    }

    try {
      const resolvedRegion = await this.resolveRegion(metaApiAccountId, region);
      const d = await this.fetchAccountInformation(
        metaApiAccountId,
        resolvedRegion,
      );
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
        metaApiRegion: resolvedRegion,
      };
    } catch (err: any) {
      return {
        connected: false,
        error: err?.response?.data?.message || err.message,
      };
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
    region?: string,
  ): Promise<{ orderId: string; executionTime?: string }> {
    if (!this.isLive) {
      return {
        orderId: `mock-order-${Date.now()}`,
        executionTime: new Date().toISOString(),
      };
    }
    const resolvedRegion = await this.resolveRegion(metaApiAccountId, region);
    const res = await this.http.post(
      `${this.clientUrl(resolvedRegion)}/users/current/accounts/${metaApiAccountId}/trade`,
      order,
      { headers: this.headers() },
    );
    return {
      orderId: res.data.orderId,
      executionTime: res.data.tradeExecutionTime,
    };
  }

  /** Close an open position by its position ID. */
  async closePosition(
    metaApiAccountId: string,
    positionId: string,
    region?: string,
  ): Promise<void> {
    if (!this.isLive) return;
    const resolvedRegion = await this.resolveRegion(metaApiAccountId, region);
    await this.http.post(
      `${this.clientUrl(resolvedRegion)}/users/current/accounts/${metaApiAccountId}/trade`,
      { actionType: 'POSITION_CLOSE_ID', positionId },
      { headers: this.headers() },
    );
  }

  /**
   * Fetch all currently open positions for an account.
   * Returns raw MetaAPI position objects.
   */
  async getPositions(
    metaApiAccountId: string,
    region?: string,
  ): Promise<any[]> {
    if (!this.isLive) return [];
    const resolvedRegion = await this.resolveRegion(metaApiAccountId, region);
    const res = await this.http.get(
      `${this.clientUrl(resolvedRegion)}/users/current/accounts/${metaApiAccountId}/positions`,
      { headers: this.headers() },
    );
    return Array.isArray(res.data) ? res.data : [];
  }

  /** Assign CopyFactory PROVIDER or SUBSCRIBER role to an existing MetaAPI account. */
  async ensureCopyFactoryRoles(
    metaApiAccountId: string,
    roles: Array<'PROVIDER' | 'SUBSCRIBER'>,
  ): Promise<void> {
    if (!this.isLive || !metaApiAccountId || metaApiAccountId.startsWith('mock-')) {
      return;
    }
    await this.http.put(
      `${this.provisioningUrl}/users/current/accounts/${metaApiAccountId}`,
      {
        application: 'CopyFactory',
        copyFactoryRoles: roles,
      },
      { headers: this.headers() },
    );
    const account = await this.getAccount(metaApiAccountId);
    if (account.state !== 'DEPLOYED') {
      await this.deploy(metaApiAccountId);
    }
  }

  /** Wait until MetaAPI reports the account terminal is connected to the broker. */
  async waitForDeployed(
    metaApiAccountId: string,
    maxMs = 90_000,
  ): Promise<boolean> {
    if (!this.isLive) return true;
    return this.waitForConnection(metaApiAccountId, maxMs);
  }

  /** Remove a MetaAPI account when the user disconnects. */
  async deprovision(metaApiAccountId: string): Promise<void> {
    if (!this.isLive || !metaApiAccountId) return;
    try {
      await this.http.delete(
        `${this.provisioningUrl}/users/current/accounts/${metaApiAccountId}`,
        { headers: this.headers() },
      );
      this.regionCache.delete(metaApiAccountId);
    } catch (err: any) {
      this.logger.warn(
        `Failed to deprovision MetaAPI account ${metaApiAccountId}: ${err.message}`,
      );
    }
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  private headers() {
    return { 'auth-token': this.token };
  }

  /** Region-specific MetaAPI client/trading API host. */
  private clientUrl(region: string): string {
    return `https://mt-client-api-v1.${region}.agiliumtrade.ai`;
  }

  /** GET the provisioning record for an account (region, state, etc.). */
  private async getAccount(accountId: string): Promise<any> {
    const res = await this.http.get(
      `${this.provisioningUrl}/users/current/accounts/${accountId}`,
      { headers: this.headers() },
    );
    return res.data;
  }

  /** Resolve an account's region, using the cache, then the account record. */
  private async resolveRegion(
    accountId: string,
    hint?: string,
  ): Promise<string> {
    if (hint) {
      this.regionCache.set(accountId, hint);
      return hint;
    }
    const cached = this.regionCache.get(accountId);
    if (cached) return cached;
    try {
      const account = await this.getAccount(accountId);
      const region = account.region || this.defaultRegion;
      this.regionCache.set(accountId, region);
      return region;
    } catch {
      return this.defaultRegion;
    }
  }

  private async deploy(accountId: string): Promise<void> {
    await this.http.post(
      `${this.provisioningUrl}/users/current/accounts/${accountId}/deploy`,
      {},
      { headers: this.headers() },
    );
  }

  private async fetchAccountInformation(
    accountId: string,
    region: string,
  ): Promise<any> {
    const info = await this.http.get(
      `${this.clientUrl(region)}/users/current/accounts/${accountId}/account-information`,
      { headers: this.headers() },
    );
    return info.data;
  }

  /**
   * Poll the provisioning record until the account is DEPLOYED and its terminal
   * reports CONNECTED to the broker. Returns false (without throwing) if the
   * connection isn't established within the window — the caller then treats the
   * account as provisioned-but-pending rather than failed.
   */
  private async waitForConnection(
    accountId: string,
    maxMs = 60_000,
  ): Promise<boolean> {
    const interval = 3_000;
    const attempts = Math.ceil(maxMs / interval);
    for (let i = 0; i < attempts; i++) {
      try {
        const account = await this.getAccount(accountId);
        if (account.state === 'DEPLOY_FAILED') {
          throw new Error(
            'MetaAPI deployment failed — check your login/password/server',
          );
        }
        if (
          account.state === 'DEPLOYED' &&
          account.connectionStatus === 'CONNECTED'
        ) {
          return true;
        }
      } catch (err: any) {
        // A transient read error shouldn't abort the whole wait loop, but a
        // genuine DEPLOY_FAILED (thrown above) should bubble up.
        if (err.message?.includes('deployment failed')) throw err;
      }
      await new Promise((r) => setTimeout(r, interval));
    }
    return false;
  }

  private mockResult(
    login: string,
    server: string,
    platform: string,
  ): MTConnectionResult {
    this.logger.warn(
      'METAAPI_TOKEN not set — returning mock connection result',
    );
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
      metaApiRegion: this.defaultRegion,
    };
  }
}
