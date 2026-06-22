import { Injectable, BadRequestException, Logger } from '@nestjs/common';
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

@Injectable()
export class BrokerService {
  private readonly logger = new Logger(BrokerService.name);

  constructor(
    private prisma: PrismaService,
    private cryptoService: CryptoService,
    private mtAdapter: MetaTraderAdapter,
    private paperAdapter: PaperBrokerAdapter,
    private activationService: ActivationService,
    @InjectQueue('copyfactory_sync')
    private readonly copyFactoryQueue: Queue,
  ) {}

  async connectBroker(userId: string, dto: any) {
    const {
      brokerName,
      login,
      password,
      serverName,
      platform,
      copyFactoryRole,
    } = dto;

    try {
      let connectionResult: any;

      if (brokerName === 'PAPER') {
        connectionResult = await this.paperAdapter.connect(login);
      } else {
        // All real MT4/MT5 brokers go through MetaTraderAdapter
        const mt = platform === 'mt4' ? 'mt4' : 'mt5';
        const roles =
          copyFactoryRole === 'PROVIDER'
            ? (['PROVIDER'] as const)
            : copyFactoryRole === 'SUBSCRIBER' || copyFactoryRole === undefined
              ? (['SUBSCRIBER'] as const)
              : undefined;
        connectionResult = await this.mtAdapter.connect(
          login,
          password,
          serverName,
          mt,
          roles ? { copyFactoryRoles: [...roles] } : undefined,
        );
      }

      if (!connectionResult.connected) {
        throw new BadRequestException(
          connectionResult.error ||
            'Connection failed. Check your credentials.',
        );
      }

      // Encrypt credentials (login + password)
      const encrypted = this.cryptoService.encrypt(
        JSON.stringify({ login, password }),
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
        where: { userId },
      });
      const isDefault = existingCount === 0;

      const account = existingAccount
        ? await this.prisma.brokerAccount.update({
            where: { id: existingAccount.id },
            data: {
              credentialsEncrypted: encrypted,
              initialEquity:
                Number(
                  connectionResult.equity ?? connectionResult.balance ?? 0,
                ) || existingAccount.initialEquity,
            },
          })
        : await this.prisma.brokerAccount.create({
            data: {
              userId,
              brokerName: resolvedBrokerName,
              accountNumberLast4: last4,
              credentialsEncrypted: encrypted,
              serverName,
              isPaperTrading: brokerName === 'PAPER',
              isDefault,
              initialEquity:
                Number(
                  connectionResult.equity ?? connectionResult.balance ?? 0,
                ) || null,
            },
          });

      // Re-encrypt with metaApiAccountId + region included so later trade and
      // account-info calls hit the correct region-specific MetaAPI host.
      if (connectionResult.metaApiAccountId) {
        const enriched = this.cryptoService.encrypt(
          JSON.stringify({
            login,
            password,
            metaApiAccountId: connectionResult.metaApiAccountId,
            metaApiRegion: connectionResult.metaApiRegion,
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

      if (brokerName !== 'PAPER') {
        await this.copyFactoryQueue.add(
          'sync_copyfactory',
          { action: 'link', userId },
          {
            removeOnComplete: true,
            attempts: 4,
            backoff: { type: 'exponential', delay: 5000 },
          },
        );
      }

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

      const { credentialsEncrypted: _, ...safe } = account as any;
      return {
        ...safe,
        // pending=true means the account is provisioned and deploying, but the
        // broker terminal hasn't streamed live balance yet (demo servers can be
        // slow). The account is saved; balance appears on the next test/refresh.
        pending: connectionResult.pending ?? false,
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
    const accounts = await this.prisma.brokerAccount.findMany({
      where: { userId, isActive: true },
      orderBy: { connectedAt: 'desc' },
    });
    return accounts.map(({ credentialsEncrypted: _, ...safe }) => safe);
  }

  async disconnectBroker(userId: string, accountId: string) {
    const account = await this.prisma.brokerAccount.findFirst({
      where: { id: accountId, userId, isActive: true },
    });
    if (!account) throw new BadRequestException('Account not found');

    // Deprovision from MetaAPI if applicable
    if (!account.isPaperTrading && this.mtAdapter.isLive) {
      try {
        const creds = JSON.parse(
          this.cryptoService.decrypt(account.credentialsEncrypted),
        );
        if (creds.metaApiAccountId) {
          await this.mtAdapter.deprovision(creds.metaApiAccountId);
        }
      } catch (_) {
        /* non-fatal */
      }
    }

    await this.prisma.brokerAccount.update({
      where: { id: accountId },
      data: { isActive: false },
    });

    return { success: true };
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
}
