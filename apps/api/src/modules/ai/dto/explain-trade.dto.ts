import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Validated body for POST /ai/explain. Previously this endpoint accepted an
 * untyped `any`, so arbitrary/oversized payloads flowed straight into the AI
 * prompt and the external AI call.
 */
export class ExplainTradeDto {
  @IsString()
  @MaxLength(50)
  asset: string;

  @IsString()
  @MaxLength(20)
  type: string;

  @IsOptional()
  @IsNumber()
  entry?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;

  @IsOptional()
  @IsNumber()
  stopLoss?: number;

  @IsOptional()
  @IsNumber()
  takeProfit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;

  @IsOptional()
  @IsNumber()
  profit?: number;
}
