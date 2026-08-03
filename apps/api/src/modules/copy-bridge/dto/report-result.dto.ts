import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ReportBridgeResultDto {
  @IsIn(['FILLED', 'FAILED'])
  status: 'FILLED' | 'FAILED';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  brokerTicket?: string;

  @IsOptional()
  @IsNumber()
  fillPrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  errorReason?: string;
}
