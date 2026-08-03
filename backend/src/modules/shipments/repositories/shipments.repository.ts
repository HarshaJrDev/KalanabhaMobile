import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateShipmentDto } from '../dto/create-shipment.dto';

@Injectable()
export class ShipmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    customerId: string,
    dto: CreateShipmentDto,
    computed: { shipmentId: string; trackingId: string; price: number; distanceKm: number },
  ) {
    return this.prisma.shipment.create({
      data: {
        shipmentId: computed.shipmentId,
        trackingId: computed.trackingId,
        customerId,
        goodsType: dto.goodsType,
        weightKg: dto.weightKg,
        pickupAddress: dto.pickup.address,
        pickupLat: dto.pickup.lat,
        pickupLng: dto.pickup.lng,
        dropAddress: dto.drop.address,
        dropLat: dto.drop.lat,
        dropLng: dto.drop.lng,
        from: dto.pickup.address,
        to: dto.drop.address,
        price: computed.price,
        distanceKm: computed.distanceKm,
        sender: dto.sender as any,
        receiver: dto.receiver as any,
        package: (dto.package ?? {}) as any,
        serviceType: dto.serviceType,
        vehicleType: dto.vehicleType,
        paymentMode: dto.paymentMode,
        pickupSlot: dto.pickupSlot,
        notes: dto.notes,
        status: 'SEARCHING',
      },
    });
  }

  // Mirrors addOrders.tsx's duplicate-order guard.
  findDuplicate(customerId: string, from: string, to: string, pickupSlot: string) {
    return this.prisma.shipment.findFirst({
      where: {
        customerId,
        from,
        to,
        pickupSlot,
        status: { in: ['SEARCHING', 'ACCEPTED'] },
      },
    });
  }

  findById(id: string) {
    return this.prisma.shipment.findUnique({ where: { id } });
  }

  findActiveForCustomer(customerId: string) {
    return this.prisma.shipment.findMany({
      where: { customerId, status: { in: ['SEARCHING', 'ACCEPTED', 'IN_TRANSIT'] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  findSearching() {
    return this.prisma.shipment.findMany({
      where: { status: 'SEARCHING' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  findAllForAdmin() {
    return this.prisma.shipment.findMany({ orderBy: { createdAt: 'desc' } });
  }

  updateStatusConditionally(id: string, fromStatuses: string[], toStatus: string, extra: Record<string, unknown> = {}) {
    return this.prisma.shipment.updateMany({
      where: { id, status: { in: fromStatuses as any } },
      data: { status: toStatus as any, ...extra },
    });
  }
}
