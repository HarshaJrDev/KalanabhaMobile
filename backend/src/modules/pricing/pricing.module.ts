import { Module } from '@nestjs/common';
import { PricingService } from './services/pricing.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
