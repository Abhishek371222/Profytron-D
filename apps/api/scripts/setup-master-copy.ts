/**
 * Provision admin MT5 master account + marketplace copy strategy.
 * Usage: cd apps/api && npx ts-node -r tsconfig-paths/register scripts/setup-master-copy.ts
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AdminService } from '../src/modules/admin/admin.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const adminService = app.get(AdminService);
    const result = await adminService.provisionMasterCopyTrading();
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
