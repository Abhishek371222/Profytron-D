import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../common/crypto.service';
import { MetaTraderAdapter } from './adapters/metatrader.adapter';
import { PaperBrokerAdapter } from './adapters/paper.adapter';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import {
  ActivationService,
  ACTIVATION_EVENTS,
} from '../growth/activation.service';
import { getTierLimits } from '../../common/constants/pricing.constants';
import { CopyBridgeService } from '../copy-bridge/copy-bridge.service';
import { linkOrphanStrategySubscriptions } from '../../common/utils/broker-requirement.util';
import { seedInitialEquity } from '../../common/utils/account-performance.util';
import { EmailService } from '../email/email.service';

@Injectable()
export class BrokerService {
  private readonly logger = new Logger(BrokerService.name);

  constructor(
    private prisma: PrismaService,
    private cryptoService: CryptoService,
    private mtAdapter: MetaTraderAdapter,
    private paperAdapter: PaperBrokerAdapter,
    private activationService: ActivationService,
    private emailService: EmailService,
    @InjectQueue('copyfactory_sync')
    private readonly copyFactoryQueue: Queue,
  ) {}

  /** True when this connect is for the operator master (MetaApi allowed). */
  private isProviderConnect(dto: { copyFactoryRole?: string }): boolean {
    return dto.copyFactoryRole === 'PROVIDER';
  }

  /** Local validation only — never calls MetaApi (no per-user seat cost). */
  private validateUserMt5Input(
    login: string,
    password: string,
    serverName: string,
  ) {
    const loginTrim = String(login ?? '').trim();
    const passwordTrim = String(password ?? '');
    const serverTrim = String(serverName ?? '').trim();

    if (!loginTrim) {
      throw new BadRequestException('MT5 login (account number) is required.');
    }
    if (!/^\d{3,12}$/.test(loginTrim)) {
      throw new BadRequestException(
        'MT5 login must be your numeric account number (3–12 digits).',
      );
    }
    if (!passwordTrim || passwordTrim.length < 4) {
      throw new BadRequestException('MT5 trading password is required.');
    }
    if (!serverTrim || serverTrim.length < 3) {
      throw new BadRequestException(
        'MT5 server name is required (from File → Open an Account).',
      );
    }
    if (/bitage/i.test(serverTrim) && !/bitrage/i.test(serverTrim)) {
      throw new BadRequestException(
        'Server looks mistyped. Did you mean BitrageCapitalMarkets-Server?',
      );
    }
  }

  /**
   * A single real MT5 login must not be linked to more than one Profytron user
   * at a time. Checked BEFORE calling out to MetaApi so a duplicate attempt
   * never provisions (and pays for) a seat that will just be rejected. Paper/
   * demo logins are exempt — they aren't real MT5 accounts and are commonly
   * reused (e.g. the literal "PAPER" quick-connect login).
   */
  private async assertMt5NotLinkedToAnotherUser(
    userId: string,
    login: string,
    serverName: string,
    last4: string,
  ) {
    const candidates = await this.prisma.brokerAccount.findMany({
      where: {
        userId: { not: userId },
        accountNumberLast4: last4,
        serverName,
        isActive: true,
        isPaperTrading: false,
      },
      select: { credentialsEncrypted: true },
    });

    for (const candidate of candidates) {
      try {
        const creds = JSON.parse(
          this.cryptoService.decrypt(candidate.credentialsEncrypted),
        );
        if (String(creds.login ?? '').trim() === login.trim()) {
          throw new BadRequestException(
            'This MT5 account is already connected to another Profytron account. Each MT5 account can only be linked to one Profytron account at a time. Use Business+ sharing to invite teammates to view your account.',
          );
        }
      } catch (e) {
        if (e instanceof BadRequestException) throw e;
        // Undecryptable row — ignore, don't block on it.
      }
    }
  }

  async connectBroker(userId: string, dto: any) {
    const { brokerName, login, password, serverName, platform } = dto;

    const providerConnect = this.isProviderConnect(dto);

    try {
      // Enforce the plan's broker-account quota BEFORE provisioning anything at
      // MetaAPI, so an over-quota attempt never leaves an orphaned account.
      // Reconnecting an existing login+server reuses its row, so it's exempt.
      const last4Pre = login ? login.slice(-4).padStart(4, '0') : '0000';
      const resolvedNamePre =
        brokerName === 'PAPER' ? 'PAPER' : platform === 'mt4' ? 'MT4' : 'MT5';

      if (brokerName !== 'PAPER') {
        await this.assertMt5NotLinkedToAnotherUser(
          userId,
          login,
          serverName,
          last4Pre,
        );
      }

      const preExisting = await this.prisma.brokerAccount.findFirst({
        where: {
          userId,
          accountNumberLast4: last4Pre,
          serverName,
          brokerName: resolvedNamePre,
          isActive: true,
        },
        select: { id: true },
      });
      if (!preExisting) {
        const activeCount = await this.prisma.brokerAccount.count({
          where: { userId, isActive: true },
        });
        const quotaUser = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { subscriptionTier: true },
        });
        const { maxBrokerAccounts } = getTierLimits(
          quotaUser?.subscriptionTier,
        );
        if (activeCount >= maxBrokerAccounts) {
          throw new BadRequestException(
            `Your plan allows ${maxBrokerAccounts} connected account(s). Upgrade to connect more.`,
          );
        }
      }

      let connectionResult: any;

      if (brokerName === 'PAPER') {
        connectionResult = await this.paperAdapter.connect(login);
      } else if (!providerConnect) {
        // G2 cloud seat WITHOUT CopyFactory roles.
        // CopyFactory SUBSCRIBER requires a separate MetaApi wallet top-up and
        // fails with "please top up your account". MasterSync + MetaApi RPC
        // places copies on the G2 seat (~$2.34/mo) instead.
        const mt = platform === 'mt4' ? 'mt4' : 'mt5';
        this.logger.log(
          `MetaApi G2 connect (no CopyFactory role) for user ${userId}`,
        );
        connectionResult = await this.mtAdapter.connect(
          login,
          password,
          serverName,
          mt,
        );
        if (!connectionResult.connected) {
          throw new BadRequestException(
            connectionResult.error ||
              'Connection failed. Check your credentials.',
          );
        }
        connectionResult = {
          ...connectionResult,
          masterOnly: false,
          executionPath: 'metaapi_rpc',
        };
      } else {
        // Operator master / PROVIDER — MetaApi G2; CF PROVIDER only if allowed.
        const mt = platform === 'mt4' ? 'mt4' : 'mt5';
        const allowCf = process.env.ALLOW_METAAPI_SUBSCRIBERS === 'true';
        connectionResult = await this.mtAdapter.connect(
          login,
          password,
          serverName,
          mt,
          allowCf ? { copyFactoryRoles: ['PROVIDER'] } : undefined,
        );
      }

      if (!connectionResult.connected) {
        throw new BadRequestException(
          connectionResult.error ||
            'Connection failed. Check your credentials.',
        );
      }

      // Mint bridge EA token for master_only live accounts (no MetaApi seat).
      const bridgeToken =
        connectionResult.masterOnly && brokerName !== 'PAPER'
          ? CopyBridgeService.mintToken()
          : null;
      const bridgeTokenHash = bridgeToken
        ? CopyBridgeService.hashToken(bridgeToken)
        : null;

      // Encrypt credentials (login + password)
      const encrypted = this.cryptoService.encrypt(
        JSON.stringify({
          login,
          password,
          platform: platform === 'mt4' ? 'mt4' : 'mt5',
          serverName,
          ...(connectionResult.masterOnly
            ? {
                executionMode: 'master_only',
                metaApiAccountId: null,
                ...(bridgeToken ? { bridgeToken } : {}),
              }
            : {}),
        }),
      );

      const last4 = login ? login.slice(-4).padStart(4, '0') : '0000';
      const resolvedBrokerName =
        brokerName === 'PAPER' ? 'PAPER' : platform === 'mt4' ? 'MT4' : 'MT5';

      // Reuse an existing row for the same login+server instead of stacking a
      // new "connected account" on every reconnect.
      const existingAccount = await this.prisma.brokerAccount.findFirst({
        where: {
          userId,
          accountNumberLast4: last4,
          serverName,
          brokerName: resolvedBrokerName,
          isActive: true,
        },
      });

      const existingCount = await this.prisma.brokerAccount.count({
        where: { userId, isActive: true },
      });
      const isDefault = existingCount === 0;

      const liveAtConnect = Number(
        connectionResult.equity ?? connectionResult.balance ?? 0,
      );
      const seeded = seedInitialEquity(
        existingAccount?.initialEquity,
        liveAtConnect,
      );

      const account = existingAccount
        ? await this.prisma.brokerAccount.update({
            where: { id: existingAccount.id },
            data: {
              credentialsEncrypted: encrypted,
              ...(bridgeTokenHash ? { bridgeTokenHash } : {}),
              // Never overwrite a stored return baseline on reconnect.
              ...(seeded != null ? { initialEquity: seeded } : {}),
              ...(liveAtConnect > 0
                ? {
                    lastKnownEquity: liveAtConnect,
                    lastKnownBalance: Number(
                      connectionResult.balance ?? liveAtConnect,
                    ),
                  }
                : {}),
            },
          })
        : await this.prisma.brokerAccount.create({
            data: {
              userId,
              brokerName: resolvedBrokerName,
              accountNumberLast4: last4,
              credentialsEncrypted: encrypted,
              ...(bridgeTokenHash ? { bridgeTokenHash } : {}),
              serverName,
              isPaperTrading: brokerName === 'PAPER',
              isDefault,
              initialEquity: seeded ?? null,
              ...(liveAtConnect > 0
                ? {
                    lastKnownEquity: liveAtConnect,
                    lastKnownBalance: Number(
                      connectionResult.balance ?? liveAtConnect,
                    ),
                  }
                : {}),
            },
          });

      // Re-encrypt with metaApiAccountId + region included so later trade and
      // account-info calls hit the correct region-specific MetaAPI host.
      if (connectionResult.metaApiAccountId) {
        const enriched = this.cryptoService.encrypt(
          JSON.stringify({
            login,
            password,
            platform,
            serverName,
            metaApiAccountId: connectionResult.metaApiAccountId,
            metaApiRegion: connectionResult.metaApiRegion,
            executionMode: 'metaapi_rpc',
          }),
        );
        await this.prisma.brokerAccount.update({
          where: { id: account.id },
          data: { credentialsEncrypted: enriched },
        });
      }

      await this.prisma.auditLog.create({
        data: {
          eventType: 'BROKER_CONNECTED',
          userId,
          detailsJson: {
            brokerName: account.brokerName,
            accountId: account.id,
            server: serverName,
          },
          triggeredBy: 'USER',
        },
      });

      // CopyFactory strategy link runs via copyfactory_sync when the user
      // subscribes to a bot (subscription-cleanup / CopyFactorySyncService).

      await this.activationService.track(
        userId,
        ACTIVATION_EVENTS.BROKER_CONNECTED,
        { brokerName: account.brokerName, isPaper: brokerName === 'PAPER' },
      );
      if (brokerName === 'PAPER') {
        await this.activationService.track(
          userId,
          ACTIVATION_EVENTS.FIRST_PAPER_TRADE,
          { mode: 'paper_account_connected' },
        );
      }

      // Link any bots that were activated before a broker existed (or after disconnect).
      if (brokerName !== 'PAPER') {
        const linked = await linkOrphanStrategySubscriptions(
          this.prisma,
          userId,
          account.id,
        );
        if (linked > 0) {
          this.logger.log(
            `Linked ${linked} orphan bot subscription(s) to broker ${account.id} for user ${userId}`,
          );
        }
      }

      const { credentialsEncrypted: _, ...safe } = account as any;
      return {
        ...safe,
        // pending=true means the account is provisioned and deploying, but the
        // broker terminal hasn't streamed live balance yet (demo servers can be
        // slow). The account is saved; balance appears on the next test/refresh.
        pending: connectionResult.pending ?? false,
        masterOnly: Boolean(connectionResult.masterOnly),
        executionPath: connectionResult.executionPath ?? null,
        // Shown once — paste into ProfytronCopyBridge EA. Rotate via bridge-token endpoint.
        ...(bridgeToken ? { bridgeToken } : {}),
        accountInfo: {
          balance: connectionResult.balance,
          equity: connectionResult.equity,
          currency: connectionResult.currency,
          leverage: connectionResult.leverage,
          broker: connectionResult.broker,
          accountType: connectionResult.accountType,
        },
      };
    } catch (e) {
      this.logger.error(
        `Failed to connect broker for user ${userId}: ${e.message}`,
      );
      throw new BadRequestException(e.message || 'Broker connection failed');
    }
  }

  async getBrokerAccounts(userId: string) {
    const ownedAccounts = await this.prisma.brokerAccount.findMany({
      where: { userId, isActive: true },
      orderBy: { connectedAt: 'desc' },
    });

    const activeShares = await this.prisma.brokerAccountShare.findMany({
      where: { memberUserId: userId, status: 'ACTIVE' },
      include: { owner: { select: { fullName: true } } },
    });
    const sharedAccountIds = activeShares.map((s) => s.brokerAccountId);
    const sharedAccounts = sharedAccountIds.length
      ? await this.prisma.brokerAccount.findMany({
          where: { id: { in: sharedAccountIds }, isActive: true },
          orderBy: { connectedAt: 'desc' },
        })
      : [];
    const ownerNameByAccountId = new Map(
      activeShares.map((s) => [s.brokerAccountId, s.owner.fullName]),
    );

    // Enrich each account with its live balance/equity from MetaAPI so the
    // "Connected Accounts" page shows real-time numbers instead of the value
    // captured at connect time. Each live read is time-boxed and failures fall
    // back to the stored baseline so the list never hangs or 500s.
    const [enrichedOwned, enrichedShared] = await Promise.all([
      Promise.all(ownedAccounts.map((a) => this.enrichAccount(a))),
      Promise.all(sharedAccounts.map((a) => this.enrichAccount(a))),
    ]);

    return [
      ...enrichedOwned.map((a) => ({
        ...a,
        sharedAccess: false,
        canManage: true,
      })),
      ...enrichedShared.map((a, i) => ({
        ...a,
        sharedAccess: true,
        canManage: false,
        sharedByName: ownerNameByAccountId.get(sharedAccounts[i].id) ?? null,
      })),
    ];
  }

  private async enrichAccount(account: any) {
    const { credentialsEncrypted, ...safe } = account;

    if (account.isPaperTrading) {
      return {
        ...safe,
        balance: safe.initialEquity ?? null,
        equity: safe.initialEquity ?? null,
        currency: 'USD',
        connectionStatus: 'CONNECTED',
        liveSynced: Number(safe.initialEquity ?? 0) > 0,
        fillMode: 'paper',
      };
    }

    let creds: Record<string, any> = {};
    try {
      creds = JSON.parse(this.cryptoService.decrypt(credentialsEncrypted));
    } catch {
      creds = {};
    }

    const metaApiId: string | undefined = creds.metaApiAccountId;
    const storeOnly =
      !metaApiId ||
      metaApiId.startsWith('mock-') ||
      creds.executionMode === 'master_only' ||
      Boolean(account.bridgeTokenHash);

    // Store-only / bridge accounts: never wait on MetaApi — they are linked.
    if (storeOnly) {
      return {
        ...safe,
        balance: safe.initialEquity ?? null,
        equity: safe.initialEquity ?? null,
        currency: 'USD',
        leverage: null,
        connectionStatus: 'CONNECTED',
        liveSynced: Number(safe.initialEquity ?? 0) > 0,
        fillMode: 'bridge',
        storeOnly: true,
        login: creds.login ?? null,
        platform: creds.platform ?? 'mt5',
        serverName: safe.serverName ?? creds.serverName ?? null,
        balanceNote:
          'Live broker balance appears after ProfytronCopyBridge EA reports it (no MetaApi seat).',
      };
    }

    let live: any = null;
    let connectionStatus = 'CONNECTING';
    let liveSynced = false;

    if (this.mtAdapter.isLive) {
      try {
        const info = await this.withTimeout(
          this.mtAdapter.testExisting(metaApiId, creds.metaApiRegion),
          8_000,
          { connected: false } as any,
        );
        if (info?.connected) {
          live = info;
          connectionStatus = 'CONNECTED';
          const liveEquity = Number(info.equity ?? info.balance ?? 0);
          const liveBalance = Number(info.balance ?? info.equity ?? 0);
          liveSynced = liveEquity > 0;
          if (liveSynced) {
            // Persist live cache every sync; seed initialEquity only once.
            const seed = seedInitialEquity(account.initialEquity, liveEquity);
            void this.prisma.brokerAccount
              .update({
                where: { id: account.id },
                data: {
                  lastKnownEquity: liveEquity,
                  lastKnownBalance: liveBalance,
                  lastConnectedAt: new Date(),
                  ...(seed != null ? { initialEquity: seed } : {}),
                },
              })
              .catch(() => undefined);
          }
        }
      } catch {
        /* keep CONNECTING + stored baseline */
      }
    } else {
      connectionStatus = 'CONNECTED';
      liveSynced = true;
    }

    const balance =
      live?.balance ?? safe.lastKnownBalance ?? safe.initialEquity ?? null;
    const equity =
      live?.equity ??
      live?.balance ??
      safe.lastKnownEquity ??
      safe.initialEquity ??
      null;

    return {
      ...safe,
      balance,
      equity,
      margin: live?.margin ?? 0,
      freeMargin:
        live?.freeMargin ??
        (equity != null
          ? Math.max(0, Number(equity) - Number(live?.margin ?? 0))
          : null),
      currency: live?.currency ?? 'USD',
      leverage: live?.leverage ?? null,
      connectionStatus,
      liveSynced: liveSynced || Boolean(safe.initialEquity),
      fillMode: 'metaapi',
      storeOnly: false,
    };
  }

  /** Resolve `p`, or `fallback` if it doesn't settle within `ms`. */
  private withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
    return Promise.race([
      p.catch(() => fallback),
      new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
    ]);
  }

  async disconnectBroker(userId: string, accountId: string) {
    const account = await this.prisma.brokerAccount.findFirst({
      where: { id: accountId, userId, isActive: true },
    });
    if (!account) throw new BadRequestException('Account not found');

    // Soft-delete FIRST so the UI always frees the slot, even if MetaApi / Redis
    // cleanup hangs or fails (common on localhost without a healthy queue).
    await this.prisma.$transaction([
      this.prisma.brokerAccount.update({
        where: { id: accountId },
        data: { isActive: false },
      }),
      this.prisma.userStrategySubscription.updateMany({
        where: { brokerAccountId: accountId },
        data: { brokerAccountId: null },
      }),
    ]);

    // Best-effort background cleanup — never fail the disconnect response.
    void this.cleanupDisconnectedAccount(account).catch((err) => {
      this.logger.warn(
        `Post-disconnect cleanup failed for ${accountId}: ${(err as Error).message}`,
      );
    });

    return { success: true, disconnected: true, accountId };
  }

  private async cleanupDisconnectedAccount(account: {
    id: string;
    isPaperTrading: boolean;
    credentialsEncrypted: string;
  }) {
    const linkedSubs = await this.prisma.userStrategySubscription.findMany({
      where: { brokerAccountId: account.id },
      select: { id: true },
    });
    for (const sub of linkedSubs) {
      try {
        await this.copyFactoryQueue.add(
          'sync_copyfactory',
          { action: 'unlink', subscriptionId: sub.id },
          {
            removeOnComplete: true,
            attempts: 2,
            backoff: { type: 'exponential', delay: 2000 },
          },
        );
      } catch {
        /* Redis unavailable — ignore */
      }
    }

    if (!account.isPaperTrading && this.mtAdapter.isLive) {
      try {
        const creds = JSON.parse(
          this.cryptoService.decrypt(account.credentialsEncrypted),
        );
        if (creds.metaApiAccountId) {
          await this.mtAdapter.deprovision(creds.metaApiAccountId);
        }
      } catch {
        /* non-fatal */
      }
    }
  }

  async testConnection(userId: string, accountId: string) {
    const account = await this.prisma.brokerAccount.findFirst({
      where: { id: accountId, userId, isActive: true },
    });
    if (!account) throw new BadRequestException('Account not found');

    try {
      if (account.isPaperTrading) {
        const r = await this.paperAdapter.connect(account.accountNumberLast4);
        return { connected: r.connected, accountInfo: r };
      }

      const creds = JSON.parse(
        this.cryptoService.decrypt(account.credentialsEncrypted),
      );

      // Only test an already-provisioned MetaAPI account. NEVER call connect()
      // here — connect() provisions a NEW MetaAPI account, so doing it on a
      // (potentially polled) test endpoint would spawn duplicate accounts and
      // exhaust the MetaAPI quota. Legacy/mock accounts without a real id must
      // be reconnected instead.
      const metaApiId: string | undefined = creds.metaApiAccountId;
      if (!metaApiId || metaApiId.startsWith('mock-')) {
        if (creds.executionMode === 'master_only' || account.bridgeTokenHash) {
          return {
            connected: true,
            accountInfo: {
              mode: 'master_only',
              bridgeReady: Boolean(account.bridgeTokenHash),
              message:
                'Credentials stored. Live fills use the ProfytronCopyBridge EA (no MetaApi seat).',
            },
          };
        }
        return {
          connected: false,
          error: 'Account not linked to MetaAPI. Please reconnect this broker.',
        };
      }

      const result = await this.mtAdapter.testExisting(
        metaApiId,
        creds.metaApiRegion,
      );

      return { connected: result.connected, accountInfo: result };
    } catch (e) {
      return { connected: false, error: 'Connection failed' };
    }
  }

  async getAccountInfo(userId: string, accountId: string) {
    const test = await this.testConnection(userId, accountId);
    if (!test.connected)
      throw new BadRequestException('Cannot fetch account info; disconnected');
    return test.accountInfo;
  }

  /** Rotate the bridge EA token. Plaintext is returned once. */
  async rotateBridgeToken(userId: string, accountId: string) {
    const account = await this.prisma.brokerAccount.findFirst({
      where: { id: accountId, userId, isActive: true },
    });
    if (!account) throw new NotFoundException('Account not found');
    if (account.isPaperTrading) {
      throw new BadRequestException('Paper accounts do not use a bridge token');
    }

    const bridgeToken = CopyBridgeService.mintToken();
    const bridgeTokenHash = CopyBridgeService.hashToken(bridgeToken);

    let creds: Record<string, unknown> = {};
    try {
      creds = JSON.parse(
        this.cryptoService.decrypt(account.credentialsEncrypted),
      );
    } catch {
      creds = {};
    }
    creds.bridgeToken = bridgeToken;
    creds.executionMode = creds.executionMode ?? 'master_only';
    creds.metaApiAccountId = creds.metaApiAccountId ?? null;

    await this.prisma.brokerAccount.update({
      where: { id: account.id },
      data: {
        bridgeTokenHash,
        credentialsEncrypted: this.cryptoService.encrypt(JSON.stringify(creds)),
      },
    });

    return {
      accountId: account.id,
      bridgeToken,
      message:
        'Paste this token into ProfytronCopyBridge. Previous token is revoked.',
    };
  }

  /**
   * Grant a teammate view-only access to one of the caller's broker accounts.
   * Gated behind the owner's plan (getTierLimits().maxTeamMembers). If the
   * invitee doesn't have a Profytron account yet, the share is created against
   * inviteEmail alone (memberUserId null) and resolved later by
   * resolvePendingSharesForEmail() when they register.
   */
  async shareBrokerAccount(
    ownerUserId: string,
    accountId: string,
    email: string,
  ) {
    const normalizedEmail = String(email ?? '')
      .trim()
      .toLowerCase();
    if (!normalizedEmail) {
      throw new BadRequestException('Email is required.');
    }

    const account = await this.prisma.brokerAccount.findFirst({
      where: { id: accountId, userId: ownerUserId, isActive: true },
    });
    if (!account) throw new BadRequestException('Account not found');

    const owner = await this.prisma.user.findUnique({
      where: { id: ownerUserId },
      select: { email: true, fullName: true, subscriptionTier: true },
    });
    if (!owner) throw new BadRequestException('Owner not found');

    if (normalizedEmail === owner.email.toLowerCase()) {
      throw new BadRequestException(
        'You cannot share an account with yourself.',
      );
    }

    const { maxTeamMembers } = getTierLimits(owner.subscriptionTier);
    if (maxTeamMembers <= 0) {
      throw new BadRequestException(
        'Sharing a broker account requires a Business plan or higher. Upgrade to invite teammates.',
      );
    }

    const activeShareCount = await this.prisma.brokerAccountShare.count({
      where: { ownerUserId, status: { in: ['ACTIVE', 'PENDING'] } },
    });
    if (activeShareCount >= maxTeamMembers) {
      throw new BadRequestException(
        `Your plan allows up to ${maxTeamMembers} shared teammate(s). Revoke an existing share to invite someone new.`,
      );
    }

    const existing = await this.prisma.brokerAccountShare.findUnique({
      where: {
        brokerAccountId_inviteEmail: {
          brokerAccountId: accountId,
          inviteEmail: normalizedEmail,
        },
      },
    });
    if (
      existing &&
      existing.status !== 'REVOKED' &&
      existing.status !== 'DECLINED'
    ) {
      throw new BadRequestException(
        'This person has already been invited to this account.',
      );
    }

    const invitee = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    const share = existing
      ? await this.prisma.brokerAccountShare.update({
          where: { id: existing.id },
          data: {
            status: 'PENDING',
            memberUserId: invitee?.id ?? null,
            invitedAt: new Date(),
            respondedAt: null,
          },
        })
      : await this.prisma.brokerAccountShare.create({
          data: {
            brokerAccountId: accountId,
            ownerUserId,
            memberUserId: invitee?.id ?? null,
            inviteEmail: normalizedEmail,
          },
        });

    const ownerName = owner.fullName || 'A Profytron user';
    const accountLabel = `${account.brokerName} ···${account.accountNumberLast4}`;

    if (invitee) {
      await this.prisma.notification.create({
        data: {
          userId: invitee.id,
          type: 'INFO',
          title: 'Broker account shared with you',
          body: `${ownerName} invited you to view their MT5 account (${accountLabel}).`,
          actionUrl: '/connected-accounts',
        },
      });
    } else {
      this.emailService
        .sendLifecycleEmail(normalizedEmail, 'there', {
          subject: `${ownerName} invited you to Profytron`,
          headline: 'You were invited to view a shared MT5 account',
          body: `${ownerName} wants to share their connected MT5 account (${accountLabel}) with you on Profytron. Create an account with this email to accept.`,
          ctaLabel: 'Create your account',
          ctaPath: `/register?email=${encodeURIComponent(normalizedEmail)}`,
        })
        .catch(() => undefined);
    }

    return { shared: true, shareId: share.id, status: share.status };
  }

  async acceptShare(userId: string, shareId: string) {
    const share = await this.prisma.brokerAccountShare.findFirst({
      where: { id: shareId, memberUserId: userId, status: 'PENDING' },
    });
    if (!share) throw new BadRequestException('Invite not found');

    const updated = await this.prisma.brokerAccountShare.update({
      where: { id: shareId },
      data: { status: 'ACTIVE', respondedAt: new Date() },
    });

    await this.prisma.notification.create({
      data: {
        userId: share.ownerUserId,
        type: 'SUCCESS',
        title: 'Invite accepted',
        body: 'A teammate accepted your shared MT5 account invite.',
        actionUrl: '/connected-accounts',
      },
    });

    return updated;
  }

  async declineShare(userId: string, shareId: string) {
    const share = await this.prisma.brokerAccountShare.findFirst({
      where: { id: shareId, memberUserId: userId, status: 'PENDING' },
    });
    if (!share) throw new BadRequestException('Invite not found');

    return this.prisma.brokerAccountShare.update({
      where: { id: shareId },
      data: { status: 'DECLINED', respondedAt: new Date() },
    });
  }

  /** Callable by either the owner or the member — either side can end a share. */
  async revokeShare(userId: string, shareId: string) {
    const share = await this.prisma.brokerAccountShare.findFirst({
      where: {
        id: shareId,
        status: { in: ['PENDING', 'ACTIVE'] },
        OR: [{ ownerUserId: userId }, { memberUserId: userId }],
      },
    });
    if (!share) throw new BadRequestException('Share not found');

    return this.prisma.brokerAccountShare.update({
      where: { id: shareId },
      data: { status: 'REVOKED', respondedAt: new Date() },
    });
  }

  async listShares(userId: string) {
    const [owned, received] = await Promise.all([
      this.prisma.brokerAccountShare.findMany({
        where: { ownerUserId: userId },
        include: {
          brokerAccount: {
            select: { brokerName: true, accountNumberLast4: true },
          },
          member: { select: { fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.brokerAccountShare.findMany({
        where: { memberUserId: userId },
        include: {
          brokerAccount: {
            select: { brokerName: true, accountNumberLast4: true },
          },
          owner: { select: { fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { owned, received };
  }

  /**
   * Called from AuthService.register() right after a new user is created —
   * resolves any pending email-only share invites (sent before the invitee had
   * a Profytron account) by linking them to the new user and notifying them.
   */
  async resolvePendingSharesForEmail(userId: string, email: string) {
    const normalizedEmail = String(email ?? '')
      .trim()
      .toLowerCase();
    if (!normalizedEmail) return;

    const pending = await this.prisma.brokerAccountShare.findMany({
      where: {
        inviteEmail: normalizedEmail,
        memberUserId: null,
        status: 'PENDING',
      },
      include: {
        owner: { select: { fullName: true } },
        brokerAccount: {
          select: { brokerName: true, accountNumberLast4: true },
        },
      },
    });

    for (const share of pending) {
      await this.prisma.brokerAccountShare.update({
        where: { id: share.id },
        data: { memberUserId: userId },
      });
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'INFO',
          title: 'Broker account shared with you',
          body: `${share.owner.fullName || 'A Profytron user'} invited you to view their MT5 account (${share.brokerAccount.brokerName} ···${share.brokerAccount.accountNumberLast4}).`,
          actionUrl: '/connected-accounts',
        },
      });
    }
  }
}
