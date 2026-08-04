import { BadRequestException, Injectable } from '@nestjs/common';
import { SettingsService } from '../../settings/services/settings.service';
import { haversineDistanceKm } from '../../../utils/geo.util';

interface QuoteParams {
  pickup: { lat: number; lng: number };
  drop: { lat: number; lng: number };
  vehicleType: string;
  serviceType: string;
}

@Injectable()
export class PricingService {
  constructor(private readonly settingsService: SettingsService) {}

  async quote(params: QuoteParams): Promise<{ price: number; distanceKm: number }> {
    const distanceKm = haversineDistanceKm(params.pickup, params.drop);

    const config = await this.settingsService.findVehicleConfigByType(params.vehicleType);
    if (!config || !config.active) {
      throw new BadRequestException(`Unknown or inactive vehicle type: ${params.vehicleType}`);
    }

    const price = Math.round(config.baseRate + distanceKm * config.ratePerKm);

    return { price, distanceKm: Math.round(distanceKm * 100) / 100 };
  }
}
