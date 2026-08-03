import { Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { NotificationsService } from '../services/notifications.service';
import { ApiResponseBuilder } from '../../../shared/api-response/api-response';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Mirrors Screens/HomeScreens/Home.tsx's notifications badge query.
  @Get('mine')
  async findMine(@Req() req: any) {
    const notifications = await this.notificationsService.findForUser(req.user.sub);
    return ApiResponseBuilder.success(notifications);
  }

  @Get('unread-count')
  async unreadCount(@Req() req: any) {
    const count = await this.notificationsService.countUnread(req.user.sub);
    return ApiResponseBuilder.success({ count });
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string) {
    const notification = await this.notificationsService.markRead(id);
    return ApiResponseBuilder.success(notification);
  }

  // Mirrors admin App.tsx's markAllRead.
  @Post('mark-all-read')
  async markAllRead(@Req() req: any) {
    await this.notificationsService.markAllRead(req.user.sub);
    return ApiResponseBuilder.success(null);
  }
}
