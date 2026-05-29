import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsBoolean,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  StrategyCategory,
  RiskLevel,
  VerificationStatus,
} from '@prisma/client';
import { Transform } from 'class-transformer';

export class StrategiesQueryDto {
  @IsOptional()
  @IsEnum(StrategyCategory)
  category?: StrategyCategory;

  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  isVerified?: boolean;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  priceMin?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  priceMax?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: 'winRate' | 'sharpeRatio' | 'copiesCount' | 'createdAt';

  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;
}

export class CreateStrategyDto {
  @ApiProperty({ example: 'Neural Nexus Alpha' })
  @IsString()
  name: string;

  @ApiProperty({ enum: StrategyCategory })
  @IsEnum(StrategyCategory)
  category: StrategyCategory;

  @ApiProperty({ enum: RiskLevel })
  @IsEnum(RiskLevel)
  riskLevel: RiskLevel;

  @ApiProperty({ example: 'AI scalping strategy...' })
  @IsString()
  description: string;

  @ApiProperty({ example: {} })
  @IsOptional()
  configJson?: any;
}

export class UpdateStrategyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  configJson?: any;

  @IsOptional()
  @IsNumber()
  monthlyPrice?: number;

  @IsOptional()
  @IsNumber()
  annualPrice?: number;
}

export class ActivateStrategyDto {
  @IsOptional()
  @IsString()
  brokerAccountId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(10)
  riskMultiplier?: number = 1;

  @IsOptional()
  @IsBoolean()
  isPaperTrading?: boolean = true;
}

export class RunBacktestDto {
  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsOptional()
  @IsNumber()
  initialCapital?: number = 10000;

  @IsOptional()
  configOverride?: any;
}

export class WalkForwardValidationDto extends RunBacktestDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  trainingWindowDays?: number = 90;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  testWindowDays?: number = 30;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  stepDays?: number = 30;

  @IsOptional()
  @IsString()
  parameterPath?: string = 'riskMultiplier';

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  perturbationPct?: number = 10;
}

export class SensitivityAnalysisDto extends RunBacktestDto {
  @IsOptional()
  @IsString()
  parameterPath?: string = 'riskMultiplier';

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  perturbationPct?: number = 10;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  sampleSize?: number = 5;
}
