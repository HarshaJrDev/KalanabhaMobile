import { useEffect, useState } from 'react';
import { storage } from '../src/services/storage';


const TOKEN_KEY = 'access_token';

export const useAuthState = () => {
    const [token, setToken] = useState<string | null>(() =>
        storage.getString(TOKEN_KEY) ?? null
    );

    useEffect(() => {
        const listener = storage.addOnValueChangedListener((key) => {
            if (key === TOKEN_KEY) {
                setToken(storage.getString(TOKEN_KEY) ?? null);
            }
        });

        return () => listener.remove();
    }, []);

    return {
        token,
        isAuthenticated: !!token,
    };
};