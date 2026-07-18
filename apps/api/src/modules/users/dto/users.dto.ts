import {
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
  IsBoolean,
  IsEmail,
  Equals,
  Length,
  Matches,
  MaxLength,
  IsUrl,
  IsStrongPassword,
  Min,
  Max,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

function Match(property: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'Match',
      target: (object as any).constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as string[];
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ];
          return value === relatedValue;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as string[];
          return `${args.property} must match ${relatedPropertyName}`;
        },
      },
    });
  };
}

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

export class RequestPasswordResetOtpDto {
  @ApiProperty({ example: 'trader@example.com' })
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toLowerCase(),
  )
  @IsEmail({}, { message: 'Enter a valid email address' })
  email: string;
}

export class VerifyPasswordResetOtpDto {
  @ApiProperty({ example: 'trader@example.com' })
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toLowerCase(),
  )
  @IsEmail({}, { message: 'Enter a valid email address' })
  email: string;

  @ApiProperty({ description: '6-digit OTP sent to the user email' })
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6-digit code' })
  otp: string;
}

export class ConfirmPasswordResetDto {
  @ApiProperty({ example: 'trader@example.com' })
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toLowerCase(),
  )
  @IsEmail({}, { message: 'Enter a valid email address' })
  email: string;

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

  @ApiProperty()
  @IsString()
  @Match('newPassword', { message: 'Confirm password must match new password' })
  confirmPassword: string;
}

export class VerifyDeleteAccountOtpDto {
  @ApiProperty({ description: '6-digit OTP sent to the user email' })
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6-digit code' })
  otp: string;
}

export class DeleteAccountDto {
  @ApiProperty({
    description:
      'Must be true after OTP verification to confirm permanent deletion',
  })
  @IsBoolean()
  @Equals(true, { message: 'finalConfirm must be true' })
  finalConfirm: boolean;
}
