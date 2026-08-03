import { BadRequestException, Injectable } from '@nestjs/common';
import { SettingsService } from '../../settings/services/settings.service';

interface QuoteParams {
  pickup: { lat: number; lng: number };
  drop: { lat: number; lng: number };
  vehicleType: string;
  serviceType: string;
}

const EARTH_RADIUS_KM = 6371;

@Injectable()
export class PricingService {
  constructor(private readonly settingsService: SettingsService) {}

  async quote(params: QuoteParams): Promise<{ price: number; distanceKm: number }> {
    const distanceKm = this.haversineDistanceKm(params.pickup, params.drop);

    const config = await this.settingsService.findVehicleConfigByType(params.vehicleType);
    if (!config || !config.active) {
      throw new BadRequestException(`Unknown or inactive vehicle type: ${params.vehicleType}`);
    }

    const price = Math.round(config.baseRate + distanceKm * config.ratePerKm);

    return { price, distanceKm: Math.round(distanceKm * 100) / 100 };
  }

  private haversineDistanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

    return EARTH_RADIUS_KM * c;
  }
}
