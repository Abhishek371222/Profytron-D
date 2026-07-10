import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './modules/auth/redis.service';
import { TradingGateway } from './modules/trading/trading.gateway';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            ping: jest.fn(),
          },
        },
        {
          provide: TradingGateway,
          useValue: {
            server: null,
            sendToUser: jest.fn(),
          },
        },
        {
          provide: getQueueToken('trade_execution'),
          useValue: {
            client: { ping: jest.fn() },
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return service status', () => {
      expect(appController.getStatus()).toMatchObject({
        status: 'ok',
        version: '1.0.4',
        prefix: 'v1',
      });
    });
  });
});
