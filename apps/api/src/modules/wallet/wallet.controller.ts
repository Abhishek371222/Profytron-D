import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

interface RequestWithUser extends Request {
  user: {
    id: string;
  };
}

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get current wallet balance' })
  async getBalance(@Req() req: RequestWithUser) {
    return this.walletService.getBalance(req.user.id);
  }

  @Post('deposit')
  @ApiOperation({ summary: 'Initiate a stripe deposit' })
  async createDeposit(@Req() req: any, @Body('amount') amount: number) {
    return this.walletService.createDepositIntent(req.user.id, amount);
  }
}
