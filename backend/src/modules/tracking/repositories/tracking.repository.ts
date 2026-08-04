import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class TrackingRepository {
  constructor(private readonly prisma: PrismaService) {}

  updateDriverLocation(driverId: string, lat: number, lng: number) {
    return this.prisma.user.update({
      where: { id: driverId },
      data: { lastLat: lat, lastLng: lng, lastLocationAt: new Date() },
      select: { id: true, lastLat: true, lastLng: true, lastLocationAt: true },
    });
  }

  // Active = has this driver assigned and not yet in a terminal state —
  // these are the shipments whose customers should receive this ping.
  findActiveShipmentIdsForDriver(driverId: string) {
    return this.prisma.shipment.findMany({
      where: { driverId, status: { in: ['ACCEPTED', 'IN_TRANSIT'] } },
      select: { id: true },
    });
  }

  findDriverLocationForShipment(shipmentId: string) {
    return this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      select: {
        driverId: true,
        driver: { select: { lastLat: true, lastLng: true, lastLocationAt: true } },
      },
    });
  }
}
