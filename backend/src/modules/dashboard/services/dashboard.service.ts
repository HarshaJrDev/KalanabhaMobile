import { Injectable } from '@nestjs/common';
import { DashboardRepository } from '../repositories/dashboard.repository';
import { OverviewStats } from '../interfaces/overview-stats.interface';

const STATUS_COUNT_KEYS: Record<string, keyof OverviewStats> = {
  SEARCHING: 'searching',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  // Mirrors admin App.tsx's client-side `stats` reducer over the full
  // shipments stream — computed server-side here instead, so the admin
  // panel doesn't need to download every shipment document to show a summary.
  async overview(): Promise<OverviewStats> {
    const [statusCounts, revenue, onlineDrivers, unreadNotif, revenueByService] = await Promise.all([
      this.dashboardRepository.countShipmentsByStatus(),
      this.dashboardRepository.sumDeliveredRevenue(),
      this.dashboardRepository.countOnlineDrivers(),
      this.dashboardRepository.countUnreadNotifications(),
      this.dashboardRepository.revenueByServiceType(),
    ]);

    const stats: OverviewStats = {
      total: 0,
      searching: 0,
      active: 0,
      delivered: 0,
      cancelled: 0,
      revenue: revenue._sum.price ?? 0,
      onlineDrivers,
      unreadNotif,
      revenueByServiceType: revenueByService.map((r) => ({
        serviceType: r.serviceType,
        revenue: r._sum.price ?? 0,
      })),
    };

    for (const row of statusCounts) {
      stats.total += row._count._all;

      if (row.status === 'ACCEPTED' || row.status === 'IN_TRANSIT') {
        stats.active += row._count._all;
        continue;
      }

      const key = STATUS_COUNT_KEYS[row.status];
      if (key) {
        (stats[key] as number) += row._count._all;
      }
    }

    return stats;
  }
}
