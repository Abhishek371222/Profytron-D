import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { JwtAuthGuard, Public } from '../auth/guards/auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import {
  CreateMarketplaceListingDto,
  CreateReviewDto,
  MarketplaceQueryDto,
  ReplyReviewDto,
  SubscribeStrategyDto,
  UpdateSubscriptionRiskDto,
} from './dto/marketplace.dto';

@ApiTags('Marketplace')
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Public()
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Marketplace listing explorer' })
  @Get()
  async getListings(@Query() query: MarketplaceQueryDto, @Req() req: any) {
    return this.marketplaceService.findAll(query, req.user?.userId);
  }

  @Public()
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Featured marketplace strategies' })
  @Get('featured')
  async getFeatured() {
    return this.marketplaceService.getFeatured();
  }

  @Public()
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({ summary: 'Get single marketplace strategy details' })
  @Get(':id')
  async getById(
    @Param('id') id: string,
    @Query() query: MarketplaceQueryDto,
    @Req() req: any,
  ) {
    return this.marketplaceService.findById(id, req.user?.userId, query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({ summary: 'Create or update listing for strategy creator' })
  @Post(':strategyId/listing')
  async createListing(
    @Param('strategyId') strategyId: string,
    @Req() req: any,
    @Body() dto: CreateMarketplaceListingDto,
  ) {
    return this.marketplaceService.createListing(
      strategyId,
      req.user.userId,
      dto,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({ summary: 'Subscribe current user to strategy' })
  @Post(':strategyId/subscribe')
  async subscribe(
    @Param('strategyId') strategyId: string,
    @Req() req: any,
    @Body() dto: SubscribeStrategyDto,
  ) {
    return this.marketplaceService.subscribe(strategyId, req.user.userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({ summary: 'Update risk overrides for an active subscription' })
  @Patch(':strategyId/risk-overrides')
  async updateRiskOverrides(
    @Param('strategyId') strategyId: string,
    @Req() req: any,
    @Body() dto: UpdateSubscriptionRiskDto,
  ) {
    return this.marketplaceService.updateSubscriptionRiskControls(
      strategyId,
      req.user.userId,
      dto,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get risk overrides for an active subscription' })
  @Get(':strategyId/risk-overrides')
  async getRiskOverrides(
    @Param('strategyId') strategyId: string,
    @Req() req: any,
  ) {
    return this.marketplaceService.getSubscriptionRiskControls(
      strategyId,
      req.user.userId,
    );
  }

  @Public()
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get paginated strategy reviews' })
  @Get(':id/reviews')
  async getReviews(
    @Param('id') id: string,
    @Query() query: MarketplaceQueryDto,
    @Req() req: any,
  ) {
    const details = await this.marketplaceService.findById(
      id,
      req.user?.userId,
      query,
    );
    return details.reviews;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({ summary: 'Create strategy review' })
  @Post(':id/reviews')
  async createReview(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: CreateReviewDto,
  ) {
    return this.marketplaceService.createReview(id, req.user.userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({ summary: 'Creator reply to strategy review' })
  @Patch('reviews/:reviewId/reply')
  async replyToReview(
    @Param('reviewId') reviewId: string,
    @Req() req: any,
    @Body() dto: ReplyReviewDto,
  ) {
    return this.marketplaceService.replyToReview(
      reviewId,
      req.user.userId,
      dto,
    );
  }
}
