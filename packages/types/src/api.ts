export enum MarketRegime {
  TRENDING = 'TRENDING',
  RANGING = 'RANGING',
  VOLATILE = 'VOLATILE',
  UNKNOWN = 'UNKNOWN',
}

export enum UserRole {
  USER = 'USER',
  CREATOR = 'CREATOR',
  ADMIN = 'ADMIN',
}

export enum KycStatus {
  NOT_STARTED = 'NOT_STARTED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum SubscriptionTier {
  FREE = 'FREE',
  PRO = 'PRO',
  ELITE = 'ELITE',
  INSTITUTIONAL = 'INSTITUTIONAL',
}

export enum BrokerName {
  PAPER = 'PAPER',
  BINANCE = 'BINANCE',
  BYBIT = 'BYBIT',
  KUCOIN = 'KUCOIN',
  INTERACTIVE_BROKERS = 'INTERACTIVE_BROKERS',
}

export enum StrategyCategory {
  TREND = 'TREND',
  SCALPING = 'SCALPING',
  RANGE = 'RANGE',
  VOLATILITY = 'VOLATILITY',
  ARBITRAGE = 'ARBITRAGE',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  EXPERT = 'EXPERT',
}

export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum TradeDirection {
  LONG = 'LONG',
  SHORT = 'SHORT',
}

export enum TradeStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  SUBSCRIPTION_PAYMENT = 'SUBSCRIPTION_PAYMENT',
  TRADING_PNL = 'TRADING_PNL',
  COMMISSION = 'COMMISSION',
  MARKETPLACE_SALE = 'MARKETPLACE_SALE',
}

export enum TransactionDirection {
  IN = 'IN',
  OUT = 'OUT',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
}

export enum AffiliateTier {
  STARTER = 'STARTER',
  PRO = 'PRO',
  ELITE = 'ELITE',
}

export enum AchievementTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
}

export enum NotificationType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  country: string;
  timezone: string;
  role: UserRole;
  kycStatus: KycStatus;
  subscriptionTier: SubscriptionTier;
  riskDnaScore?: number;
  referralCode: string;
  isSuspended: boolean;
  createdAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Strategy {
  id: string;
  creatorId: string;
  name: string;
  description: string;
  category: StrategyCategory;
  riskLevel: RiskLevel;
  isPublished: boolean;
  verificationStatus: VerificationStatus;
  isVerified: boolean;
  monthlyPrice?: number;
  annualPrice?: number;
  lifetimePrice?: number;
  maxCopies: number;
  copiesCount: number;
  totalRevenue: number;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StrategyPerformance {
  id: string;
  strategyId: string;
  date: Date;
  winRate: number;
  drawdown: number;
  maxDrawdown: number;
  sharpeRatio: number;
  sortinoRatio?: number;
  totalTrades: number;
  winningTrades: number;
  netPnl: number;
  equityCurve: any;
  createdAt: Date;
}

export interface Trade {
  id: string;
  userId: string;
  strategyId?: string;
  brokerAccountId?: string;
  brokerTicket?: string;
  symbol: string;
  direction: TradeDirection;
  volume: number;
  openPrice: number;
  closePrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  profit?: number;
  commission: number;
  swap: number;
  isPaper: boolean;
  status: TradeStatus;
  openedAt: Date;
  closedAt?: Date;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  direction: TransactionDirection;
  amount: number;
  balanceAfter: number;
  status: TransactionStatus;
  reference?: string;
  idempotencyKey: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
