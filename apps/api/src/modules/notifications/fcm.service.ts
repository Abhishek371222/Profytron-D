import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private initialized = false;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      }
      this.initialized = true;
      this.logger.log(
        'Firebase Admin initialized — FCM push notifications active',
      );
    } else {
      this.logger.warn(
        'FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY not set — FCM disabled',
      );
    }
  }

  async registerToken(userId: string, token: string, platform: string) {
    await this.prisma.userFcmToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform },
    });
    return { success: true };
  }

  async removeToken(token: string) {
    await this.prisma.userFcmToken.deleteMany({ where: { token } });
  }

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    if (!this.initialized) return;

    const tokens = await this.prisma.userFcmToken.findMany({
      where: { userId },
      select: { token: true },
    });
    if (!tokens.length) return;

    const tokenList = tokens.map((t) => t.token);
    const message: admin.messaging.MulticastMessage = {
      tokens: tokenList,
      notification: { title, body },
      data,
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    };

    try {
      const result = await admin.messaging().sendEachForMulticast(message);
      // Clean up invalid tokens
      const invalidTokens: string[] = [];
      result.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const code = resp.error?.code;
          if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token'
          ) {
            invalidTokens.push(tokenList[idx]);
          }
        }
      });
      if (invalidTokens.length) {
        await this.prisma.userFcmToken.deleteMany({
          where: { token: { in: invalidTokens } },
        });
      }
    } catch (err) {
      this.logger.error(
        `FCM send failed for user ${userId}: ${(err as Error).message}`,
      );
    }
  }
}
