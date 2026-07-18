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

  private isProviderConnect(dto: { copyFactoryRole?: string }): boolean {
    return dto.copyFactoryRole === 'PROVIDER';
  }

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
      }
    }
  }

  async connectBroker(userId: string, dto: any) {
    const { brokerName, login, password, serverName, platform } = dto;

    const providerConnect = this.isProviderConnect(dto);

    try {
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

      const bridgeToken =
        connectionResult.masterOnly && brokerName !== 'PAPER'
          ? CopyBridgeService.mintToken()
          : null;
      const bridgeTokenHash = bridgeToken
        ? CopyBridgeService.hashToken(bridgeToken)
        : null;

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

      const existingAccount = await this.prisma.brokerAccount.findFirst({
        where: {
          userId,
          accountNumberLast4: last4,
          serverName,
          brokerName: resolvedBrokerName,
          isActive: true,
        },
        select: { id: true, initialEquity: true },
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
        pending: connectionResult.pending ?? false,
        masterOnly: Boolean(connectionResult.masterOnly),
        executionPath: connectionResult.executionPath ?? null,
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
    const [ownedAccounts, activeShares] = await Promise.all([
      this.prisma.brokerAccount.findMany({
        where: { userId, isActive: true },
        orderBy: { connectedAt: 'desc' },
      }),
      this.prisma.brokerAccountShare.findMany({
        where: { memberUserId: userId, status: 'ACTIVE' },
        include: { owner: { select: { fullName: true } } },
      }),
    ]);
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
      ...enrichedShared.map((a, i) => {
        const { login: _login, ...viewOnly } = a;
        return {
          ...viewOnly,
          sharedAccess: true,
          canManage: false,
          sharedByName: ownerNameByAccountId.get(sharedAccounts[i].id) ?? null,
        };
      }),
    ];
  }

  private async enrichAccount(account: any) {
    const { credentialsEncrypted, ...safe } = account;

    if (account.isPaperTrading) {
      return {
        ...safe,
        balance: safe.initialEquity ?? null,
        equity: safe.initialEquity ?? null,
        margin: 0,
        freeMargin: safe.initialEquity ?? null,
        marginLevel: null,
        credit: 0,
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

    if (storeOnly) {
      return {
        ...safe,
        balance: safe.initialEquity ?? null,
        equity: safe.initialEquity ?? null,
        margin: 0,
        freeMargin: safe.initialEquity ?? null,
        marginLevel: null,
        credit: 0,
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

    // DB-first: read the newest background-synced snapshot instead of
    // calling MetaAPI live on every dashboard/account-list request. The
    // AccountHistorySyncService worker keeps this row fresh (~40s cadence);
    // if no snapshot exists yet (account just connected, first cycle
    // pending), fall through to the seeded lastKnownEquity/initialEquity
    // below — exactly as before this change.
    let live: any = null;
    let connectionStatus = 'CONNECTING';
    let liveSynced = false;
    let lastSyncedAt: Date | null = null;
    let syncStatus: string | null = null;
    let syncDurationMs: number | null = null;
    let metaApiLatencyMs: number | null = null;
    let apiVersion: string | null = null;

    const db = this.prisma as any;
    const latest = await db.accountLatestSnapshot.findUnique({
      where: { brokerAccountId: account.id },
      include: { snapshot: true },
    });
    const snapshot =
      latest?.snapshot ??
      (await db.accountSnapshot.findFirst({
        where: { brokerAccountId: account.id },
        orderBy: { capturedAt: 'desc' },
      }));
    if (snapshot) {
      live = {
        balance: snapshot.balance,
        equity: snapshot.equity,
        margin: snapshot.margin,
        freeMargin: snapshot.freeMargin,
        marginLevel: snapshot.marginLevel,
        credit: snapshot.credit,
        currency: snapshot.currency,
        leverage: snapshot.leverage,
      };
      lastSyncedAt = snapshot.capturedAt;
      syncStatus = snapshot.syncStatus;
      syncDurationMs = snapshot.syncDurationMs;
      metaApiLatencyMs = snapshot.metaApiLatencyMs;
      apiVersion = snapshot.apiVersion;
      liveSynced = snapshot.equity > 0;
      const ageMs = Date.now() - snapshot.capturedAt.getTime();
      // Fresh within ~3 sync cycles — otherwise flag as syncing while still
      // showing the last stored database values.
      connectionStatus = ageMs < 3 * 10_000 ? 'CONNECTED' : 'SYNCING';
    } else if (!this.mtAdapter.isLive) {
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

    const margin = live?.margin ?? 0;
    const freeMargin =
      live?.freeMargin ??
      (equity != null ? Math.max(0, Number(equity) - Number(margin)) : null);
    const marginLevel =
      live?.marginLevel ??
      (margin > 0 && equity != null ? (Number(equity) / margin) * 100 : null);

    return {
      ...safe,
      balance,
      equity,
      margin,
      freeMargin,
      marginLevel,
      credit: live?.credit ?? 0,
      currency: live?.currency ?? 'USD',
      leverage: live?.leverage ?? null,
      connectionStatus,
      liveSynced: liveSynced || Boolean(safe.initialEquity),
      lastSyncedAt,
      syncStatus,
      syncDurationMs,
      metaApiLatencyMs,
      apiVersion,
      source: live ? 'database' : 'last_known',
      fillMode: 'metaapi',
      storeOnly: false,
    };
  }

  async disconnectBroker(userId: string, accountId: string) {
    const account = await this.prisma.brokerAccount.findFirst({
      where: { id: accountId, userId, isActive: true },
    });
    if (!account) throw new BadRequestException('Account not found');

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
        /* ignore */
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
        /* ignore */
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
    const account = await this.prisma.brokerAccount.findFirst({
      where: { id: accountId, userId, isActive: true },
    });
    if (!account) throw new BadRequestException('Account not found');
    const enriched = await this.enrichAccount(account);
    return {
      source: enriched.source ?? 'database',
      connected:
        enriched.connectionStatus === 'CONNECTED' ||
        enriched.connectionStatus === 'SYNCING',
      balance: enriched.balance,
      equity: enriched.equity,
      margin: enriched.margin,
      freeMargin: enriched.freeMargin,
      marginLevel: enriched.marginLevel,
      credit: enriched.credit,
      currency: enriched.currency,
      leverage: enriched.leverage,
      connectionStatus: enriched.connectionStatus,
      lastSyncedAt: enriched.lastSyncedAt,
      syncStatus: enriched.syncStatus,
      syncDurationMs: enriched.syncDurationMs,
      metaApiLatencyMs: enriched.metaApiLatencyMs,
      apiVersion: enriched.apiVersion,
    };
  }

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
      select: { id: true, brokerName: true, accountNumberLast4: true },
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
