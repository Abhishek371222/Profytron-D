import { Module } from '@nestjs/common';
import { TutorialService } from './tutorial.service';
import { TutorialController } from './tutorial.controller';
import { GrowthModule } from '../growth/growth.module';

@Module({
  imports: [GrowthModule],
  controllers: [TutorialController],
  providers: [TutorialService],
})
export class TutorialModule {}
