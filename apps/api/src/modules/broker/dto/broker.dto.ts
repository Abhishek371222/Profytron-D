import {
  IsString,
  IsOptional,
  IsIn,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class ConnectBrokerDto {
  @IsString()
  @MaxLength(100)
  brokerName: string;

  @IsString()
  @MaxLength(100)
  login: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  password?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  serverName?: string;

  @IsOptional()
  @IsIn(['mt4', 'mt5'])
  platform?: 'mt4' | 'mt5';

  @IsOptional()
  @IsIn(['PROVIDER', 'SUBSCRIBER'])
  copyFactoryRole?: 'PROVIDER' | 'SUBSCRIBER';
}
