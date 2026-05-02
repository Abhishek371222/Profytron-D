import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VpsService {
  private readonly logger = new Logger(VpsService.name);

  constructor(private prisma: PrismaService) {}

  async createVpsAccount(userId: string, provider: string, config: any) {
    this.logger.log(
      `[DEMO] Creating VPS account on ${provider} for user ${userId}`,
    );

    return this.prisma.vpsAccount.create({
      data: {
        userId,
        provider: provider as any,
        instanceId: `DEMO-${Date.now()}`,
        hostname: `bot-${userId.slice(0, 8)}.profytron.local`,
        status: 'STOPPED',
        cpuCores: config.cpuCores || 2,
        memoryGb: config.memoryGb || 4,
        monthlyPrice: 20,
      },
    });
  }

  async getVpsAccounts(userId: string) {
    return this.prisma.vpsAccount.findMany({
      where: { userId },
    });
  }

  async startVps(vpsId: string) {
    this.logger.log(`[DEMO] Starting VPS instance: ${vpsId}`);
    return this.prisma.vpsAccount.update({
      where: { id: vpsId },
      data: { status: 'RUNNING' },
    });
  }

  async stopVps(vpsId: string) {
    this.logger.log(`[DEMO] Stopping VPS instance: ${vpsId}`);
    return this.prisma.vpsAccount.update({
      where: { id: vpsId },
      data: { status: 'STOPPED' },
    });
  }

  async createBotInstance(vpsId: string, strategyId: string, name: string) {
    this.logger.log(`[DEMO] Creating bot instance on VPS ${vpsId}`);

    return this.prisma.botInstance.create({
      data: {
        vpsId,
        strategyId,
        name,
        status: 'STOPPED',
      },
    });
  }

  async startBot(botId: string) {
    this.logger.log(`[DEMO] Starting bot instance: ${botId}`);
    return this.prisma.botInstance.update({
      where: { id: botId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
        processPid: Math.floor(Math.random() * 100000),
      },
    });
  }

  async stopBot(botId: string) {
    this.logger.log(`[DEMO] Stopping bot instance: ${botId}`);
    return this.prisma.botInstance.update({
      where: { id: botId },
      data: { status: 'STOPPED', stoppedAt: new Date() },
    });
  }

  async getBotInstances(vpsId: string) {
    return this.prisma.botInstance.findMany({
      where: { vpsId },
    });
  }

  async deleteVps(vpsId: string) {
    return this.prisma.vpsAccount.delete({ where: { id: vpsId } });
  }
}
