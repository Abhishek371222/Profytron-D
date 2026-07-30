import { IsInt, IsString, MaxLength } from 'class-validator';

export class LinkTelegramDto {
  @IsInt()
  telegramChatId: number;

  @IsString()
  @MaxLength(100)
  telegramUsername: string;
}
