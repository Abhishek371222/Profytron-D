import {
  TransactionStatus,
  TransactionType,
  TransactionDirection,
} from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InitiateDepositDto {
  @IsNumber()
  @IsPositive()
  amount: number;
}

export class InitiateWithdrawalDto {
  @IsNumber()
  @Min(500)
  amount: number;

  @IsOptional()
  @IsString()
  @MinLength(6)
  bankAccount?: string;

  @IsOptional()
  @IsString()
  otp?: string;
}

export class PreviewWithdrawalDto {
  @IsNumber()
  @IsPositive()
  amount: number;
}

export class WalletTransactionsQueryDto {
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsDateString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}

export class CreateWalletTransactionDto {
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsEnum(TransactionDirection)
  direction: TransactionDirection;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsString()
  idempotencyKey: string;

  @IsOptional()
  metadataJson?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  reference?: string;
}
