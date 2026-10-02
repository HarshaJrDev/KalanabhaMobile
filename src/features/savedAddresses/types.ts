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

export type SavedAddressType = 'HOME' | 'WORK' | 'HOTEL' | 'OTHER';

export interface SavedAddress {
    id: string;
    userId: string;
    label: string;
    type: SavedAddressType;
    isDefault: boolean;
    serviceAreaId: string;
    serviceArea: SavedAddressServiceArea;
    houseNo: string | null;
    floor: string | null;
    addressLine: string | null;
    landmark: string | null;
    contactName: string | null;
    contactPhone: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSavedAddressPayload {
    label: string;
    type?: SavedAddressType;
    isDefault?: boolean;
    serviceAreaId: string;
    houseNo?: string;
    floor?: string;
    addressLine?: string;
    landmark?: string;
    contactName?: string;
    contactPhone?: string;
}

export type UpdateSavedAddressPayload = Partial<CreateSavedAddressPayload>;
