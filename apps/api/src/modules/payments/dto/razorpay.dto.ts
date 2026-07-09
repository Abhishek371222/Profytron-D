import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateRazorpayOrderDto {
  @IsInt()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  receipt?: string;
}

export class VerifyRazorpayPaymentDto {
  @IsOptional()
  @IsString()
  razorpay_order_id?: string;

  @IsOptional()
  @IsString()
  razorpay_payment_id?: string;

  @IsOptional()
  @IsString()
  razorpay_signature?: string;
}

export class DemoCompleteRazorpayDto {
  @IsString()
  orderId: string;
}
