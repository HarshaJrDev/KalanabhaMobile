import { Injectable } from '@nestjs/common';
import { ChatRepository } from '../repositories/chat.repository';
import { ChatGateway } from '../../../websocket/chat.gateway';
import { UsersService } from '../../users/services/users.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly chatGateway: ChatGateway,
    private readonly usersService: UsersService,
  ) {}

  findByShipment(shipmentId: string) {
    return this.chatRepository.findByShipment(shipmentId);
  }

  // senderName is resolved from the user record rather than trusted from the
  // JWT payload, so it stays correct even if the JWT was issued before a
  // display-name change, and admin senders show "Admin" like the Firestore
  // version did (admin App.tsx::sendMsg hardcodes senderName: 'Admin').
  async sendMessage(shipmentId: string, senderId: string, senderRole: string, text: string) {
    const senderName = senderRole.toUpperCase() === 'ADMIN' ? 'Admin' : await this.resolveSenderName(senderId);
    const message = await this.chatRepository.create({ shipmentId, senderId, senderName, text });
    this.chatGateway.broadcastMessage(message);
    return message;
  }

  private async resolveSenderName(senderId: string): Promise<string> {
    const user = await this.usersService.findById(senderId);
    return user.displayName ?? user.email;
  }
}
