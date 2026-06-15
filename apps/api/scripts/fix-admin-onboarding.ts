import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({
    where: { email: 'admin@profytron.com' },
    data: { onboardingCompleted: true, role: 'ADMIN' },
  });
  console.log('Updated', user.email, user.role, user.onboardingCompleted);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
