import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/guards/roles.decorator';
import { TrackingService } from '../services/tracking.service';
import { ShipmentsService } from '../../shipments/services/shipments.service';
import { LocationPingDto } from '../dto/location-ping.dto';
import { ApiResponseBuilder } from '../../../shared/api-response/api-response';

@ApiTags('tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class TrackingController {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly shipmentsService: ShipmentsService,
  ) {}

  // Driver app calls this periodically (e.g. every 5-10s) while a delivery
  // is active. Broadcasts to every customer/admin watching that shipment.
  @Post('tracking/ping')
  @UseGuards(RolesGuard)
  @Roles('driver')
  async ping(@Req() req: any, @Body() dto: LocationPingDto) {
    const location = await this.trackingService.recordPing(req.user.sub, dto.lat, dto.lng);
    return ApiResponseBuilder.success(location);
  }

  // Fallback for clients that poll instead of using the WebSocket gateway.
  @Get('shipments/:id/location')
  async getLocation(@Req() req: any, @Param('id') id: string) {
    await this.shipmentsService.findById(id, req.user.sub, req.user.role);
    const location = await this.trackingService.getLocationForShipment(id);
    return ApiResponseBuilder.success(location);
  }
}
