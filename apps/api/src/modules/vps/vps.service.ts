import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InstancesClient, ZoneOperationsClient } from '@google-cloud/compute';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { buildWalletPaymentFields } from '../wallet/wallet-payment.util';

const VPS_PRICING: Record<string, number> = {
  '2cpu-4gb': 27,
  '4cpu-8gb': 54,
  '8cpu-16gb': 108,
};

const GCP_ZONE = process.env.GCP_VPS_ZONE || 'asia-south1-a';
const BOOT_DISK_GB = 10;
const BOOT_IMAGE = 'projects/debian-cloud/global/images/family/debian-12';

@Injectable()
export class VpsService {
  private readonly logger = new Logger(VpsService.name);
  private readonly instances: InstancesClient | null;
  private readonly zoneOps: ZoneOperationsClient | null;
  private readonly projectId: string | null;

  constructor(private prisma: PrismaService) {
    this.projectId = process.env.GCP_PROJECT_ID || null;
    this.instances = this.projectId ? new InstancesClient() : null;
    this.zoneOps = this.projectId ? new ZoneOperationsClient() : null;
    if (!this.projectId) {
      this.logger.warn(
        'GCP_PROJECT_ID is not set — VPS provisioning cannot create real instances.',
      );
    }
  }

  private requireCompute(): {
    instances: InstancesClient;
    zoneOps: ZoneOperationsClient;
    projectId: string;
  } {
    if (!this.instances || !this.zoneOps || !this.projectId) {
      throw new BadRequestException(
        'VPS provisioning is not configured (missing GCP_PROJECT_ID).',
      );
    }
    return {
      instances: this.instances,
      zoneOps: this.zoneOps,
      projectId: this.projectId,
    };
  }

  private machineType(cpuCores: number, memoryGb: number): string {
    return `e2-custom-${cpuCores}-${memoryGb * 1024}`;
  }

  private sizeKey(cpuCores: number, memoryGb: number): string {
    return `${cpuCores}cpu-${memoryGb}gb`;
  }

  private getPricing(cpuCores: number, memoryGb: number): number {
    return VPS_PRICING[this.sizeKey(cpuCores, memoryGb)] ?? 27;
  }

  private async waitForOperation(operationName: string, zone: string) {
    const { zoneOps, projectId } = this.requireCompute();
    const [operation] = await zoneOps.wait({
      operation: operationName,
      project: projectId,
      zone,
    });
    if (operation.error?.errors?.length) {
      const message = operation.error.errors.map((e) => e.message).join('; ');
      throw new BadRequestException(`GCE operation failed: ${message}`);
    }
    return operation;
  }

  private async chargeWalletForVps(
    userId: string,
    amount: number,
    reference: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`wallet:${userId}`}))`;

      const grouped = await tx.walletTransaction.groupBy({
        by: ['direction'],
        where: { userId, status: 'CONFIRMED' },
        _sum: { amount: true },
      });
      const confirmedIn =
        grouped.find((g) => g.direction === 'IN')?._sum.amount ?? 0;
      const confirmedOut =
        grouped.find((g) => g.direction === 'OUT')?._sum.amount ?? 0;
      const available = confirmedIn - confirmedOut;

      if (amount > available) {
        throw new BadRequestException(
          `Insufficient wallet balance for VPS rental. Available: ₹${available.toFixed(2)}, required: ₹${amount.toFixed(2)}`,
        );
      }

      const idempotencyKey = `vps_charge_${reference}`;
      const paymentFields = buildWalletPaymentFields({
        type: 'SUBSCRIPTION_PAYMENT',
        direction: 'OUT',
        userId,
        externalTxnId: reference,
        metadata: { purpose: 'vps_rental', reference },
      });

      return tx.walletTransaction.create({
        data: {
          userId,
          type: 'SUBSCRIPTION_PAYMENT',
          direction: 'OUT',
          amount,
          balanceAfter: available - amount,
          status: 'CONFIRMED',
          idempotencyKey,
          ...paymentFields,
        },
      });
    });
  }

  /** Refund a VPS charge if provisioning fails after the wallet was already debited. */
  private async refundVpsCharge(
    userId: string,
    amount: number,
    reference: string,
  ) {

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`wallet:${userId}`}))`;
        const grouped = await tx.walletTransaction.groupBy({
          by: ['direction'],
          where: { userId, status: 'CONFIRMED' },
          _sum: { amount: true },
        });
        const confirmedIn =
          grouped.find((g) => g.direction === 'IN')?._sum.amount ?? 0;
        const confirmedOut =
          grouped.find((g) => g.direction === 'OUT')?._sum.amount ?? 0;
        const available = confirmedIn - confirmedOut;
        const idempotencyKey = `vps_refund_${reference}`;
        const paymentFields = buildWalletPaymentFields({
          type: 'SUBSCRIPTION_PAYMENT',
          direction: 'IN',
          userId,
          externalTxnId: reference,
          metadata: { purpose: 'vps_provisioning_failed_refund', reference },
        });
        await tx.walletTransaction.create({
          data: {
            userId,
            type: 'SUBSCRIPTION_PAYMENT',
            direction: 'IN',
            amount,
            balanceAfter: available + amount,
            status: 'CONFIRMED',
            idempotencyKey,
            ...paymentFields,
          },
        });
      });
    } catch (err) {
      this.logger.error(
        `Failed to refund VPS charge for user ${userId} (ref ${reference}): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async createVpsAccount(userId: string, _provider: string, config: any) {
    const { instances, projectId } = this.requireCompute();
    const cpuCores = config.cpuCores || 2;
    const memoryGb = config.memoryGb || 4;
    const monthlyPrice = this.getPricing(cpuCores, memoryGb);
    const instanceName =
      `profytron-${userId.slice(0, 8)}-${Date.now()}`.toLowerCase();
    const machineType = this.machineType(cpuCores, memoryGb);
    const chargeReference = randomUUID();

    this.logger.log(
      `Provisioning real GCE instance ${instanceName} for user ${userId} [${machineType} @ ₹${monthlyPrice}/mo]`,
    );

    await this.chargeWalletForVps(userId, monthlyPrice, chargeReference);

    try {
      const [insertOp] = await instances.insert({
        project: projectId,
        zone: GCP_ZONE,
        instanceResource: {
          name: instanceName,
          machineType: `zones/${GCP_ZONE}/machineTypes/${machineType}`,
          disks: [
            {
              boot: true,
              autoDelete: true,
              initializeParams: {
                sourceImage: BOOT_IMAGE,
                diskSizeGb: String(BOOT_DISK_GB),
                diskType: `zones/${GCP_ZONE}/diskTypes/pd-standard`,
              },
            },
          ],
          networkInterfaces: [
            {
              network: 'global/networks/default',
              accessConfigs: [{ name: 'External NAT', type: 'ONE_TO_ONE_NAT' }],
            },
          ],
          labels: {
            profytron_user: userId.slice(0, 8),
            profytron_managed: 'true',
          },
        },
      });
      await this.waitForOperation(insertOp.name!, GCP_ZONE);

      const [stopOp] = await instances.stop({
        project: projectId,
        zone: GCP_ZONE,
        instance: instanceName,
      });
      await this.waitForOperation(stopOp.name!, GCP_ZONE);

      const [instance] = await instances.get({
        project: projectId,
        zone: GCP_ZONE,
        instance: instanceName,
      });
      const externalIp =
        instance.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP ?? null;

      return await this.prisma.vpsAccount.create({
        data: {
          userId,
          provider: 'GCP',
          instanceId: instanceName,
          hostname: `${instanceName}.${GCP_ZONE}.c.${projectId}.internal`,
          status: 'STOPPED',
          cpuCores,
          memoryGb,
          monthlyPrice,
          ipAddress: externalIp,
          metadataJson: { zone: GCP_ZONE, machineType, chargeReference },
        },
      });
    } catch (err) {
      this.logger.error(
        `GCE provisioning failed for user ${userId}, refunding ₹${monthlyPrice}: ${err instanceof Error ? err.message : String(err)}`,
      );
      await this.refundVpsCharge(userId, monthlyPrice, chargeReference);
      throw err;
    }
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
    const vps = await this.prisma.vpsAccount.findUnique({
      where: { id: vpsId },
    });
    if (!vps) throw new NotFoundException('VPS instance not found');
    if (vps.userId !== userId) throw new ForbiddenException('Access denied');

    const { instances, projectId } = this.requireCompute();
    const zone = (vps.metadataJson as any)?.zone || GCP_ZONE;

    this.logger.log(
      `Starting GCE instance ${vps.instanceId} for user ${userId}`,
    );

    try {
      const [op] = await instances.start({
        project: projectId,
        zone,
        instance: vps.instanceId,
      });
      await this.waitForOperation(op.name!, zone);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes('fingerprint') && !message.includes('not ready')) {
        throw err;
      }
      this.logger.warn(
        `Transient GCE start error for ${vps.instanceId}, retrying once: ${message}`,
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const [retryOp] = await instances.start({
        project: projectId,
        zone,
        instance: vps.instanceId,
      });
      await this.waitForOperation(retryOp.name!, zone);
    }

    const [instance] = await instances.get({
      project: projectId,
      zone,
      instance: vps.instanceId,
    });
    const externalIp =
      instance.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP ??
      vps.ipAddress;

    return this.prisma.vpsAccount.update({
      where: { id: vpsId },
      data: { status: 'RUNNING', ipAddress: externalIp },
    });
  }

  async stopVps(vpsId: string, userId: string) {
    const vps = await this.prisma.vpsAccount.findUnique({
      where: { id: vpsId },
    });
    if (!vps) throw new NotFoundException('VPS instance not found');
    if (vps.userId !== userId) throw new ForbiddenException('Access denied');

    const { instances, projectId } = this.requireCompute();
    const zone = (vps.metadataJson as any)?.zone || GCP_ZONE;

    this.logger.log(
      `Stopping GCE instance ${vps.instanceId} for user ${userId}`,
    );
    const [op] = await instances.stop({
      project: projectId,
      zone,
      instance: vps.instanceId,
    });
    await this.waitForOperation(op.name!, zone);

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
    const vps = await this.prisma.vpsAccount.findUnique({
      where: { id: vpsId },
    });
    if (!vps) throw new NotFoundException('VPS instance not found');

    this.logger.log(`Creating bot instance "${name}" on VPS ${vpsId}`);

    return this.prisma.botInstance.create({
      data: { vpsId, strategyId, name, status: 'STOPPED' },
    });
  }

  async startBot(botId: string) {
    const bot = await this.prisma.botInstance.findUnique({
      where: { id: botId },
    });
    if (!bot) throw new NotFoundException('Bot instance not found');

    const vps = await this.prisma.vpsAccount.findUnique({
      where: { id: bot.vpsId },
    });
    if (!vps || vps.status !== 'RUNNING') {
      throw new ForbiddenException('VPS must be running before starting a bot');
    }

    this.logger.log(`Starting bot ${botId}`);
    return this.prisma.botInstance.update({
      where: { id: botId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
        processPid: null,
      },
    });
  }

  async stopBot(botId: string) {
    const bot = await this.prisma.botInstance.findUnique({
      where: { id: botId },
    });
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
    const vps = await this.prisma.vpsAccount.findUnique({
      where: { id: vpsId },
    });
    if (!vps) throw new NotFoundException('VPS instance not found');
    if (vps.userId !== userId) throw new ForbiddenException('Access denied');
    if (vps.status === 'RUNNING') {
      throw new ForbiddenException('Stop the VPS before deleting it');
    }

    const { instances, projectId } = this.requireCompute();
    const zone = (vps.metadataJson as any)?.zone || GCP_ZONE;

    try {
      const [op] = await instances.delete({
        project: projectId,
        zone,
        instance: vps.instanceId,
      });
      await this.waitForOperation(op.name!, zone);
    } catch (err: any) {
      if (err?.code !== 5  ) throw err;
    }

    await this.prisma.botInstance.deleteMany({ where: { vpsId } });
    return this.prisma.vpsAccount.delete({ where: { id: vpsId } });
  }
}
