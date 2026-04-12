import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../common/crypto.service';
import { MT5Adapter } from './adapters/mt5.adapter';
import { PaperBrokerAdapter } from './adapters/paper.adapter';

@Injectable()
export class BrokerService {
  private readonly logger = new Logger(BrokerService.name);

  constructor(
    private prisma: PrismaService,
    private cryptoService: CryptoService,
    private mt5Adapter: MT5Adapter,
    private paperAdapter: PaperBrokerAdapter,
  ) {}

  async connectBroker(userId: string, dto: any) {
    try {
      // 2. Test connection BEFORE saving
      let connectionTest;
      if (dto.brokerName === 'PAPER') {
        connectionTest = await this.paperAdapter.connect(dto.accountNumber);
      } else {
        // MT5 fallback for BINANCE/BYBIT testing mock during dev
        connectionTest = await this.mt5Adapter.connect(
          dto.accountNumber,
          dto.password,
          dto.serverName,
        );
      }

      if (!connectionTest.connected) {
        throw new BadRequestException(
          'Connection failed. Check your credentials.',
        );
      }

      // 1. Encrypt credentials
      const encrypted = this.cryptoService.encrypt(
        JSON.stringify({ password: dto.password }),
      );

      const last4 = dto.accountNumber
        ? dto.accountNumber.slice(-4).padStart(4, '0')
        : '0000';

      const existingAccounts = await this.prisma.brokerAccount.count({
        where: { userId },
      });
      const isDefault = existingAccounts === 0;

      // 3. Save BrokerAccount to DB
      const account = await this.prisma.brokerAccount.create({
        data: {
          userId,
          brokerName: dto.brokerName,
          accountNumberLast4: last4,
          credentialsEncrypted: encrypted,
          serverName: dto.serverName,
          isPaperTrading: dto.brokerName === 'PAPER',
          isDefault,
        },
      });

      // 5. Log event
      await this.prisma.auditLog.create({
        data: {
          eventType: 'BROKER_CONNECTED',
          userId,
          detailsJson: {
            brokerName: account.brokerName,
            accountId: account.id,
          },
          triggeredBy: 'USER',
        },
      });

      // 6. Return without credentials
      delete (account as any).credentialsEncrypted;
      return account;
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
    return accounts.map((acc) => {
      delete (acc as any).credentialsEncrypted;
      return acc;
    });
  }

  async disconnectBroker(userId: string, accountId: string) {
    const account = await this.prisma.brokerAccount.findFirst({
      where: { id: accountId, userId, isActive: true },
    });

    if (!account) throw new BadRequestException('Account not found');

    await this.prisma.brokerAccount.update({
      where: { id: accountId },
      data: { isActive: false },
    });

    // We should ideally deactivate active strategies using this account here
    return { success: true };
  }

  async testConnection(userId: string, accountId: string) {
    const account = await this.prisma.brokerAccount.findFirst({
      where: { id: accountId, userId, isActive: true },
    });

    if (!account) throw new BadRequestException('Account not found');

    try {
      const plaintext = this.cryptoService.decrypt(
        account.credentialsEncrypted,
      );
      const credentials = JSON.parse(plaintext);

      let connectionTest;
      if (account.isPaperTrading) {
        connectionTest = await this.paperAdapter.connect(
          account.accountNumberLast4,
        ); // Paper mock uses any acc num
      } else {
        connectionTest = await this.mt5Adapter.connect(
          account.accountNumberLast4,
          credentials.password,
          account.serverName || '',
        );
      }

      return {
        connected: connectionTest.connected,
        accountInfo: connectionTest,
      };
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
