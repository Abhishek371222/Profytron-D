import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { TutorialStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TutorialService } from './tutorial.service';

const STATUS_VALUES: TutorialStatus[] = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'SKIPPED',
];

class UpdateTutorialProgressDto {
  @IsOptional()
  @IsString()
  tourId?: string;

  @IsIn(STATUS_VALUES)
  status!: TutorialStatus;

  @IsOptional()
  @IsString()
  currentStepId?: string;
}

@ApiTags('Tutorial')
@Controller('tutorial')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TutorialController {
  constructor(private readonly tutorial: TutorialService) {}

  @Get('progress')
  @ApiOperation({ summary: 'Get guided-tour progress for the current user' })
  getProgress(
    @Req() req: { user: { userId: string } },
    @Query('tourId') tourId?: string,
  ) {
    return this.tutorial.getProgress(req.user.userId, tourId);
  }

  @Post('progress')
  @ApiOperation({ summary: 'Update guided-tour progress for the current user' })
  updateProgress(
    @Req() req: { user: { userId: string } },
    @Body() dto: UpdateTutorialProgressDto,
  ) {
    return this.tutorial.updateProgress(req.user.userId, dto.tourId, {
      status: dto.status,
      currentStepId: dto.currentStepId ?? null,
    });
  }
}
