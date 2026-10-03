
export interface BackendNotification {
    id: string;
    userId: string;
    type: string | null;
    shipmentId: string | null;
    
    
    
    ticketId: string | null;
    title: string;
    body: string;
    read: boolean;
    createdAt: string;
}
