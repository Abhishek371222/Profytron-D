import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StrategyBuilderService {
  private readonly logger = new Logger(StrategyBuilderService.name);

  constructor(private prisma: PrismaService) {}

  async createStrategy(userId: string, name: string, description: string, category: string) {
    return this.prisma.strategyBuilder.create({
      data: {
        userId,
        name,
        description,
        category: category as any,
      },
    });
  }

  async getStrategies(userId: string) {
    return this.prisma.strategyBuilder.findMany({
      where: { userId },
      include: { nodes: true, edges: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStrategy(strategyId: string) {
    return this.prisma.strategyBuilder.findUnique({
      where: { id: strategyId },
      include: { nodes: true, edges: true },
    });
  }

  async addNode(builderId: string, nodeType: string, config: any, label: string, position: any) {
    return this.prisma.strategyNode.create({
      data: {
        builderId,
        nodeType: nodeType as any,
        config,
        label,
        position,
      },
    });
  }

  async addEdge(builderId: string, fromNodeId: string, toNodeId: string) {
    return this.prisma.strategyEdge.create({
      data: { builderId, fromNodeId, toNodeId },
    });
  }

  async removeNode(nodeId: string) {
    return this.prisma.strategyNode.delete({ where: { id: nodeId } });
  }

  async removeEdge(edgeId: string) {
    return this.prisma.strategyEdge.delete({ where: { id: edgeId } });
  }

  async updateNode(nodeId: string, config: any, label?: string) {
    return this.prisma.strategyNode.update({
      where: { id: nodeId },
      data: { config, label },
    });
  }

  async deleteStrategy(strategyId: string) {
    return this.prisma.strategyBuilder.delete({ where: { id: strategyId } });
  }
}
