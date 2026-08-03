import { Injectable } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatMessageEntity } from '../modules/chat/entities/chat-message.entity';

// Replaces the mobile app's Firestore onSnapshot on
// shipments/{id}/messages (components/LogisticsCardList.tsx) and the
// admin dashboard's equivalent listener. Clients join a room per shipment
// and receive new messages pushed by ChatService.sendMessage.
@Injectable()
@WebSocketGateway({ cors: { origin: '*' }, namespace: 'chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(_client: Socket) {}
  handleDisconnect(_client: Socket) {}

  @SubscribeMessage('join')
  handleJoin(client: Socket, shipmentId: string) {
    client.join(this.room(shipmentId));
  }

  @SubscribeMessage('leave')
  handleLeave(client: Socket, shipmentId: string) {
    client.leave(this.room(shipmentId));
  }

  broadcastMessage(message: ChatMessageEntity) {
    this.server.to(this.room(message.shipmentId)).emit('message', message);
  }

  private room(shipmentId: string): string {
    return `shipment:${shipmentId}`;
  }
}
