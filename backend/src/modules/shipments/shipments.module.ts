import { Module } from '@nestjs/common';
import { ShipmentsController } from './controllers/shipments.controller';
import { ShipmentsService } from './services/shipments.service';
import { DispatchService } from './services/dispatch.service';
import { ShipmentsRepository } from './repositories/shipments.repository';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [AuthModule, UsersModule, PricingModule],
  controllers: [ShipmentsController],
  providers: [ShipmentsService, DispatchService, ShipmentsRepository],
  exports: [ShipmentsService, DispatchService],
})
export class ShipmentsModule {}
