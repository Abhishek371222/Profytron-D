import { Module } from '@nestjs/common';
import { CopyBridgeService } from './copy-bridge.service';
import { CopyBridgeController } from './copy-bridge.controller';

@Module({
  controllers: [CopyBridgeController],
  providers: [CopyBridgeService],
  exports: [CopyBridgeService],
})
export class CopyBridgeModule {}
