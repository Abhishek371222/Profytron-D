import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

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
