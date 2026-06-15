import { IsString, MinLength, MaxLength, IsIn, IsOptional } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  subject: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description: string;

  @IsString()
  @IsIn(['billing', 'technical', 'trading', 'account', 'other'])
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
