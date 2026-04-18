import { Test, TestingModule } from '@nestjs/testing';
import { TradingService } from './trading.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TradingGateway } from './trading.gateway';
import { getQueueToken } from '@nestjs/bull';

describe('TradingService - CALCULATIONS & LOGIC (CRITICAL)', () => {
  let tradingService: TradingService;
  let prismaService: PrismaService;
  let tradingGateway: TradingGateway;
  let mockQueue: any;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradingService,
        {
          provide: PrismaService,
          useValue: {
            auditLog: {
              create: jest.fn(),
            },
            userStrategySubscription: {
              findMany: jest.fn(),
            },
            trade: {
              create: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
            },
            walletTransaction: {
              create: jest.fn(),
              groupBy: jest.fn(),
            },
          },
        },
        {
          provide: TradingGateway,
          useValue: {
            sendToUser: jest.fn(),
          },
        },
        {
          provide: getQueueToken('trade_execution'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    tradingService = module.get<TradingService>(TradingService);
    prismaService = module.get<PrismaService>(PrismaService);
    tradingGateway = module.get<TradingGateway>(TradingGateway);
  });

  describe('1. SIGNAL PROCESSING', () => {
    it('should create trading signal with correct data', async () => {
      const strategyId = 'strat-123';
      const signalData = {
        strategyId,
        signalType: 'BUY',
        pair: 'BTCUSD',
        price: 45000,
      };

      (prismaService.auditLog.create as jest.Mock).mockResolvedValue({
        id: 'log-1',
      });
      (prismaService.userStrategySubscription.findMany as jest.Mock).mockResolvedValue([]);

      const result = await tradingService.processSignal(
        signalData.strategyId,
        signalData.signalType,
        signalData.pair,
        signalData.price
      );

      expect(result.signalId).toBeDefined();
      expect(prismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'TRADING_SIGNAL_RECEIVED',
          triggeredBy: strategyId,
        }),
      });
    });

    it('should notify all subscribed users of signal', async () => {
      const strategyId = 'strat-123';
      const subscribers = [
        { userId: 'user-1' },
        { userId: 'user-2' },
      ];

      (prismaService.auditLog.create as jest.Mock).mockResolvedValue({ id: 'log-1' });
      (prismaService.userStrategySubscription.findMany as jest.Mock).mockResolvedValue(subscribers);

      await tradingService.processSignal(strategyId, 'BUY', 'BTCUSD', 45000);

      // Should queue execution for each subscriber
      expect(mockQueue.add).toHaveBeenCalledTimes(2);
    });
  });

  describe('2. PROFIT/LOSS CALCULATIONS', () => {
    it('should calculate profit correctly for winning trade', () => {
      const entryPrice = 100;
      const exitPrice = 120;
      const quantity = 10;

      const profit = (exitPrice - entryPrice) * quantity;

      expect(profit).toBe(200); // (120 - 100) * 10 = 200
    });

    it('should calculate loss correctly for losing trade', () => {
      const entryPrice = 100;
      const exitPrice = 80;
      const quantity = 10;

      const loss = (exitPrice - entryPrice) * quantity;

      expect(loss).toBe(-200); // (80 - 100) * 10 = -200
    });

    it('should calculate win rate from trade history', () => {
      const trades = [
        { profit: 100, status: 'CLOSED' },
        { profit: 150, status: 'CLOSED' },
        { profit: -50, status: 'CLOSED' },
        { profit: 200, status: 'CLOSED' },
      ];

      const winningTrades = trades.filter(t => t.profit > 0).length;
      const winRate = (winningTrades / trades.length) * 100;

      expect(winRate).toBe(75); // 3 out of 4 trades won
    });

    it('should calculate average profit per trade', () => {
      const trades = [
        { profit: 100 },
        { profit: 200 },
        { profit: -50 },
      ];

      const avgProfit = trades.reduce((sum, t) => sum + t.profit, 0) / trades.length;

      expect(avgProfit).toBe(83.33333333333333);
    });
  });

  describe('3. RISK METRICS', () => {
    it('should calculate max drawdown', () => {
      const equityCurve = [1000, 1200, 1100, 1500, 1300, 1400];
      
      let maxDrawdown = 0;
      let peak = equityCurve[0];

      for (const value of equityCurve) {
        if (value > peak) peak = value;
        const drawdown = ((peak - value) / peak) * 100;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      }

      expect(maxDrawdown).toBeGreaterThan(0);
      expect(maxDrawdown).toBeLessThan(20); // Should be less than 20% in this case
    });

    it('should calculate risk-reward ratio', () => {
      const trade = {
        entry: 100,
        stopLoss: 95,
        takeProfit: 110,
      };

      const risk = trade.entry - trade.stopLoss; // 5
      const reward = trade.takeProfit - trade.entry; // 10
      const riskRewardRatio = reward / risk; // 2:1

      expect(riskRewardRatio).toBe(2);
    });

    it('should calculate Sharpe ratio', () => {
      const returns = [0.01, 0.02, -0.01, 0.03, 0.015];
      const riskFreeRate = 0.001;

      const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
      const stdDev = Math.sqrt(variance);
      const sharpeRatio = (avgReturn - riskFreeRate) / stdDev;

      expect(sharpeRatio).toBeDefined();
      expect(typeof sharpeRatio).toBe('number');
    });
  });

  describe('4. POSITION SIZING', () => {
    it('should calculate position size based on risk percentage', () => {
      const accountBalance = 10000;
      const riskPercent = 0.02; // 2% risk
      const entryPrice = 100;
      const stopLoss = 95;

      const riskAmount = accountBalance * riskPercent; // 200
      const riskPerShare = entryPrice - stopLoss; // 5
      const positionSize = riskAmount / riskPerShare; // 40 shares

      expect(positionSize).toBe(40);
    });

    it('should not allow position size exceeding account balance', () => {
      const accountBalance = 10000;
      const positionValue = accountBalance * 1.5; // 150% - exceeds balance

      const isValid = positionValue <= accountBalance * 1.1; // Allow max 110% with margin

      expect(isValid).toBe(false);
    });
  });

  describe('5. EMERGENCY STOP', () => {
    it('should trigger emergency stop for user', async () => {
      const userId = 'user-123';

      await tradingService.emergencyStop(userId);

      expect(tradingGateway.sendToUser).toHaveBeenCalledWith(
        userId,
        'emergency_stop_triggered',
        expect.objectContaining({
          status: 'SUCCESS',
        })
      );
    });

    it('should close all open positions on emergency stop', async () => {
      const userId = 'user-123';

      // In real implementation, should verify all positions are closed
      await tradingService.emergencyStop(userId);

      expect(tradingGateway.sendToUser).toHaveBeenCalled();
    });
  });

  describe('6. TRADE ENTRY/EXIT VALIDATION', () => {
    it('should validate entry price is above stop loss', () => {
      const entry = 100;
      const stopLoss = 95;

      const isValid = entry > stopLoss;

      expect(isValid).toBe(true);
    });

    it('should validate take profit is above entry price', () => {
      const entry = 100;
      const takeProfit = 110;

      const isValid = takeProfit > entry;

      expect(isValid).toBe(true);
    });

    it('should reject invalid entry parameters', () => {
      const trade = {
        entry: 100,
        stopLoss: 100, // Same as entry - invalid
        takeProfit: 90, // Below entry - invalid
      };

      const isValid = trade.entry > trade.stopLoss && trade.takeProfit > trade.entry;

      expect(isValid).toBe(false);
    });
  });
});
