import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/guards/auth.guard';
import { GlobalSearchQueryDto } from './dto/global-search.dto';
import { SearchService } from './search.service';

@ApiTags('Search')
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get('global')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Global intelligent search across app entities' })
  async globalSearch(@Query() query: GlobalSearchQueryDto) {
    return this.searchService.globalSearch(query.q || '', query.limit ?? 8);
  }
}
