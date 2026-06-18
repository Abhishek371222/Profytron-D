import { IsString, IsOptional, IsArray, IsNumber, IsEnum, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBuilderStrategyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class AddNodeDto {
  @IsString()
  nodeType: string;

  @IsOptional()
  config?: Record<string, any>;

  @IsString()
  label: string;

  @IsOptional()
  position?: { x: number; y: number };
}

export class UpdateNodeDto {
  @IsOptional()
  config?: Record<string, any>;

  @IsOptional()
  @IsString()
  label?: string;
}

export class AddEdgeDto {
  @IsString()
  fromNodeId: string;

  @IsString()
  toNodeId: string;
}

export class RunBuilderBacktestDto {
  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsOptional()
  @IsNumber()
  @Min(100)
  initialCapital?: number;
}

export class CodegenQueryDto {
  @IsOptional()
  @IsEnum(['pine', 'mql5'])
  format?: 'pine' | 'mql5';
}
