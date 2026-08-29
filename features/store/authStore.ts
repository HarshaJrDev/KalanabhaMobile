import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage, type StoredUser } from '../../src/services/storage';

// Mirrors the shape GET /users/me returns (kalanabhaBackend UserEntity).
export type AuthUser = StoredUser;

interface AuthState {
    user: AuthUser | null;
    setUser: (user: AuthUser) => void;
    logout: () => void;
}

const mmkvStorage = {
    getItem: (key: string): string | null => {
        return storage.getString(key) ?? null;
    },

    setItem: (key: string, value: string): void => {
        storage.set(key, value);
    },

    removeItem: (key: string): void => {
        storage.remove(key);
    },
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            setUser: (user) => set({ user }),
            logout: () => set({ user: null }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => mmkvStorage),
        }
    )
);
