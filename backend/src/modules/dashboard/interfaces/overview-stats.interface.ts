export interface OverviewStats {
  total: number;
  searching: number;
  active: number;
  delivered: number;
  cancelled: number;
  revenue: number;
  onlineDrivers: number;
  unreadNotif: number;
  revenueByServiceType: { serviceType: string; revenue: number }[];
}
