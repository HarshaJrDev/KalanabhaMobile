import { Injectable, OnModuleInit } from '@nestjs/common';
import { SettingsRepository } from '../repositories/settings.repository';
import { VehicleConfigDto } from '../dto/vehicle-config.dto';
import { DEFAULT_VEHICLE_CONFIGS } from '../constants/default-vehicle-configs';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  async onModuleInit() {
    const count = await this.settingsRepository.countVehicleConfigs();
    if (count === 0) {
      await this.settingsRepository.createManyVehicleConfigs(DEFAULT_VEHICLE_CONFIGS);
    }
  }

  listVehicleConfigs() {
    return this.settingsRepository.findAllVehicleConfigs();
  }

  findVehicleConfigByType(vehicleType: string) {
    return this.settingsRepository.findVehicleConfigByType(vehicleType);
  }

  createVehicleConfig(dto: VehicleConfigDto) {
    return this.settingsRepository.createVehicleConfig(dto);
  }

  updateVehicleConfig(id: string, dto: VehicleConfigDto) {
    return this.settingsRepository.updateVehicleConfig(id, dto);
  }

  toggleActive(id: string, active: boolean) {
    return this.settingsRepository.toggleActive(id, active);
  }

  deleteVehicleConfig(id: string) {
    return this.settingsRepository.deleteVehicleConfig(id);
  }
}
