import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ShipmentsRepository } from '../repositories/shipments.repository';
import { CreateShipmentDto } from '../dto/create-shipment.dto';
import { QuoteShipmentDto } from '../dto/quote-shipment.dto';
import { PricingService } from '../../pricing/services/pricing.service';
import { DispatchService } from './dispatch.service';

@Injectable()
export class ShipmentsService {
  constructor(
    private readonly shipmentsRepository: ShipmentsRepository,
    private readonly pricingService: PricingService,
    private readonly dispatchService: DispatchService,
  ) {}

  // Mirrors Rapido's "see fare before you book" — same PricingService.quote
  // the create() flow uses internally, exposed standalone so the mobile app
  // can show a price on a confirm screen before the order is actually placed.
  quote(dto: QuoteShipmentDto) {
    return this.pricingService.quote(dto);
  }

  async create(customerId: string, dto: CreateShipmentDto) {
    const duplicate = await this.shipmentsRepository.findDuplicate(
      customerId,
      dto.pickup.address,
      dto.drop.address,
      dto.pickupSlot,
    );
    if (duplicate) {
      throw new ConflictException('This shipment already exists');
    }

    const { price, distanceKm } = await this.pricingService.quote({
      pickup: dto.pickup,
      drop: dto.drop,
      vehicleType: dto.vehicleType,
      serviceType: dto.serviceType,
    });

    const shipmentId = `SHP-${randomUUID().slice(0, 8).toUpperCase()}`;
    const trackingId = `KL${Date.now()}`;

    const shipment = await this.shipmentsRepository.create(customerId, dto, {
      shipmentId,
      trackingId,
      price,
      distanceKm,
    });

    // Rapido-style: try to silently assign the nearest available driver
    // right away. If none is found nearby, the shipment stays SEARCHING
    // and drivers can still pick it up manually from the pool.
    const autoMatched = await this.dispatchService.autoMatch(shipment.id, dto.pickup, dto.vehicleType);

    return autoMatched ?? shipment;
  }

  async findById(id: string, requesterId: string, requesterRole: string) {
    const shipment = await this.shipmentsRepository.findById(id);
    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    const isOwner = shipment.customerId === requesterId || shipment.driverId === requesterId;
    if (!isOwner && !['ADMIN', 'DISPATCHER'].includes(requesterRole.toUpperCase())) {
      throw new ForbiddenException('Not allowed to view this shipment');
    }

    return shipment;
  }

  findActiveForCustomer(customerId: string) {
    return this.shipmentsRepository.findActiveForCustomer(customerId);
  }

  findSearching() {
    return this.shipmentsRepository.findSearching();
  }

  findAllForAdmin() {
    return this.shipmentsRepository.findAllForAdmin();
  }

  // Mirrors components/LogisticsCardList.tsx::useCustomerActions.onCancel and
  // admin App.tsx::cancelOrder — either the owning customer or an admin can cancel.
  async cancel(id: string, requesterId: string, requesterRole: string) {
    const shipment = await this.shipmentsRepository.findById(id);
    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    const isOwner = shipment.customerId === requesterId;
    if (!isOwner && !['ADMIN', 'DISPATCHER'].includes(requesterRole.toUpperCase())) {
      throw new ForbiddenException('Not allowed to cancel this shipment');
    }

    const result = await this.shipmentsRepository.updateStatusConditionally(
      id,
      ['SEARCHING', 'ACCEPTED', 'IN_TRANSIT'],
      'CANCELLED',
    );
    if (result.count === 0) {
      throw new ConflictException('Shipment is already delivered or cancelled');
    }

    return this.shipmentsRepository.findById(id);
  }
}
