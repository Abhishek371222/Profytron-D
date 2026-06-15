import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/auth.guard';
import { UserRole } from '@prisma/client';

class UpsertFlagDto {
  name?: string;
  description?: string;
  enabled?: boolean;
  rolloutPct?: number;
  userIds?: string[];
}

@Controller('admin/flags')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class FeatureFlagsController {
  constructor(private readonly service: FeatureFlagsService) {}

  @Get()
  getAll() {
    return this.service.getAll();
  }

  @Get(':key')
  isEnabled(@Param('key') key: string) {
    return this.service.isEnabled(key);
  }

  @Put(':key')
  upsert(@Param('key') key: string, @Body() dto: UpsertFlagDto) {
    return this.service.upsert(key, dto);
  }

  @Delete(':key')
  remove(@Param('key') key: string) {
    return this.service.remove(key);
  }
}
