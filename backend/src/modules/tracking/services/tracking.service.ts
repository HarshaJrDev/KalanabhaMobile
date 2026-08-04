import { Injectable, NotFoundException } from '@nestjs/common';
import { TrackingRepository } from '../repositories/tracking.repository';
import { TrackingGateway } from '../../../websocket/tracking.gateway';

@Injectable()
export class TrackingService {
  constructor(
    private readonly trackingRepository: TrackingRepository,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  async recordPing(driverId: string, lat: number, lng: number) {
    const location = await this.trackingRepository.updateDriverLocation(driverId, lat, lng);

    const activeShipments = await this.trackingRepository.findActiveShipmentIdsForDriver(driverId);
    for (const shipment of activeShipments) {
      this.trackingGateway.broadcastLocation(shipment.id, {
        lat,
        lng,
        updatedAt: location.lastLocationAt!,
      });
    }

    return location;
  }

  async getLocationForShipment(shipmentId: string) {
    const shipment = await this.trackingRepository.findDriverLocationForShipment(shipmentId);
    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }
    if (!shipment.driverId || shipment.driver?.lastLat == null || shipment.driver?.lastLng == null) {
      return null;
    }

    return {
      lat: shipment.driver.lastLat,
      lng: shipment.driver.lastLng,
      updatedAt: shipment.driver.lastLocationAt,
    };
  }
}
