// src/hooks/useLogin.ts

import { useMutation } from '@tanstack/react-query';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// --------------------
// Types
// --------------------
export interface LoginPayload {
    email: string;
    password: string;
}

export interface LoginResponse {
    user: FirebaseAuthTypes.User;
}

// --------------------
// Error Normalization
// --------------------
class AuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthError';
    }
}

const normalizeFirebaseError = (error: unknown): AuthError => {
    const err = error as { code?: string; message?: string };

    switch (err.code) {
        case 'auth/invalid-email':
            return new AuthError('Invalid email format');
        case 'auth/user-not-found':
            return new AuthError('User not found');
        case 'auth/wrong-password':
            return new AuthError('Incorrect password');
        case 'auth/too-many-requests':
            return new AuthError('Too many attempts. Try again later');
        default:
            return new AuthError(err.message || 'Login failed');
    }
};

// --------------------
// API Layer
// --------------------
const loginUser = async (
    payload: LoginPayload,
    signal?: AbortSignal
): Promise<LoginResponse> => {
    if (signal?.aborted) {
        throw new AuthError('Request cancelled');
    }

    try {
        const response = await auth().signInWithEmailAndPassword(
            payload.email,
            payload.password
        );

        if (!response.user) {
            throw new AuthError('Authentication failed');
        }

        return { user: response.user };
    } catch (error) {
        throw normalizeFirebaseError(error);
    }
};

// --------------------
// Hook
// --------------------
export const useLogin = () => {
    return useMutation<LoginResponse, AuthError, LoginPayload>({
        mutationFn: ({ email, password }) => loginUser({ email, password }),

        retry: 1, // avoid aggressive retries on auth
        networkMode: 'online',

        onError: (error) => {
            // Centralized logging (Flipper compatible)
            if (__DEV__) {
                console.error('[useLogin]', error.message);
            }
        },
    });
};