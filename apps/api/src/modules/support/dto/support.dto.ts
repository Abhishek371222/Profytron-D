import {
  IsString,
  MinLength,
  MaxLength,
  IsIn,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';

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
