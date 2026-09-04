// One-to-one with kalanabhaBackend prisma/schema.prisma's DriverDocumentType
// / DriverDocumentStatus enums and the DriverDocument model.
export type DriverDocumentType =
    | 'DRIVING_LICENSE'
    | 'VEHICLE_RC'
    | 'INSURANCE'
    | 'VEHICLE_PERMIT'
    | 'IDENTITY_PROOF'
    | 'PAN'
    | 'OTHER';

export type DriverDocumentStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export const DRIVER_DOCUMENT_TYPES: DriverDocumentType[] = [
    'DRIVING_LICENSE',
    'VEHICLE_RC',
    'INSURANCE',
    'VEHICLE_PERMIT',
    'IDENTITY_PROOF',
    'PAN',
    'OTHER',
];

export const DRIVER_DOCUMENT_TYPE_LABEL: Record<DriverDocumentType, string> = {
    DRIVING_LICENSE: 'Driving License',
    VEHICLE_RC: 'Vehicle RC',
    INSURANCE: 'Insurance',
    VEHICLE_PERMIT: 'Vehicle Permit',
    IDENTITY_PROOF: 'Identity Proof',
    PAN: 'PAN',
    OTHER: 'Other',
};

// GET /files/driver-documents/mine — DriverDocument row, minus the file
// bytes themselves (fetched separately via GET .../:id/download).
export interface DriverDocument {
    id: string;
    driverId: string;
    type: DriverDocumentType;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    status: DriverDocumentStatus;
    rejectionReason: string | null;
    reviewedById: string | null;
    reviewedAt: string | null;
    expiresAt: string | null;
    uploadedAt: string;
    updatedAt: string;
}
