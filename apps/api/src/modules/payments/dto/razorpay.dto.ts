import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRazorpayOrderDto {
  /** Amount in paise (minimum 100 = ₹1). */
  @IsInt()
  @Min(100)
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
  @IsString()
  razorpay_order_id: string;

  @IsString()
  razorpay_payment_id: string;

  @IsString()
  razorpay_signature: string;
}

export class DemoCompleteRazorpayDto {
  @IsString()
  orderId: string;
}
