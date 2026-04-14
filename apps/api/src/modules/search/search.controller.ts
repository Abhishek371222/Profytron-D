import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/guards/auth.guard';
import { GlobalSearchQueryDto } from './dto/global-search.dto';
import { SearchService } from './search.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get('global')
  @ApiOperation({ summary: 'Global intelligent search across app entities' })
  async globalSearch(@Query() query: GlobalSearchQueryDto) {
    return this.searchService.globalSearch(query.q || '', query.limit ?? 8);
  }
}
