import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard, Public } from '../auth/guards/auth.guard';
import { PaymentsService } from '../payments/payments.service';
import { CheckoutSubscriptionDto, StartTrialDto } from './dto/subscriptions.dto';

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

  @Get('payments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Payment history' })
  getPayments(@Req() req: { user: { userId: string } }) {
    return this.paymentsService.getPaymentHistory(req.user.userId, 20, 0);
  }
}
