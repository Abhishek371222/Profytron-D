import { Module } from '@nestjs/common';
import { BrokerIntegrationService } from './broker-integration.service';

@Module({
  providers: [BrokerIntegrationService],
  exports: [BrokerIntegrationService],
})
export class BrokerIntegrationModule {}