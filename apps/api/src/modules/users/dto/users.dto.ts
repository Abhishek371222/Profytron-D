import {
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
  MinLength,
  MaxLength,
  Matches,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9_]{3,20}$/, {
    message:
      'Username must be 3-20 characters long and contain only letters, numbers, and underscores.',
  })
  username?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}

export class UpdateRiskProfileDto {
  @ApiProperty()
  @IsObject()
  riskProfileJson: Record<string, any>;

  @ApiProperty()
  @IsNumber()
  riskDnaScore: number;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class DeleteAccountDto {
  @ApiProperty({ description: 'Must be "DELETE" to confirm' })
  @IsString()
  confirmText: string;
}
