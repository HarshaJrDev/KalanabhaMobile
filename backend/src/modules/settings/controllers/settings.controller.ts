import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/guards/roles.decorator';
import { SettingsService } from '../services/settings.service';
import { VehicleConfigDto } from '../dto/vehicle-config.dto';
import { ToggleActiveDto } from '../dto/toggle-active.dto';
import { ApiResponseBuilder } from '../../../shared/api-response/api-response';

@ApiTags('settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings/vehicle-configs')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async list() {
    const configs = await this.settingsService.listVehicleConfigs();
    return ApiResponseBuilder.success(configs);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async create(@Body() dto: VehicleConfigDto) {
    const config = await this.settingsService.createVehicleConfig(dto);
    return ApiResponseBuilder.success(config, 'Vehicle config created');
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() dto: VehicleConfigDto) {
    const config = await this.settingsService.updateVehicleConfig(id, dto);
    return ApiResponseBuilder.success(config);
  }

  @Patch(':id/active')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async toggleActive(@Param('id') id: string, @Body() dto: ToggleActiveDto) {
    const config = await this.settingsService.toggleActive(id, dto.active);
    return ApiResponseBuilder.success(config);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string) {
    await this.settingsService.deleteVehicleConfig(id);
    return ApiResponseBuilder.success(null, 'Vehicle config deleted');
  }
}
