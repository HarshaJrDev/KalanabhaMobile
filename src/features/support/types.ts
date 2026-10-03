



export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';




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
    
    messages?: SupportTicketMessage[];
}

export interface CreateTicketPayload {
    subject: string;
    description: string;
    category: string;
    priority?: TicketPriority;
    shipmentId?: string;
}
