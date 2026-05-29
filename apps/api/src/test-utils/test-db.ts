import { PrismaService } from '../prisma/prisma.service';

export async function resetTestDatabase(prisma: PrismaService) {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename != '_prisma_migrations'
  `;

  if (tables.length === 0) {
    return;
  }

  const quotedTableNames = tables
    .map(({ tablename }) => `"public"."${tablename.replace(/"/g, '""')}"`)
    .join(', ');

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${quotedTableNames} RESTART IDENTITY CASCADE;`,
  );
}
