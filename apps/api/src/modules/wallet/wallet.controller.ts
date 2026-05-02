import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  Param,
  ParseIntPipe,
  Query,
  Req,
  Res,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import type { Response } from 'express';
import { Public, JwtAuthGuard } from '../auth/guards/auth.guard';
import {
  InitiateDepositDto,
  InitiateWithdrawalDto,
  WalletTransactionsQueryDto,
} from './dto/wallet.dto';

interface RequestWithUser extends Request {
  user: {
    id: string;
  };
}

@ApiTags('Wallet')
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get('balance')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get current wallet balance' })
  async getBalance(@Req() req: RequestWithUser) {
    return this.walletService.getBalance(req.user.id);
  }

  @Get('transactions')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get wallet transaction history' })
  async getTransactions(
    @Req() req: RequestWithUser,
    @Query(new ValidationPipe({ transform: true }))
    query: WalletTransactionsQueryDto,
  ) {
    return this.walletService.getTransactions(req.user.id, query);
  }

  @Post('deposit')
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({ summary: 'Initiate a stripe deposit' })
  async createDeposit(
    @Req() req: RequestWithUser,
    @Body(new ValidationPipe({ transform: true })) dto: InitiateDepositDto,
  ) {
    return this.walletService.initiateDeposit(req.user.id, dto);
  }

  @Post('withdraw')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({ summary: 'Initiate a wallet withdrawal' })
  async withdraw(
    @Req() req: RequestWithUser,
    @Body(new ValidationPipe({ transform: true })) dto: InitiateWithdrawalDto,
  ) {
    return this.walletService.initiateWithdrawal(req.user.id, dto);
  }

  @Get('statement/:year/:month')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Generate monthly wallet statement PDF' })
  async getStatement(
    @Req() req: RequestWithUser,
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.walletService.generateStatement(
      req.user.id,
      year,
      month,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="profytron_statement_${year}_${month}.pdf"`,
    );
    return data.pdfBuffer;
  }

  @Get('transaction/:id')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({ summary: 'Get transaction detail' })
  async getTransaction(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.walletService.getTransactionDetail(req.user.id, id);
  }

  @Post('webhook')
  @Public()
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Stripe Webhook Handler' })
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') sig: string,
  ) {
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(JSON.stringify(req.body || {}));

    const event = this.walletService.verifyAndBuildStripeEvent(rawBody, sig);
    return this.walletService.handleStripeWebhook(event);
  }
}
