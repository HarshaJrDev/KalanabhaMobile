import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/guards/roles.decorator';
import { UsersService } from '../services/users.service';
import { UpdateFcmTokenDto } from '../dto/update-fcm-token.dto';
import { SetOnlineStatusDto } from '../dto/set-online-status.dto';
import { SetDocumentsVerifiedDto } from '../dto/set-documents-verified.dto';
import { CreateDriverDto } from '../dto/create-driver.dto';
import { ApiResponseBuilder } from '../../../shared/api-response/api-response';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@Req() req: any) {
    const user = await this.usersService.findById(req.user.sub);
    return ApiResponseBuilder.success(user);
  }

  // Mirrors utils/cm.ts::registerFCMToken merge-set on the mobile app.
  @Patch('me/fcm-token')
  async updateFcmToken(@Req() req: any, @Body() dto: UpdateFcmTokenDto) {
    const user = await this.usersService.updateFcmToken(req.user.sub, dto.fcmToken);
    return ApiResponseBuilder.success(user);
  }

  // Mirrors components/DriverHeader.tsx's online/offline toggle.
  @Patch('me/online-status')
  @UseGuards(RolesGuard)
  @Roles('driver')
  async setOnlineStatus(@Req() req: any, @Body() dto: SetOnlineStatusDto) {
    const user = await this.usersService.setOnlineStatus(req.user.sub, dto.isOnline);
    return ApiResponseBuilder.success(user);
  }

  // Mirrors admin App.tsx's driver list (query where role == 'driver').
  @Get('drivers')
  @UseGuards(RolesGuard)
  @Roles('admin', 'dispatcher')
  async listDrivers() {
    const drivers = await this.usersService.findDrivers();
    return ApiResponseBuilder.success(drivers);
  }

  // Mirrors admin App.tsx's CreateDriverModal (Auth create + Firestore doc).
  @Post('drivers')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async createDriver(@Body() dto: CreateDriverDto) {
    const driver = await this.usersService.createDriver(dto);
    return ApiResponseBuilder.success(driver, 'Driver created');
  }

  // Mirrors admin App.tsx's documentsVerified toggle.
  @Patch('drivers/:id/verify')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async verifyDriver(@Param('id') id: string, @Body() dto: SetDocumentsVerifiedDto) {
    const driver = await this.usersService.setDocumentsVerified(id, dto.documentsVerified);
    return ApiResponseBuilder.success(driver);
  }
}
