import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const VPS_PRICING: Record<string, Record<string, number>> = {
  DIGITALOCEAN: { '2cpu-4gb': 20, '4cpu-8gb': 40, '8cpu-16gb': 80 },
  AWS: { '2cpu-4gb': 25, '4cpu-8gb': 50, '8cpu-16gb': 100 },
  LINODE: { '2cpu-4gb': 18, '4cpu-8gb': 36, '8cpu-16gb': 72 },
  VULTR: { '2cpu-4gb': 20, '4cpu-8gb': 40, '8cpu-16gb': 80 },
};

@Injectable()
export class VpsService {
  private readonly logger = new Logger(VpsService.name);

  constructor(private prisma: PrismaService) {}

  private getPricing(provider: string, cpuCores: number, memoryGb: number): number {
    const providerKey = provider.toUpperCase();
    const sizeKey = `${cpuCores}cpu-${memoryGb}gb`;
    return VPS_PRICING[providerKey]?.[sizeKey] ?? 20;
  }

  async createVpsAccount(userId: string, provider: string, config: any) {
    const cpuCores = config.cpuCores || 2;
    const memoryGb = config.memoryGb || 4;
    const monthlyPrice = this.getPricing(provider, cpuCores, memoryGb);
    const instanceRef = `profytron-${userId.slice(0, 8)}-${Date.now()}`;

    this.logger.log(`Provisioning VPS on ${provider} for user ${userId} [${cpuCores}CPU/${memoryGb}GB @ $${monthlyPrice}/mo]`);

    const account = await this.prisma.vpsAccount.create({
      data: {
        userId,
        provider: provider as any,
        instanceId: instanceRef,
        hostname: `${instanceRef}.vps.profytron.com`,
        status: 'STOPPED',
        cpuCores,
        memoryGb,
        monthlyPrice,
      },
    });

    return account;
  }

  async getVpsAccounts(userId: string) {
    return this.prisma.vpsAccount.findMany({
      where: { userId },
      include: {
        botInstances: {
          select: { id: true, name: true, status: true, startedAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async startVps(vpsId: string, userId: string) {
    const vps = await this.prisma.vpsAccount.findUnique({ where: { id: vpsId } });
    if (!vps) throw new NotFoundException('VPS instance not found');
    if (vps.userId !== userId) throw new ForbiddenException('Access denied');

    this.logger.log(`Starting VPS ${vpsId} for user ${userId}`);
    return this.prisma.vpsAccount.update({
      where: { id: vpsId },
      data: { status: 'RUNNING' },
    });
  }

  async stopVps(vpsId: string, userId: string) {
    const vps = await this.prisma.vpsAccount.findUnique({ where: { id: vpsId } });
    if (!vps) throw new NotFoundException('VPS instance not found');
    if (vps.userId !== userId) throw new ForbiddenException('Access denied');

    this.logger.log(`Stopping VPS ${vpsId} for user ${userId}`);

    // Stop all running bots on this VPS before stopping VPS
    await this.prisma.botInstance.updateMany({
      where: { vpsId, status: 'RUNNING' },
      data: { status: 'STOPPED', stoppedAt: new Date() },
    });

    return this.prisma.vpsAccount.update({
      where: { id: vpsId },
      data: { status: 'STOPPED' },
    });
  }

  async createBotInstance(vpsId: string, strategyId: string, name: string) {
    const vps = await this.prisma.vpsAccount.findUnique({ where: { id: vpsId } });
    if (!vps) throw new NotFoundException('VPS instance not found');

    this.logger.log(`Creating bot instance "${name}" on VPS ${vpsId}`);

    return this.prisma.botInstance.create({
      data: { vpsId, strategyId, name, status: 'STOPPED' },
    });
  }

  async startBot(botId: string) {
    const bot = await this.prisma.botInstance.findUnique({ where: { id: botId } });
    if (!bot) throw new NotFoundException('Bot instance not found');

    const vps = await this.prisma.vpsAccount.findUnique({ where: { id: bot.vpsId } });
    if (!vps || vps.status !== 'RUNNING') {
      throw new ForbiddenException('VPS must be running before starting a bot');
    }

    this.logger.log(`Starting bot ${botId}`);
    return this.prisma.botInstance.update({
      where: { id: botId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
        processPid: Math.floor(Math.random() * 900000) + 100000,
      },
    });
  }

  async stopBot(botId: string) {
    const bot = await this.prisma.botInstance.findUnique({ where: { id: botId } });
    if (!bot) throw new NotFoundException('Bot instance not found');

    this.logger.log(`Stopping bot ${botId}`);
    return this.prisma.botInstance.update({
      where: { id: botId },
      data: { status: 'STOPPED', stoppedAt: new Date() },
    });
  }

  async getBotInstances(vpsId: string) {
    return this.prisma.botInstance.findMany({
      where: { vpsId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteVps(vpsId: string, userId: string) {
    const vps = await this.prisma.vpsAccount.findUnique({ where: { id: vpsId } });
    if (!vps) throw new NotFoundException('VPS instance not found');
    if (vps.userId !== userId) throw new ForbiddenException('Access denied');
    if (vps.status === 'RUNNING') {
      throw new ForbiddenException('Stop the VPS before deleting it');
    }

    await this.prisma.botInstance.deleteMany({ where: { vpsId } });
    return this.prisma.vpsAccount.delete({ where: { id: vpsId } });
  }
}
