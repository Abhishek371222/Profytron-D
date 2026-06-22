import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  Logger,
  Headers,
  ForbiddenException,
} from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { JwtAuthGuard, Public } from '../auth/guards/auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';

type AuthRequest = Request & { user: { id: string } };

@ApiTags('Telegram')
@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(private readonly telegramService: TelegramBotService) {}

  @ApiOperation({
    summary: 'Telegram webhook — receives updates from Telegram',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  @Public()
  @Post('webhook')
  async webhook(
    @Body() update: any,
    @Headers('x-telegram-bot-api-secret-token') secretToken?: string,
  ) {
    const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
    // Fail closed: an unconfigured secret used to leave this endpoint fully
    // open (anyone could POST forged Telegram updates). Require the secret.
    if (!expected) {
      this.logger.warn(
        'Rejected Telegram webhook: TELEGRAM_WEBHOOK_SECRET is not configured',
      );
      throw new ForbiddenException('Telegram webhook is not configured');
    }
    if (!secretToken || secretToken !== expected) {
      throw new ForbiddenException('Invalid Telegram webhook secret');
    }
    this.logger.debug(`[TELEGRAM] Webhook update received`);
    await this.telegramService.handleTelegramUpdate(update);
    return { ok: true };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link your Telegram account' })
  @ApiResponse({ status: 201, description: 'Linked' })
  @UseGuards(JwtAuthGuard)
  @Post('link')
  async linkAccount(
    @Req() req: AuthRequest,
    @Body() body: { telegramChatId: number; telegramUsername: string },
  ) {
    return this.telegramService.registerTelegramUser(
      req.user.id,
      body.telegramChatId,
      body.telegramUsername,
    );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a test alert to your linked Telegram' })
  @ApiResponse({ status: 200, description: 'Alert sent' })
  @UseGuards(JwtAuthGuard)
  @Get('test-alert')
  async testAlert(@Req() req: AuthRequest) {
    return this.telegramService.sendAlertToUser(
      req.user.id,
      'Test Alert',
      'Your Profytron Telegram alerts are working correctly.',
    );
  }
}
