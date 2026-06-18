import {
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
  MaxLength,
  Matches,
  IsUrl,
  IsStrongPassword,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9_]{3,20}$/, {
    message:
      'Username must be 3-20 characters and contain only letters, numbers, and underscores.',
  })
  username?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  timezone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio?: string;

  // Only allow https:// URLs to block javascript: and data: URI injection.
  // avatarUrl set via this field should still be validated server-side to
  // prevent SSRF; prefer using the dedicated /me/avatar upload endpoint instead.
  @ApiPropertyOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @IsOptional()
  @MaxLength(2048)
  avatarUrl?: string;
}

export class UpdateRiskProfileDto {
  @ApiProperty()
  @IsObject()
  riskProfileJson: Record<string, any>;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  riskDnaScore: number;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword: string;

  @ApiProperty()
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol',
    },
  )
  newPassword: string;
}

export class DeleteAccountDto {
  @ApiProperty({ description: 'Must be "DELETE" to confirm' })
  @IsString()
  confirmText: string;
}
