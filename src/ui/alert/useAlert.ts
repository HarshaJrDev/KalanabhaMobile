import { useCallback, useState } from 'react';

export type AlertType = 'error' | 'success' | 'info';

export interface AlertState {
    message: string;
    type: AlertType;
}

export const useAlert = () => {
    const [alert, setAlert] = useState<AlertState | null>(null);

    const show = useCallback((message: string, type: AlertType = 'error') => {
        setAlert({ message, type });
    }, []);

    const clear = useCallback(() => setAlert(null), []);

    return { alert, show, clear };
};