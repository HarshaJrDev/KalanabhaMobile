import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { VehicleConfigDto } from '../dto/vehicle-config.dto';

@Injectable()
export class SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllVehicleConfigs() {
    return this.prisma.vehicleConfig.findMany({ orderBy: { name: 'asc' } });
  }

  findVehicleConfigByType(nameOrType: string) {
    return this.prisma.vehicleConfig.findFirst({
      where: { name: { equals: nameOrType, mode: 'insensitive' } },
    });
  }

  countVehicleConfigs() {
    return this.prisma.vehicleConfig.count();
  }

  createVehicleConfig(dto: VehicleConfigDto) {
    return this.prisma.vehicleConfig.create({ data: { ...dto, active: dto.active ?? true } });
  }

  createManyVehicleConfigs(configs: VehicleConfigDto[]) {
    return this.prisma.vehicleConfig.createMany({
      data: configs.map((c) => ({ ...c, active: c.active ?? true })),
    });
  }

  updateVehicleConfig(id: string, dto: VehicleConfigDto) {
    return this.prisma.vehicleConfig.update({ where: { id }, data: dto });
  }

  toggleActive(id: string, active: boolean) {
    return this.prisma.vehicleConfig.update({ where: { id }, data: { active } });
  }

  deleteVehicleConfig(id: string) {
    return this.prisma.vehicleConfig.delete({ where: { id } });
  }
}
