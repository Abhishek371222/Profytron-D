import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface MTConnectionResult {
  connected: boolean;
  pending?: boolean;
  balance?: number;
  equity?: number;
  margin?: number;
  freeMargin?: number;
  marginLevel?: number;
  credit?: number;
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

interface MetaApiAccountSummary {
  _id?: string;
  id?: string;
  login?: string | number;
  server?: string;
  state?: string;
  connectionStatus?: string;
  region?: string;
}

export interface MetaApiFullSnapshot {
  info: any;
  account: any;
  positions: any[];
  pendingOrders: any[];
  deals: any[];
  orderHistory: any[];
  symbols: any[];
  marketData: any[];
  terminalState: any;
  copyTrading: any;
  latencyMs: number;
  sectionErrors: Record<string, string>;
}

@Injectable()
export class MetaTraderAdapter {
  private readonly logger = new Logger(MetaTraderAdapter.name);
  private readonly token: string | undefined;
  private readonly provisioningUrl =
    'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';
  private readonly defaultRegion = process.env.METAAPI_REGION || 'new-york';
  private readonly http: AxiosInstance;
  private readonly regionCache = new Map<string, string>();
  private readonly equityCache = new Map<
    string,
    { equity: number; at: number }
  >();
  private readonly EQUITY_TTL_MS = 30_000;
  /**
   * Global circuit after HTTP 429. Without this, every sync loop (master,
   * history, bot trades) independently retries 3× and floods MetaAPI + logs,
   * which starves the Nest event loop and makes Next proxy `/users/me` time out.
   */
  private rateLimitedUntil = 0;

  constructor() {
    this.token = process.env.METAAPI_TOKEN;
    this.http = axios.create({ timeout: 30_000 });
    this.installRetryInterceptor(this.http);
  }

  /** True while MetaAPI rate-limit cooldown is active. */
  isRateLimited(): boolean {
    return Date.now() < this.rateLimitedUntil;
  }

  /** Milliseconds left on the cooldown (0 if clear). */
  rateLimitRemainingMs(): number {
    return Math.max(0, this.rateLimitedUntil - Date.now());
  }

  private enterRateLimitCooldown(retryAfterHeader?: unknown): void {
    const alreadyLimited = this.isRateLimited();
    const retryAfter = Number(retryAfterHeader);
    const headerMs =
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 0;
    const cooldownMs = Math.max(
      headerMs,
      Number(process.env.METAAPI_RATE_LIMIT_COOLDOWN_MS) || 60_000,
    );
    const until = Date.now() + cooldownMs;
    // Extend, never shorten, an existing cooldown.
    if (until > this.rateLimitedUntil) {
      this.rateLimitedUntil = until;
    }
    // One log per cooldown period (concurrent 429s must not spam).
    if (!alreadyLimited) {
      this.logger.warn(
        `MetaAPI rate-limited — pausing all MetaAPI calls for ${Math.ceil(cooldownMs / 1000)}s`,
      );
    }
  }

  /**
   * Retry transient MetaAPI failures with exponential backoff. MetaAPI enforces
   * per-second rate limits (and the free tier is small), so a burst of copy
   * fan-out or account-info reads can hit HTTP 429. Without this, those surface
   * as hard errors. Honors the `Retry-After` header when present.
   *
   * On 429 we also arm a process-wide cooldown so background syncs stop retrying
   * in parallel and do not block the event loop.
   */
  private installRetryInterceptor(client: AxiosInstance): void {
    const maxRetries = Number(process.env.METAAPI_MAX_RETRIES) || 3;

    client.interceptors.request.use((config) => {
      if (this.isRateLimited()) {
        const err: any = new Error(
          `MetaAPI rate-limited; retry after ${Math.ceil(this.rateLimitRemainingMs() / 1000)}s`,
        );
        err.response = { status: 429 };
        err.config = config;
        err.isAxiosError = true;
        throw err;
      }
      return config;
    });

    client.interceptors.response.use(undefined, async (error: any) => {
      const config = error?.config;
      const status = error?.response?.status as number | undefined;
      const isRateLimit = status === 429;
      const isTransient =
        status === 502 ||
        status === 503 ||
        status === 504 ||
        (!error?.response && error?.code && error.code !== 'ECONNABORTED');

      if (!config || (!isRateLimit && !isTransient)) {
        throw error;
      }

      if (isRateLimit) {
        this.enterRateLimitCooldown(error?.response?.headers?.['retry-after']);
        // Do not keep retrying 429 in a tight loop — other callers share one
        // cooldown and will fail-fast until it clears.
        throw error;
      }

      config.__retryCount = (config.__retryCount || 0) + 1;
      if (config.__retryCount > maxRetries) {
        throw error;
      }

      const delayMs = Math.min(500 * 2 ** (config.__retryCount - 1), 8000);

      this.logger.warn(
        `MetaAPI ${status ?? error?.code} — retry ${config.__retryCount}/${maxRetries} in ${delayMs}ms`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return client(config);
    });
  }

  get isLive(): boolean {
    return !!this.token;
  }

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

    let roles = options?.copyFactoryRoles
      ? [...options.copyFactoryRoles]
      : undefined;
    if (
      roles?.includes('SUBSCRIBER') &&
      process.env.ALLOW_METAAPI_SUBSCRIBERS !== 'true'
    ) {
      this.logger.warn(
        'Refusing CopyFactory SUBSCRIBER role — set ALLOW_METAAPI_SUBSCRIBERS=true for paid seats',
      );
      roles = roles.filter((r) => r === 'PROVIDER');
    }
    if (!roles?.length) roles = undefined;

    try {
      let accountId: string;
      let region: string;
      let alreadyConnected = false;

      const existing = await this.findExistingAccount(login, server);
      const existingId = existing?._id ?? existing?.id;
      if (existing && existingId) {
        accountId = existingId;
        region = existing.region || this.defaultRegion;
        this.regionCache.set(accountId, region);
        alreadyConnected =
          existing.state === 'DEPLOYED' &&
          existing.connectionStatus === 'CONNECTED';
        if (existing.state !== 'DEPLOYED') {
          await this.deploy(accountId);
        }
        if (roles?.length) {
          try {
            await this.ensureCopyFactoryRoles(accountId, [...roles]);
          } catch {
          }
        }
      } else {
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
            ...(roles?.length
              ? {
                  application: 'CopyFactory',
                  copyFactoryRoles: roles,
                }
              : {}),
            ...(process.env.METAAPI_REGION
              ? { region: process.env.METAAPI_REGION }
              : {}),
          },
          { headers: this.headers() },
        );

        accountId = provision.data.id;

        const account = await this.getAccount(accountId);
        region = account.region || this.defaultRegion;
        this.regionCache.set(accountId, region);

        if (account.state !== 'DEPLOYED') {
          await this.deploy(accountId);
        }
      }

      const connected = alreadyConnected
        ? true
        : await this.waitForConnection(accountId, 20_000);

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

  async testExisting(
    metaApiAccountId: string,
    region?: string,
  ): Promise<MTConnectionResult> {
    if (!this.isLive) {
      return {
        connected: true,
        balance: 100_000,
        equity: 100_000,
        margin: 0,
        freeMargin: 100_000,
        marginLevel: 0,
        credit: 0,
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
        marginLevel: d.marginLevel,
        credit: d.credit,
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

  async modifyPosition(
    metaApiAccountId: string,
    positionId: string,
    changes: { stopLoss?: number; takeProfit?: number },
    region?: string,
  ): Promise<void> {
    if (!this.isLive) return;
    const resolvedRegion = await this.resolveRegion(metaApiAccountId, region);
    await this.http.post(
      `${this.clientUrl(resolvedRegion)}/users/current/accounts/${metaApiAccountId}/trade`,
      {
        actionType: 'POSITION_MODIFY',
        positionId,
        ...(changes.stopLoss != null ? { stopLoss: changes.stopLoss } : {}),
        ...(changes.takeProfit != null
          ? { takeProfit: changes.takeProfit }
          : {}),
      },
      { headers: this.headers() },
    );
  }

  async closePositionPartial(
    metaApiAccountId: string,
    positionId: string,
    volume: number,
    region?: string,
  ): Promise<{ orderId?: string }> {
    if (!this.isLive) return { orderId: `mock-partial-${Date.now()}` };
    const resolvedRegion = await this.resolveRegion(metaApiAccountId, region);
    const res = await this.http.post(
      `${this.clientUrl(resolvedRegion)}/users/current/accounts/${metaApiAccountId}/trade`,
      { actionType: 'POSITION_PARTIAL', positionId, volume },
      { headers: this.headers() },
    );
    return { orderId: res.data?.orderId };
  }

  async getPosition(
    metaApiAccountId: string,
    positionId: string,
    region?: string,
  ): Promise<any> {
    if (!this.isLive) return null;
    const resolvedRegion = await this.resolveRegion(metaApiAccountId, region);
    try {
      const res = await this.http.get(
        `${this.clientUrl(resolvedRegion)}/users/current/accounts/${metaApiAccountId}/positions/${positionId}`,
        { headers: this.headers() },
      );
      return res.data ?? null;
    } catch {
      return null;
    }
  }

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

  async getPendingOrders(
    metaApiAccountId: string,
    region?: string,
  ): Promise<any[]> {
    if (!this.isLive) return [];
    const resolvedRegion = await this.resolveRegion(metaApiAccountId, region);
    const res = await this.http.get(
      `${this.clientUrl(resolvedRegion)}/users/current/accounts/${metaApiAccountId}/orders`,
      { headers: this.headers() },
    );
    return Array.isArray(res.data) ? res.data : [];
  }

  async getHistoryOrders(
    metaApiAccountId: string,
    from: Date,
    to: Date,
    region?: string,
  ): Promise<any[]> {
    if (!this.isLive || !metaApiAccountId) return [];
    const resolvedRegion = await this.resolveRegion(metaApiAccountId, region);
    const res = await this.http.get(
      `${this.clientUrl(resolvedRegion)}/users/current/accounts/${metaApiAccountId}/history-orders/time/${encodeURIComponent(from.toISOString())}/${encodeURIComponent(to.toISOString())}`,
      { headers: this.headers() },
    );
    return Array.isArray(res.data) ? res.data : [];
  }

  async getSymbols(
    metaApiAccountId: string,
    region?: string,
  ): Promise<any[]> {
    if (!this.isLive || !metaApiAccountId) return [];
    const resolvedRegion = await this.resolveRegion(metaApiAccountId, region);
    const res = await this.http.get(
      `${this.clientUrl(resolvedRegion)}/users/current/accounts/${metaApiAccountId}/symbols`,
      { headers: this.headers() },
    );
    return Array.isArray(res.data) ? res.data : [];
  }

  async getSymbolSpecification(
    metaApiAccountId: string,
    symbol: string,
    region?: string,
  ): Promise<any | null> {
    if (!this.isLive || !metaApiAccountId || !symbol) return null;
    const resolvedRegion = await this.resolveRegion(metaApiAccountId, region);
    try {
      const res = await this.http.get(
        `${this.clientUrl(resolvedRegion)}/users/current/accounts/${metaApiAccountId}/symbols/${encodeURIComponent(symbol)}/specification`,
        { headers: this.headers() },
      );
      return res.data ?? null;
    } catch {
      return null;
    }
  }

  async getLatestTick(
    metaApiAccountId: string,
    symbol: string,
    region?: string,
  ): Promise<any | null> {
    if (!this.isLive || !metaApiAccountId || !symbol) return null;
    const resolvedRegion = await this.resolveRegion(metaApiAccountId, region);
    try {
      const res = await this.http.get(
        `${this.clientUrl(resolvedRegion)}/users/current/accounts/${metaApiAccountId}/symbols/${encodeURIComponent(symbol)}/current-tick`,
        { headers: this.headers() },
      );
      return res.data ?? null;
    } catch {
      return null;
    }
  }

  async getTerminalState(
    metaApiAccountId: string,
    region?: string,
  ): Promise<any | null> {
    if (!this.isLive || !metaApiAccountId) return null;
    const resolvedRegion = await this.resolveRegion(metaApiAccountId, region);
    try {
      const [account, terminal] = await Promise.all([
        this.getAccount(metaApiAccountId).catch(() => null),
        this.http
          .get(
            `${this.clientUrl(resolvedRegion)}/users/current/accounts/${metaApiAccountId}/terminal-state`,
            { headers: this.headers() },
          )
          .then((res) => res.data)
          .catch(() => null),
      ]);
      return { account, terminal };
    } catch {
      return null;
    }
  }

  /** Combined account-information + open-positions fetch, run in parallel,
   * for the DB-first snapshot sync worker. */
  async getFullSnapshot(
    metaApiAccountId: string,
    region?: string,
    options?: { dealsFrom?: Date; dealsTo?: Date },
  ): Promise<MetaApiFullSnapshot | null> {
    if (!this.isLive || !metaApiAccountId) return null;
    const resolvedRegion = await this.resolveRegion(metaApiAccountId, region);
    const start = Date.now();
    try {
      const to = options?.dealsTo ?? new Date();
      const from =
        options?.dealsFrom ?? new Date(to.getTime() - 3 * 24 * 60 * 60 * 1000);
      const sectionErrors: Record<string, string> = {};
      const optional = async <T>(
        section: string,
        producer: () => Promise<T>,
        fallback: T,
      ): Promise<T> => {
        try {
          return await producer();
        } catch (err: any) {
          sectionErrors[section] =
            err?.response?.data?.message || err?.message || 'MetaAPI fetch failed';
          return fallback;
        }
      };

      const [info, account, positions, pendingOrders, deals, orderHistory, symbols, terminalState] = await Promise.all([
        this.fetchAccountInformation(metaApiAccountId, resolvedRegion),
        optional('account', () => this.getAccount(metaApiAccountId), null),
        optional('positions', () => this.getPositions(metaApiAccountId, resolvedRegion), []),
        optional('pendingOrders', () => this.getPendingOrders(metaApiAccountId, resolvedRegion), []),
        optional('deals', () => this.getHistoryDeals(metaApiAccountId, from, to, resolvedRegion), []),
        optional('orderHistory', () => this.getHistoryOrders(metaApiAccountId, from, to, resolvedRegion), []),
        optional('symbols', () => this.getSymbols(metaApiAccountId, resolvedRegion), []),
        optional('terminalState', () => this.getTerminalState(metaApiAccountId, resolvedRegion), null),
      ]);

      const marketSymbols = [
        ...new Set(
          [...positions, ...pendingOrders]
            .map((row) => String(row?.symbol ?? '').trim())
            .filter(Boolean),
        ),
      ].slice(0, 25);
      const marketData = await optional(
        'marketData',
        async () =>
          (
            await Promise.all(
              marketSymbols.map(async (symbol) => ({
                symbol,
                tick: await this.getLatestTick(
                  metaApiAccountId,
                  symbol,
                  resolvedRegion,
                ),
                specification: await this.getSymbolSpecification(
                  metaApiAccountId,
                  symbol,
                  resolvedRegion,
                ),
              })),
            )
          ).filter((row) => row.tick || row.specification),
        [],
      );

      return {
        info,
        account,
        positions,
        pendingOrders,
        deals,
        orderHistory,
        symbols,
        marketData,
        terminalState,
        copyTrading: null,
        latencyMs: Date.now() - start,
        sectionErrors,
      };
    } catch (err: any) {
      this.logger.warn(
        `MetaAPI required account snapshot failed for ${metaApiAccountId}: ${
          err?.response?.data?.message || err?.message || 'unknown error'
        }`,
      );
      return null;
    }
  }

  async getAccountSnapshot(
    metaApiAccountId: string,
    region?: string,
  ): Promise<{
    balance: number;
    equity: number;
    margin: number;
    freeMargin: number;
    marginLevel: number;
    credit: number;
    currency?: string;
  } | null> {
    if (!this.isLive || !metaApiAccountId) return null;
    try {
      const resolvedRegion = await this.resolveRegion(metaApiAccountId, region);
      const d = await this.fetchAccountInformation(
        metaApiAccountId,
        resolvedRegion,
      );
      return {
        balance: Number(d?.balance ?? 0),
        equity: Number(d?.equity ?? d?.balance ?? 0),
        margin: Number(d?.margin ?? 0),
        freeMargin: Number(d?.freeMargin ?? 0),
        marginLevel: Number(d?.marginLevel ?? 0),
        credit: Number(d?.credit ?? 0),
        currency: d?.currency,
      };
    } catch {
      return null;
    }
  }

  async getHistoryDeals(
    metaApiAccountId: string,
    from: Date,
    to: Date,
    region?: string,
  ): Promise<any[]> {
    if (!this.isLive || !metaApiAccountId) return [];
    const resolvedRegion = await this.resolveRegion(metaApiAccountId, region);
    const res = await this.http.get(
      `${this.clientUrl(resolvedRegion)}/users/current/accounts/${metaApiAccountId}/history-deals/time/${encodeURIComponent(from.toISOString())}/${encodeURIComponent(to.toISOString())}`,
      { headers: this.headers() },
    );
    return Array.isArray(res.data) ? res.data : [];
  }

  async getLiveEquity(
    metaApiAccountId: string,
    region?: string,
  ): Promise<number | null> {
    if (!this.isLive || !metaApiAccountId) return null;
    const cached = this.equityCache.get(metaApiAccountId);
    if (cached && Date.now() - cached.at < this.EQUITY_TTL_MS) {
      return cached.equity;
    }
    try {
      const resolvedRegion = await this.resolveRegion(metaApiAccountId, region);
      const d = await this.fetchAccountInformation(
        metaApiAccountId,
        resolvedRegion,
      );
      const equity = typeof d?.equity === 'number' ? d.equity : null;
      if (equity != null) {
        this.equityCache.set(metaApiAccountId, { equity, at: Date.now() });
      }
      return equity;
    } catch {
      return cached?.equity ?? null;
    }
  }

  async ensureCopyFactoryRoles(
    metaApiAccountId: string,
    roles: Array<'PROVIDER' | 'SUBSCRIBER'>,
  ): Promise<void> {
    if (
      !this.isLive ||
      !metaApiAccountId ||
      metaApiAccountId.startsWith('mock-')
    ) {
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

  async waitForDeployed(
    metaApiAccountId: string,
    maxMs = 90_000,
  ): Promise<boolean> {
    if (!this.isLive) return true;
    return this.waitForConnection(metaApiAccountId, maxMs);
  }

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

  private headers() {
    return { 'auth-token': this.token };
  }

  private clientUrl(region: string): string {
    return `https://mt-client-api-v1.${region}.agiliumtrade.ai`;
  }

  private async getAccount(accountId: string): Promise<any> {
    const res = await this.http.get(
      `${this.provisioningUrl}/users/current/accounts/${accountId}`,
      { headers: this.headers() },
    );
    return res.data;
  }

  private async findExistingAccount(
    login: string,
    server: string,
  ): Promise<MetaApiAccountSummary | null> {
    try {
      const res = await this.http.get(
        `${this.provisioningUrl}/users/current/accounts`,
        { headers: this.headers() },
      );
      const list: any[] = Array.isArray(res.data)
        ? res.data
        : (res.data?.items ?? []);
      const matches = list.filter(
        (a) => String(a.login) === String(login) && a.server === server,
      );
      if (!matches.length) return null;
      return (
        matches.find(
          (a) => a.state === 'DEPLOYED' && a.connectionStatus === 'CONNECTED',
        ) ??
        matches.find((a) => a.state === 'DEPLOYED') ??
        matches[0]
      );
    } catch (err: any) {
      this.logger.warn(
        `Could not list MetaAPI accounts for reuse: ${err?.message}`,
      );
      return null;
    }
  }

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
