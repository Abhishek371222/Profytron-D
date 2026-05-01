import { Controller, Post, Get, Body, Req, UseGuards, Logger } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';

type AuthRequest = Request & { user: { id: string } };

@ApiTags('Telegram')
@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(private readonly telegramService: TelegramBotService) {}

  @ApiOperation({ summary: 'Telegram webhook — receives updates from Telegram' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Post('webhook')
  async webhook(@Body() update: any) {
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
