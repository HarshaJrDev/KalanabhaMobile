// GET/POST /shipments/:shipmentId/messages row shape — Prisma `ChatMessage`.
export interface BackendChatMessage {
    id: string;
    shipmentId: string;
    senderId: string;
    senderName: string;
    text: string;
    createdAt: string;
}
