import {
  Controller,
  Get,
  Header,
  Param,
  Post,
  Req,
  Res,
  StreamableFile,
  UseGuards,
  Body,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { JwtAuthGuard, Public } from '../auth/guards/auth.guard';
import { PaymentsService } from '../payments/payments.service';
import {
  CheckoutSubscriptionDto,
  StartTrialDto,
} from './dto/subscriptions.dto';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'List platform subscription plans' })
  @ApiResponse({ status: 200, description: 'Platform subscription plans' })
  getPlans() {
    return this.paymentsService.getSubscriptionPlans();
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user platform subscription' })
  getCurrent(@Req() req: { user: { userId: string } }) {
    return this.paymentsService.getCurrentSubscription(req.user.userId);
  }

  @Get('billing-center')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Aggregate billing payload (current plan, plans, invoices, payments, refunds)',
  })
  getBillingCenter(@Req() req: { user: { userId: string } }) {
    return this.paymentsService.getBillingCenter(req.user.userId);
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Razorpay order for platform plan checkout' })
  @ApiResponse({ status: 201, description: 'Order created' })
  checkout(
    @Req() req: { user: { userId: string } },
    @Body() body: CheckoutSubscriptionDto,
  ) {
    return this.paymentsService.createPlatformPlanOrder(
      req.user.userId,
      body.planId,
      body.billingCycle ?? 'MONTHLY',
    );
  }

  @Post('trial/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { ttl: 3600000, limit: 3 } })
  @ApiOperation({
    summary: 'Start a 7-day free trial of a Starter/Pro platform plan',
  })
  @ApiResponse({ status: 201, description: 'Trial started' })
  startTrial(
    @Req() req: { user: { userId: string } },
    @Body() body: StartTrialDto,
  ) {
    return this.paymentsService.startPlatformTrial(
      req.user.userId,
      body.planId,
    );
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Cancel the current platform subscription (access continues until it expires)',
  })
  cancel(@Req() req: { user: { userId: string } }) {
    return this.paymentsService.cancelSubscription(req.user.userId);
  }

  @Get('invoices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List user invoices' })
  getInvoices(@Req() req: { user: { userId: string } }) {
    return this.paymentsService.getInvoices(req.user.userId);
  }

  @Get('invoices/:id/download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download invoice as PDF' })
  @Header('Content-Type', 'application/pdf')
  async downloadInvoice(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, filename } = await this.paymentsService.downloadInvoicePdf(
      req.user.userId,
      id,
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
    });
    return new StreamableFile(buffer);
  }

  @Get('payments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Payment history' })
  getPayments(@Req() req: { user: { userId: string } }) {
    return this.paymentsService.getPaymentHistory(req.user.userId, 50, 0);
  }

  @Get('refunds')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refund history for current user' })
  getRefunds(@Req() req: { user: { userId: string } }) {
    return this.paymentsService.getRefundHistory(req.user.userId);
  }
}
