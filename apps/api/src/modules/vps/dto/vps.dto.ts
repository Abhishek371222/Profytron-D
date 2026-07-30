import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateVpsDto {
  @IsString()
  @MaxLength(50)
  provider: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  cpuCores?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  memoryGb?: number;
}

export class CreateBotInstanceDto {
  @IsString()
  strategyId: string;

  @IsString()
  @MaxLength(100)
  name: string;
}
