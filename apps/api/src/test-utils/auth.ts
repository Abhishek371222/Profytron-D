import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export async function seedVerifiedUser(
  prisma: PrismaService,
  overrides?: Partial<{
    email: string;
    password: string;
    fullName: string;
    role: 'USER' | 'CREATOR' | 'ADMIN';
  }>,
) {
  const email = overrides?.email ?? `user-${Date.now()}@test.local`;
  const password = overrides?.password ?? 'ValidPass123!';
  const fullName = overrides?.fullName ?? 'Test User';
  const role = overrides?.role ?? 'USER';

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 12),
      fullName,
      emailVerified: true,
      role,
    },
  });

  return { user, password };
}

export async function loginAs(
  app: INestApplication,
  email: string,
  password: string,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/v1/auth/login')
    .send({ email, password })
    .expect(200);

  return response.body.data.accessToken as string;
}
