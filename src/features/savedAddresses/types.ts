// One-to-one with kalanabhaBackend/src/modules/saved-addresses
// (SavedAddress Prisma model + SavedAddressesController). Real,
// self-service pickup/drop addresses anchored to a real, currently-active
// ServiceArea — not a free-typed address, same constraint the order
// form's PlacePicker already enforces.

export interface SavedAddressServiceArea {
    id: string;
    name: string;
    city: string;
    pincode: string;
    lat: number;
    lng: number;
}

export interface SavedAddress {
    id: string;
    userId: string;
    label: string;
    serviceAreaId: string;
    serviceArea: SavedAddressServiceArea;
    addressLine: string | null;
    contactName: string | null;
    contactPhone: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSavedAddressPayload {
    label: string;
    serviceAreaId: string;
    addressLine?: string;
    contactName?: string;
    contactPhone?: string;
}

export type UpdateSavedAddressPayload = Partial<CreateSavedAddressPayload>;
