import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  countShipmentsByStatus() {
    return this.prisma.shipment.groupBy({ by: ['status'], _count: { _all: true } });
  }

  sumDeliveredRevenue() {
    return this.prisma.shipment.aggregate({
      where: { status: 'DELIVERED' },
      _sum: { price: true },
    });
  }

  countOnlineDrivers() {
    return this.prisma.user.count({ where: { role: 'DRIVER', isOnline: true } });
  }

  countUnreadNotifications() {
    return this.prisma.notification.count({ where: { read: false } });
  }

  revenueByServiceType() {
    return this.prisma.shipment.groupBy({
      by: ['serviceType'],
      where: { status: 'DELIVERED' },
      _sum: { price: true },
    });
  }
}
