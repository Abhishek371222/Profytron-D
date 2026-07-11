import {
  IsString,
  MinLength,
  MaxLength,
  IsIn,
  IsOptional,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { BILLING_ID_REGEX } from '../../wallet/wallet-payment.util';

const SUPPORT_CATEGORIES = [
  'general',
  'billing',
  'technical',
  'trading',
  'account',
  'other',
] as const;

export class CreateTicketDto {
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  subject: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @IsIn([...SUPPORT_CATEGORIES], {
    message: `category must be one of: ${SUPPORT_CATEGORIES.join(', ')}`,
  })
  category: string;

  /** Canonical wallet Billing ID (PRF-WLT-YYYYMMDD-XXXXXXXX) for payment complaints */
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(BILLING_ID_REGEX, {
    message:
      'billingId must match PRF-WLT-YYYYMMDD-XXXXXXXX (e.g. PRF-WLT-20260712-A1B2C3D4)',
  })
  billingId?: string;
}

export class AddResponseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  message: string;
}

export class UpdateStatusDto {
  @IsString()
  @IsIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
  status: string;
}

export class AssignTicketDto {
  @IsOptional()
  @IsString()
  adminId?: string;
}
