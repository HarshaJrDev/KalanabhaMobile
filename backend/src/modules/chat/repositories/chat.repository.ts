import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByShipment(shipmentId: string) {
    return this.prisma.chatMessage.findMany({
      where: { shipmentId },
      orderBy: { createdAt: 'asc' },
    });
  }

  create(params: { shipmentId: string; senderId: string; senderName: string; text: string }) {
    return this.prisma.chatMessage.create({ data: params });
  }
}
