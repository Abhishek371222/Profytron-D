import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { RiskLevel, StrategyCategory } from '@prisma/client';

export class MarketplaceQueryDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  priceMin?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  priceMax?: number;

  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @IsOptional()
  @IsEnum(StrategyCategory)
  category?: StrategyCategory;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  verified?: boolean;

  @IsOptional()
  @IsString()
  assetClass?: string;

  @IsOptional()
  @IsString()
  timeframe?: string;

  @IsOptional()
  @IsString()
  sort?: 'trending' | 'top-rated' | 'newest' | 'price';

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => Number(value))
  limit: number = 12;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => Number(value))
  reviewsPage: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => Number(value))
  reviewsLimit: number = 10;
}

export class CreateMarketplaceListingDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  annualPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lifetimePrice?: number;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  trialDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxCopies?: number;
}

export class SubscribeStrategyDto {
  @IsString()
  planType: 'MONTHLY' | 'ANNUAL' | 'LIFETIME';

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  useTrial?: boolean;
}

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  reviewText: string;
}

export class ReplyReviewDto {
  @IsString()
  replyText: string;
}
