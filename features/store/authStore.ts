import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from '../../src/services/storage';

export interface AuthUser {
    uid: string;
    email: string;
}

interface AuthState {
    user: AuthUser | null;
    setUser: (user: AuthUser) => void;
    logout: () => void;
}

const mmkvStorage = {
    getItem: (key: string): string | null => {
        const value = storage.getString(key);
        console.log('[MMKV][GET]', key, value);
        return value ?? null;
    },

    setItem: (key: string, value: string): void => {
        console.log('[MMKV][SET]', key, value);
        storage.set(key, value);
    },

    removeItem: (key: string): void => {
        console.log('[MMKV][REMOVE]', key);
        storage.remove(key);
    },
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,

            setUser: (user) => {
                console.log('[AUTH][SET_USER]', user);
                set({ user });
            },

            logout: () => {
                console.log('[AUTH][LOGOUT]');
                set({ user: null });
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => mmkvStorage),

            onRehydrateStorage: () => (state, error) => {
                if (error) {
                    console.error('[AUTH][HYDRATION_ERROR]', error);
                } else {
                    console.log('[AUTH][HYDRATED]', state);
                }
            },
        }
    )
);