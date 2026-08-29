// GET /notifications/mine row shape — Prisma `Notification` model.
export interface BackendNotification {
    id: string;
    userId: string;
    type: string | null;
    shipmentId: string | null;
    title: string;
    body: string;
    read: boolean;
    createdAt: string;
}
