import * as crypto from 'crypto';
import { ForbiddenException } from '@nestjs/common';
import { PaymentsService } from './payments.service';

describe('PaymentsService Razorpay ownership', () => {
  it('rejects verify when order userId does not match JWT user', async () => {
    process.env.RAZORPAY_KEY_SECRET = 'test-secret';
    const orderId = 'order_1';
    const paymentId = 'pay_1';
    const signature = crypto
      .createHmac('sha256', 'test-secret')
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const razorpay = {
      orders: {
        fetch: jest.fn().mockResolvedValue({
          amount: 10000,
          currency: 'INR',
          notes: { userId: 'owner-user' },
        }),
      },
    };
    const service = Object.create(PaymentsService.prototype) as PaymentsService;
    Object.assign(service, {
      logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
      razorpay,
    });

    await expect(
      service.verifyRazorpayPayment('jwt-user', {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
