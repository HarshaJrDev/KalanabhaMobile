export interface ChatMessageEntity {
  id: string;
  shipmentId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: Date;
}
