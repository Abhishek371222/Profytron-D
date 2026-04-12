import { IsEmail, IsString, MinLength, IsUUID, IsStrongPassword } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'voss@profytron.ai' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Str0ngP@ssw0rd' })
  @IsStrongPassword()
  password: string;

  @ApiProperty({ example: 'Alexander Voss' })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiProperty({ example: 'Str0ngP@ssw0rd' })
  @IsString()
  @IsStrongPassword()
  confirmPassword: string;
}

export class VerifyEmailDto {
  @ApiProperty({ example: 'voss@profytron.ai' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  otp: string;
}

export class LoginDto {
  @ApiProperty({ example: 'voss@profytron.ai' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'voss@profytron.ai' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'uuid-token-string' })
  @IsUUID()
  token: string;

  @ApiProperty({ example: 'NewStr0ngP@ssw0rd' })
  @IsStrongPassword()
  newPassword: string;
}

export class ResendOtpDto {
  @ApiProperty({ example: 'voss@profytron.ai' })
  @IsEmail()
  email: string;
}

export class SupabaseLoginDto {
  @IsString()
  token: string;

  @IsEmail()
  email: string;

  @IsString()
  fullName: string;

  @IsString()
  avatarUrl?: string;

  @IsString()
  provider: string;
}
