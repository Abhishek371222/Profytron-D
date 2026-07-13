import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class UpsertRiskPolicyDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDailyLossUsd?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxDailyLossPct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxDrawdownPct?: number;

  @IsOptional()
  @IsBoolean()
  autoStopAfterLoss?: boolean;

  @IsOptional()
  @IsBoolean()
  autoStopAfterWin?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyWinTargetUsd?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  riskPerTradePct?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  maxOpenTrades?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minWinRate?: number;
}
