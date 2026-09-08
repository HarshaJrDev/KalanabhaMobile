// GET /notifications/mine row shape — Prisma `Notification` model.
export interface BackendNotification {
    id: string;
    userId: string;
    type: string | null;
    shipmentId: string | null;
    // Real ticketId (kalanabhaBackend 2b1403b) — set on SUPPORT_REPLY/
    // SUPPORT_TICKET_RESOLVED/SUPPORT_TICKET_CLOSED notifications so
    // tapping one can deep-link to TicketDetailScreen.
    ticketId: string | null;
    title: string;
    body: string;
    read: boolean;
    createdAt: string;
}
