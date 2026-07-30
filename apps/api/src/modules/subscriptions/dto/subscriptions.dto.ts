import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CheckoutSubscriptionDto {
  @IsString()
  @MaxLength(100)
  planId: string;

  @IsOptional()
  @IsIn(['MONTHLY', 'ANNUAL'])
  billingCycle?: 'MONTHLY' | 'ANNUAL';
}

export class StartTrialDto {
  @IsString()
  @MaxLength(100)
  planId: string;
}
