import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CoachEscalationStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/auth.guard';
import { CoachService } from './coach.service';

type AuthenticatedRequest = Request & {
  user: { id: string; role?: string };
};

@ApiTags('Alpha Coach')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiResponse({ status: 401, description: 'Unauthorized' })
@Controller('coach')
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'List my Alpha Coach conversations' })
  listConversations(@Req() req: AuthenticatedRequest) {
    return this.coachService.listConversations(req.user.id);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Start a new coaching conversation' })
  createConversation(
    @Req() req: AuthenticatedRequest,
    @Body() body: { title?: string },
  ) {
    return this.coachService.createConversation(req.user.id, body?.title);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation with messages' })
  getConversation(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.coachService.getConversation(req.user.id, id);
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Delete one of my Alpha Coach conversations' })
  deleteConversation(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.coachService.deleteConversation(req.user.id, id);
  }

  @Throttle({ default: { ttl: 60000, limit: 40 } })
  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message (FAQ match or Gemini AI reply)' })
  sendMessage(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    return this.coachService.sendMessage(req.user.id, id, body.content);
  }

  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @Post('conversations/:id/messages/stream')
  @ApiOperation({ summary: 'Stream Alpha Coach reply (SSE, Gemini-first)' })
  async streamMessage(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const write = (payload: unknown) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    try {
      await this.coachService.sendMessageStream(
        req.user.id,
        id,
        body?.content ?? '',
        (event) => write(event),
      );
    } catch (err: any) {
      write({
        type: 'error',
        text: err?.message || 'Stream failed',
      });
    } finally {
      try {
        res.write('data: {"type":"close"}\n\n');
        res.end();
      } catch {
      }
    }
  }

  @Post('conversations/:id/escalate')
  @ApiOperation({ summary: 'Escalate conversation to a human executive' })
  escalate(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.coachService.escalate(req.user.id, id);
  }

  @Get('admin/escalations')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List coach escalations (admin)' })
  listEscalations(@Query('status') status?: CoachEscalationStatus) {
    return this.coachService.listEscalations(status);
  }

  @Get('admin/conversations/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Load any conversation (admin)' })
  getConversationAdmin(@Param('id') id: string) {
    return this.coachService.getConversationForAdmin(id);
  }

  @Post('admin/escalations/:id/claim')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Claim an escalation' })
  claim(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.coachService.claimEscalation(req.user.id, id);
  }

  @Throttle({ default: { ttl: 60000, limit: 60 } })
  @Post('admin/escalations/:id/reply')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Reply as executive' })
  reply(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    return this.coachService.adminReply(req.user.id, id, body.content);
  }

  @Post('admin/escalations/:id/resolve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Resolve escalation' })
  resolve(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.coachService.resolveEscalation(req.user.id, id);
  }
}
