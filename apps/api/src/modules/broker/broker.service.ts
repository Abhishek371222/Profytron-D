import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../common/crypto.service';
import { MetaTraderAdapter } from './adapters/metatrader.adapter';
import { PaperBrokerAdapter } from './adapters/paper.adapter';

@Injectable()
export class BrokerService {
  private readonly logger = new Logger(BrokerService.name);

  constructor(
    private prisma: PrismaService,
    private cryptoService: CryptoService,
    private mtAdapter: MetaTraderAdapter,
    private paperAdapter: PaperBrokerAdapter,
  ) {}

  async connectBroker(userId: string, dto: any) {
    const { brokerName, login, password, serverName, platform } = dto;

    try {
      let connectionResult: any;

      if (brokerName === 'PAPER') {
        connectionResult = await this.paperAdapter.connect(login);
      } else {
        // All real MT4/MT5 brokers go through MetaTraderAdapter
        const mt = platform === 'mt4' ? 'mt4' : 'mt5';
        connectionResult = await this.mtAdapter.connect(login, password, serverName, mt);
      }

      if (!connectionResult.connected) {
        throw new BadRequestException(
          connectionResult.error || 'Connection failed. Check your credentials.',
        );
      }

      // Encrypt credentials (login + password)
      const encrypted = this.cryptoService.encrypt(
        JSON.stringify({ login, password }),
      );

      const last4 = login ? login.slice(-4).padStart(4, '0') : '0000';

      const existingCount = await this.prisma.brokerAccount.count({ where: { userId } });
      const isDefault = existingCount === 0;

      const account = await this.prisma.brokerAccount.create({
        data: {
          userId,
          brokerName: brokerName === 'PAPER' ? 'PAPER' : (platform === 'mt4' ? 'MT4' : 'MT5'),
          accountNumberLast4: last4,
          credentialsEncrypted: encrypted,
          serverName,
          isPaperTrading: brokerName === 'PAPER',
          isDefault,
          // store MetaAPI account ID for future use if available
          ...(connectionResult.metaApiAccountId && {
            // We'll store it in serverName as "SERVER|metaApiId" or we can add a field
            // For now we keep it in the encrypted blob
          }),
        },
      });

      // Re-encrypt with metaApiAccountId included
      if (connectionResult.metaApiAccountId) {
        const enriched = this.cryptoService.encrypt(
          JSON.stringify({ login, password, metaApiAccountId: connectionResult.metaApiAccountId }),
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
          detailsJson: { brokerName: account.brokerName, accountId: account.id, server: serverName },
          triggeredBy: 'USER',
        },
      });

      const { credentialsEncrypted: _, ...safe } = account as any;
      return {
        ...safe,
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
      this.logger.error(`Failed to connect broker for user ${userId}: ${e.message}`);
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
        const creds = JSON.parse(this.cryptoService.decrypt(account.credentialsEncrypted));
        if (creds.metaApiAccountId) {
          await this.mtAdapter.deprovision(creds.metaApiAccountId);
        }
      } catch (_) { /* non-fatal */ }
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

      const creds = JSON.parse(this.cryptoService.decrypt(account.credentialsEncrypted));

      let result: any;
      if (creds.metaApiAccountId) {
        result = await this.mtAdapter.testExisting(creds.metaApiAccountId);
      } else {
        const mt = account.brokerName === 'MT4' ? 'mt4' : 'mt5';
        result = await this.mtAdapter.connect(creds.login, creds.password, account.serverName ?? '', mt);
      }

      return { connected: result.connected, accountInfo: result };
    } catch (e) {
      return { connected: false, error: 'Connection failed' };
    }
  }

  async getAccountInfo(userId: string, accountId: string) {
    const test = await this.testConnection(userId, accountId);
    if (!test.connected) throw new BadRequestException('Cannot fetch account info; disconnected');
    return test.accountInfo;
  }
}
