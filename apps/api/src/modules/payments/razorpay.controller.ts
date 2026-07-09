import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { PaymentsService } from './payments.service';
import {
  CreateRazorpayOrderDto,
  VerifyRazorpayPaymentDto,
  DemoCompleteRazorpayDto,
} from './dto/razorpay.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
@UseGuards(JwtAuthGuard)
@Controller('payments/razorpay')
export class RazorpayController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('order')
  @ApiOperation({ summary: 'Create a Razorpay Standard Checkout order' })
  @ApiResponse({ status: 201, description: 'Order created' })
  @ApiResponse({ status: 400, description: 'Invalid amount' })
  async createOrder(@Req() req: any, @Body() body: CreateRazorpayOrderDto) {
    return this.paymentsService.createRazorpayOrder(
      req.user.userId,
      body.amount,
      body.currency,
      body.receipt,
    );
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify a Razorpay Checkout payment signature' })
  @ApiResponse({ status: 201, description: 'Verified and credited' })
  @ApiResponse({
    status: 400,
    description: 'Signature mismatch or missing fields',
  })
  async verify(@Req() req: any, @Body() body: VerifyRazorpayPaymentDto) {
    return this.paymentsService.verifyRazorpayPayment(req.user.userId, body);
  }

  @Post('demo-complete')
  @ApiOperation({
    summary: 'Complete a demo Razorpay order (development only, DEMO_KEY)',
  })
  @ApiResponse({ status: 201, description: 'Demo payment credited' })
  async demoComplete(@Req() req: any, @Body() body: DemoCompleteRazorpayDto) {
    return this.paymentsService.completeDemoRazorpayOrder(
      req.user.userId,
      body.orderId,
    );
  }
}
