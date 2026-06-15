import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsString, IsArray, ArrayNotEmpty, IsIn } from 'class-validator';

const VALID_SCOPES = [
  'read:trades',
  'read:analytics',
  'read:strategies',
  'read:wallet',
  'write:trades',
  'write:strategies',
];

class CreateApiKeyDto {
  @IsString()
  name: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsIn(VALID_SCOPES, { each: true })
  scopes: string[];
}

@Controller('settings/api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly service: ApiKeysService) {}

  @Get()
  list(@Request() req: any) {
    return this.service.list(req.user.id);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateApiKeyDto) {
    return this.service.create(req.user.id, dto.name, dto.scopes);
  }

  @Delete(':id')
  revoke(@Param('id') id: string, @Request() req: any) {
    return this.service.revoke(id, req.user.id);
  }
}
