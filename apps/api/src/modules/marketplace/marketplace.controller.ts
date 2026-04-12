import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @ApiOperation({ summary: 'List all available strategy listings' })
  @Get('listings')
  async getListings() {
    return this.marketplaceService.exploreListings();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a Stripe checkout session for a strategy' })
  @Post('checkout')
  async createCheckout(
    @Req() req: any,
    @Body('listingId') listingId: string
  ) {
    return this.marketplaceService.createCheckoutSession(req.user.id, listingId);
  }
}
