import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/guards/auth.guard';
import { PLATFORM_PLANS } from '../../common/constants/pricing.constants';

@ApiTags('Plans')
@Controller('plans')
export class PlansController {
  @Get()
  @Public()
  @ApiOperation({ summary: 'List all platform subscription plans (public)' })
  getPlans() {
    return PLATFORM_PLANS;
  }
}
