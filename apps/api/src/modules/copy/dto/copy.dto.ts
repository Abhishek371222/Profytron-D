import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpsertMasterProfileDto {
  @IsString()
  @MaxLength(60)
  displayName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  strategyDescription?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export type SizingModeInput = 'FIXED' | 'MULTIPLIER' | 'EQUITY_RATIO';

export class SetSizingDto {
  @IsIn(['FIXED', 'MULTIPLIER', 'EQUITY_RATIO'])
  sizingMode!: SizingModeInput;

  /** Multiplier for MULTIPLIER / EQUITY_RATIO modes (clamped 0.01–5). */
  @IsOptional()
  @IsNumber()
  @IsPositive()
  multiplier?: number;

  /** Lot size for FIXED mode. */
  @IsOptional()
  @IsNumber()
  @IsPositive()
  fixedLot?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDrawdownPct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyLossLimitUsd?: number;
}
