import {
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateConversationDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}

export class SendMessageDto {
  @IsString()
  @MaxLength(8000)
  content: string;
}

export class TrackInsightDto {
  @IsString()
  @MaxLength(100)
  event: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  intent?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  questionPreview?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
