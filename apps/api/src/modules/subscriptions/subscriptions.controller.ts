import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard, Public } from '../auth/guards/auth.guard';
import { PaymentsService } from '../payments/payments.service';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'List platform subscription plans' })
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
    @Body()
    body: { planId: string; billingCycle?: 'MONTHLY' | 'ANNUAL' },
  ) {
    return this.paymentsService.createPlatformPlanOrder(
      req.user.userId,
      body.planId,
      body.billingCycle ?? 'MONTHLY',
    );
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
