import { PrismaClient } from '@prisma/client';
import { PLATFORM_PLANS } from '../src/common/constants/pricing.constants';

const prisma = new PrismaClient();

async function main() {
  for (const plan of PLATFORM_PLANS) {
    if (plan.monthlyPrice < 0) continue;
    const row = await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      create: {
        name: plan.name,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice,
        features: [...plan.features],
        maxStrategies: plan.maxStrategies,
        maxCopyTrades: plan.maxCopyTrades,
        prioritySupport: plan.prioritySupport,
      },
      update: {
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice,
        features: [...plan.features],
        maxStrategies: plan.maxStrategies,
        maxCopyTrades: plan.maxCopyTrades,
        prioritySupport: plan.prioritySupport,
      },
    });
    console.log(`Synced ${row.name}: ₹${row.monthlyPrice}/mo, maxCopyTrades=${row.maxCopyTrades}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
