import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV();

// Keys
const TOKEN_KEY = 'access_token';
const USER_KEY = 'auth_user';
const ONBOARDING_KEY = 'has_seen_onboarding';

export interface StoredUser {
    uid: string;
    email: string;
}

// ----------------------
// TOKEN
// ----------------------
export const setToken = (token: string): void => {
    storage.set(TOKEN_KEY, token);
};

export const getToken = (): string | null => {
    return storage.getString(TOKEN_KEY) ?? null;
};

export const clearToken = (): void => {
    storage.remove(TOKEN_KEY); // ✅ correct for your version
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
    storage.remove(USER_KEY);
};