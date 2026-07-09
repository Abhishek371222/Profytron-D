import { IsNumber, IsPositive } from 'class-validator';

export class RequestWithdrawalDto {
  @IsNumber()
  @IsPositive()
  amount: number;
}
