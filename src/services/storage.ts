import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV();

// Keys
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'auth_user';
const ONBOARDING_KEY = 'has_seen_onboarding';

// Shape returned by GET /users/me — mirrors kalanabhaBackend's UserEntity
// field-for-field (verified against a running instance) rather than only
// the subset the app happened to read at the time this was first written.
export interface StoredUser {
    id: string;
    email: string;
    role: 'CUSTOMER' | 'DRIVER' | 'ADMIN' | 'DISPATCHER' | 'WAREHOUSE';
    displayName: string | null;
    phone: string | null;
    address: string | null;
    customerType: string | null;
    isOnline: boolean;
    fcmToken: string | null;
    vehicleType: string | null;
    licenseNumber: string | null;
    rating: number | null;
    totalDeliveries: number;
    documentsVerified: boolean;
    createdByAdmin: boolean;
    createdAt: string;
    updatedAt: string;
}

// ----------------------
// ACCESS TOKEN
// ----------------------
export const setToken = (token: string): void => {
    storage.set(TOKEN_KEY, token);
};

export const getToken = (): string | null => {
    return storage.getString(TOKEN_KEY) ?? null;
};

export const clearToken = (): void => {
    storage.remove(TOKEN_KEY);
};

// ----------------------
// REFRESH TOKEN
// ----------------------
export const setRefreshToken = (token: string): void => {
    storage.set(REFRESH_TOKEN_KEY, token);
};

export const getRefreshToken = (): string | null => {
    return storage.getString(REFRESH_TOKEN_KEY) ?? null;
};

export const clearRefreshToken = (): void => {
    storage.remove(REFRESH_TOKEN_KEY);
};

// ----------------------
// USER
// ----------------------
export const setUser = (user: StoredUser): void => {
    storage.set(USER_KEY, JSON.stringify(user));
};

export const getUser = (): StoredUser | null => {
    const value = storage.getString(USER_KEY);
    if (!value) return null;

    try {
        return JSON.parse(value) as StoredUser;
    } catch {
        storage.remove(USER_KEY);
        return null;
    }
};

export const clearUser = (): void => {
    storage.remove(USER_KEY);
};

// ----------------------
// ONBOARDING
// ----------------------
export const setOnboardingSeen = (): void => {
    storage.set(ONBOARDING_KEY, true);
};

export const isOnboardingSeen = (): boolean => {
    return storage.getBoolean(ONBOARDING_KEY) ?? false;
};

export const clearOnboarding = (): void => {
    storage.remove(ONBOARDING_KEY);
};

// ----------------------
// CLEAR ALL
// ----------------------
export const clearAuth = (): void => {
    storage.remove(TOKEN_KEY);
    storage.remove(REFRESH_TOKEN_KEY);
    storage.remove(USER_KEY);
};
