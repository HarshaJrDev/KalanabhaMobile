import { Module } from '@nestjs/common';
import { TrackingController } from './controllers/tracking.controller';
import { TrackingService } from './services/tracking.service';
import { TrackingRepository } from './repositories/tracking.repository';
import { TrackingGateway } from '../../websocket/tracking.gateway';
import { AuthModule } from '../auth/auth.module';
import { ShipmentsModule } from '../shipments/shipments.module';

@Module({
  imports: [AuthModule, ShipmentsModule],
  controllers: [TrackingController],
  providers: [TrackingService, TrackingRepository, TrackingGateway],
  exports: [TrackingService],
})
export class TrackingModule {}
