import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV();


const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'auth_user';
const ONBOARDING_KEY = 'has_seen_onboarding';
const LANGUAGE_KEY = 'app_language';
const OFFLINE_MAPS_KEY = 'offline_maps_enabled';




export interface StoredUser {
    id: string;
    email: string;
    role: 'CUSTOMER' | 'DRIVER' | 'ADMIN' | 'DISPATCHER' | 'WAREHOUSE' | 'FLEET_OWNER';
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
    referralCode: string | null;
    notifyOrderUpdates: boolean;
    notifyPromotions: boolean;
    notifyReminders: boolean;
    preferredPaymentMode: string | null;
    createdAt: string;
    updatedAt: string;
}




export const setToken = (token: string): void => {
    storage.set(TOKEN_KEY, token);
};

export const getToken = (): string | null => {
    return storage.getString(TOKEN_KEY) ?? null;
};

export const clearToken = (): void => {
    storage.remove(TOKEN_KEY);
};




export const setRefreshToken = (token: string): void => {
    storage.set(REFRESH_TOKEN_KEY, token);
};

export const getRefreshToken = (): string | null => {
    return storage.getString(REFRESH_TOKEN_KEY) ?? null;
};

export const clearRefreshToken = (): void => {
    storage.remove(REFRESH_TOKEN_KEY);
};




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




export const setOnboardingSeen = (): void => {
    storage.set(ONBOARDING_KEY, true);
};

export const isOnboardingSeen = (): boolean => {
    return storage.getBoolean(ONBOARDING_KEY) ?? false;
};

export const clearOnboarding = (): void => {
    storage.remove(ONBOARDING_KEY);
};




export const setStoredLanguage = (lang: string): void => {
    storage.set(LANGUAGE_KEY, lang);
};

export const getStoredLanguage = (): string | null => {
    return storage.getString(LANGUAGE_KEY) ?? null;
};








export const setOfflineMapsEnabled = (enabled: boolean): void => {
    storage.set(OFFLINE_MAPS_KEY, enabled);
};

export const getOfflineMapsEnabled = (): boolean => {
    return storage.getBoolean(OFFLINE_MAPS_KEY) ?? true;
};




export const clearAuth = (): void => {
    storage.remove(TOKEN_KEY);
    storage.remove(REFRESH_TOKEN_KEY);
    storage.remove(USER_KEY);
};
