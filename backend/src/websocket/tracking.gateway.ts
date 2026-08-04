import { Injectable } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// Rapido-style live driver tracking: the driver app pings its position
// periodically while a delivery is ACCEPTED/IN_TRANSIT, and any customer
// (or admin) watching that shipment's detail screen gets it pushed live
// instead of polling. Same room-per-shipment pattern as ChatGateway.
@Injectable()
@WebSocketGateway({ cors: { origin: '*' }, namespace: 'tracking' })
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
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

  broadcastLocation(shipmentId: string, location: { lat: number; lng: number; updatedAt: Date }) {
    this.server.to(this.room(shipmentId)).emit('location', location);
  }

  private room(shipmentId: string): string {
    return `shipment:${shipmentId}`;
  }
}
