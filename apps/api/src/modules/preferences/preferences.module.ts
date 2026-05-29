import { Module } from '@nestjs/common';
import { UserPreferencesService } from './user-preferences.service';

@Module({
  providers: [UserPreferencesService],
  exports: [UserPreferencesService],
})
export class PreferencesModule {}
