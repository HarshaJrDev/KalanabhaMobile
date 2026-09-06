// One-to-one with kalanabhaBackend/src/modules/support (SupportController,
// prisma SupportTicket/SupportTicketMessage models) — a fully real,
// already-built ticket system that neither app had any UI for at all
// before this. "Help Center" was just a mailto: link.
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';

// Real categories a ticket can be raised under — kept in sync with the
// backend's `category: string` free-text field (no enum there), scoped to
// what this app's own flows can actually generate a complaint about.
export const TICKET_CATEGORIES = ['Delivery Issue', 'Payment', 'Driver Behaviour', 'App Bug', 'Other'] as const;
export type TicketCategory = (typeof TICKET_CATEGORIES)[number];

export interface TicketParticipant {
    id: string;
    displayName: string | null;
    email: string;
}

export interface SupportTicketMessage {
    id: string;
    ticketId: string;
    senderId: string;
    senderName: string;
    text: string;
    createdAt: string;
}

export interface SupportTicket {
    id: string;
    raisedById: string;
    raisedBy: TicketParticipant;
    assignedToId: string | null;
    assignedTo: TicketParticipant | null;
    shipmentId: string | null;
    shipment: { id: string; trackingId: string; from: string; to: string } | null;
    subject: string;
    description: string;
    category: string;
    priority: TicketPriority;
    status: TicketStatus;
    resolutionNote: string | null;
    createdAt: string;
    updatedAt: string;
    // Only present on GET /support/tickets/:id, not the list endpoints.
    messages?: SupportTicketMessage[];
}

export interface CreateTicketPayload {
    subject: string;
    description: string;
    category: string;
    priority?: TicketPriority;
    shipmentId?: string;
}
