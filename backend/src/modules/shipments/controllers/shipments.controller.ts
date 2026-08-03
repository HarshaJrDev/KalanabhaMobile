import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/guards/roles.decorator';
import { ShipmentsService } from '../services/shipments.service';
import { DispatchService } from '../services/dispatch.service';
import { CreateShipmentDto } from '../dto/create-shipment.dto';
import { AssignShipmentDto } from '../dto/assign-shipment.dto';
import { ApiResponseBuilder } from '../../../shared/api-response/api-response';

@ApiTags('shipments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shipments')
export class ShipmentsController {
  constructor(
    private readonly shipmentsService: ShipmentsService,
    private readonly dispatchService: DispatchService,
  ) {}

  // Mirrors components/OrderStepIndicator.tsx / addOrders.tsx order submission.
  @Post()
  async create(@Req() req: any, @Body() dto: CreateShipmentDto) {
    const shipment = await this.shipmentsService.create(req.user.sub, dto);
    return ApiResponseBuilder.success(shipment, 'Shipment created');
  }

  // Mirrors Screens/HomeScreens/Home.tsx / shipment.tsx active-shipments query.
  @Get('mine')
  async findMine(@Req() req: any) {
    const shipments = await this.shipmentsService.findActiveForCustomer(req.user.sub);
    return ApiResponseBuilder.success(shipments);
  }

  // Mirrors Screens/Driver/HomeScreen/HomeScreen.tsx nearby-orders query.
  @Get('searching')
  async findSearching() {
    const shipments = await this.shipmentsService.findSearching();
    return ApiResponseBuilder.success(shipments);
  }

  // Mirrors admin App.tsx's shipments list (all statuses, all customers).
  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('admin', 'dispatcher')
  async findAllForAdmin() {
    const shipments = await this.shipmentsService.findAllForAdmin();
    return ApiResponseBuilder.success(shipments);
  }

  // Mirrors Screens/HomeScreens/ShipmentDetailsScreen.
  @Get(':id')
  async findById(@Req() req: any, @Param('id') id: string) {
    const shipment = await this.shipmentsService.findById(id, req.user.sub, req.user.role);
    return ApiResponseBuilder.success(shipment);
  }

  // Mirrors shipment/actions.ts / LogisticsCardList.tsx::onAccept.
  @Post(':id/accept')
  @UseGuards(RolesGuard)
  @Roles('driver')
  async accept(@Req() req: any, @Param('id') id: string) {
    const shipment = await this.dispatchService.acceptShipment(id, req.user.sub);
    return ApiResponseBuilder.success(shipment, 'Shipment accepted');
  }

  // Mirrors admin App.tsx's AssignModal.
  @Post(':id/assign')
  @UseGuards(RolesGuard)
  @Roles('admin', 'dispatcher')
  async assign(@Param('id') id: string, @Body() dto: AssignShipmentDto) {
    const shipment = await this.dispatchService.assignShipment(id, dto.driverId);
    return ApiResponseBuilder.success(shipment, 'Driver assigned');
  }

  // Mirrors LogisticsCardList.tsx::useDriverActions.onStartDelivery.
  @Post(':id/start')
  @UseGuards(RolesGuard)
  @Roles('driver')
  async start(@Req() req: any, @Param('id') id: string) {
    const shipment = await this.dispatchService.startDelivery(id, req.user.sub);
    return ApiResponseBuilder.success(shipment, 'Delivery started');
  }

  // Mirrors LogisticsCardList.tsx::useDriverActions.onCompleteDelivery.
  @Post(':id/complete')
  @UseGuards(RolesGuard)
  @Roles('driver')
  async complete(@Req() req: any, @Param('id') id: string) {
    const shipment = await this.dispatchService.completeDelivery(id, req.user.sub);
    return ApiResponseBuilder.success(shipment, 'Delivery completed');
  }

  // Mirrors LogisticsCardList.tsx::useCustomerActions.onCancel and admin cancelOrder.
  @Post(':id/cancel')
  async cancel(@Req() req: any, @Param('id') id: string) {
    const shipment = await this.shipmentsService.cancel(id, req.user.sub, req.user.role);
    return ApiResponseBuilder.success(shipment, 'Shipment cancelled');
  }
}
