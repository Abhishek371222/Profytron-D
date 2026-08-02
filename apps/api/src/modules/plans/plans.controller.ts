import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/guards/auth.guard';
import { PaymentsService } from '../payments/payments.service';

/**
 * GET /plans and GET /subscriptions/plans share PaymentsService.getSubscriptionPlans
 * so pricing UI and team-plans stay on one source of truth (DB + PLATFORM_PLANS enrich).
 */
@ApiTags('Plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all platform subscription plans (public)' })
  getPlans() {
    return this.paymentsService.getSubscriptionPlans();
  }
}
