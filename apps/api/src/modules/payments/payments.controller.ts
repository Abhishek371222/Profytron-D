import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../auth/guards/auth.guard';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('webhooks')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post('stripe')
  @HttpCode(200)
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  async handleStripeWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.body as Buffer;
    const event = this.paymentsService.verifyAndBuildStripeEvent(rawBody, signature);
    return this.paymentsService.handleStripeEvent(event);
  }

  @Public()
  @Post('razorpay')
  @HttpCode(200)
  @ApiOperation({ summary: 'Razorpay webhook endpoint' })
  async handleRazorpayWebhook(
    @Req() req: Request,
    @Headers('x-razorpay-signature') signature: string,
    @Body() body: any,
  ) {
    const rawBody = Buffer.isBuffer(req.body)
      ? (req.body as Buffer)
      : Buffer.from(JSON.stringify(body || {}));

    this.paymentsService.verifyRazorpaySignature(rawBody, signature);

    const payload = Buffer.isBuffer(req.body)
      ? JSON.parse(rawBody.toString('utf8'))
      : body;

    return this.paymentsService.handleRazorpayEvent(payload);
  }
}
