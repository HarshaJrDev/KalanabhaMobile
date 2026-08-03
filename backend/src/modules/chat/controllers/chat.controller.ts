import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ChatService } from '../services/chat.service';
import { ShipmentsService } from '../../shipments/services/shipments.service';
import { SendMessageDto } from '../dto/send-message.dto';
import { ApiResponseBuilder } from '../../../shared/api-response/api-response';

// Mirrors components/LogisticsCardList.tsx's chat panel and admin
// App.tsx's chat tab, both backed by shipments/{id}/messages in Firestore.
@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shipments/:shipmentId/messages')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly shipmentsService: ShipmentsService,
  ) {}

  @Get()
  async findMessages(@Req() req: any, @Param('shipmentId') shipmentId: string) {
    await this.shipmentsService.findById(shipmentId, req.user.sub, req.user.role);
    const messages = await this.chatService.findByShipment(shipmentId);
    return ApiResponseBuilder.success(messages);
  }

  @Post()
  async sendMessage(@Req() req: any, @Param('shipmentId') shipmentId: string, @Body() dto: SendMessageDto) {
    await this.shipmentsService.findById(shipmentId, req.user.sub, req.user.role);
    const message = await this.chatService.sendMessage(shipmentId, req.user.sub, req.user.role, dto.text);
    return ApiResponseBuilder.success(message);
  }
}
