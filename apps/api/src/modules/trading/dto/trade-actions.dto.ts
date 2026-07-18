import {
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export type BulkCloseScope = 'ALL' | 'BUYS' | 'SELLS' | 'PROFITABLE' | 'LOSING';

export class CloseTradeDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  volume?: number;
}

export class ModifyTradeDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  stopLoss?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  takeProfit?: number;
}

export class BreakEvenDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  offsetPips?: number;
}

export class TrailingStopDto {
  @IsNumber()
  @IsPositive()
  distance!: number;
}

export class BulkCloseDto {
  @IsIn(['ALL', 'BUYS', 'SELLS', 'PROFITABLE', 'LOSING'])
  scope!: BulkCloseScope;
}

export class ManualOrderDto {
  @IsString()
  @MaxLength(20)
  symbol!: string;

  @IsIn(['BUY', 'SELL'])
  side!: 'BUY' | 'SELL';

  @IsNumber()
  @IsPositive()
  volume!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stopLoss?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  takeProfit?: number;
}
