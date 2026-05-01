import { Body, Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../auth/guards/auth.guard';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
@Controller('webhooks')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post('stripe')
  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  async handleStripeWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.body as Buffer;
    const event = this.paymentsService.verifyAndBuildStripeEvent(
      rawBody,
      signature,
    );
    return this.paymentsService.handleStripeEvent(event);
  }

  @Public()
  @Post('razorpay')
  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Razorpay webhook endpoint' })
  async handleRazorpayWebhook(
    @Req() req: Request,
    @Headers('x-razorpay-signature') signature: string,
    @Body() body: any,
  ) {
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(JSON.stringify(body || {}));

    this.paymentsService.verifyRazorpaySignature(rawBody, signature);

    const payload = Buffer.isBuffer(req.body)
      ? JSON.parse(rawBody.toString('utf8'))
      : body;

    return this.paymentsService.handleRazorpayEvent(payload);
  }
}
