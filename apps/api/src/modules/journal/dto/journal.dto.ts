import {
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateJournalEntryDto {
  @IsString()
  tradeId: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  emotions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  lessonLearned?: string;
}

export class UpdateJournalEntryDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  emotions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  lessonLearned?: string;

  @IsOptional()
  @IsUrl()
  screenshotUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  aiAnalysis?: string;
}
