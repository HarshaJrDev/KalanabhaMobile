import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuthStore } from '../features/store/authStore';
import { auth } from '../src/services/firebase';


export const useAuthListener = (): void => {
    const setUser = useAuthStore((s) => s.setUser);
    const logout = useAuthStore((s) => s.logout);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser({
                    uid: user.uid,
                    email: user.email ?? '',
                });
            } else {
                logout();
            }
        });

        return unsubscribe;
    }, [setUser, logout]);
};