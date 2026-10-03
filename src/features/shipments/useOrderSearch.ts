








import { useMemo, useState } from 'react';
import { useMyShipments } from './hooks';

export const useOrderSearch = () => {
    const [query, setQuery] = useState('');
    const { data: shipments, isLoading, error, refetch } = useMyShipments();

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return [];
        return (shipments ?? []).filter(
            (s) => s.trackingId.toLowerCase().includes(q) || s.shipmentId.toLowerCase().includes(q),
        );
    }, [query, shipments]);

    return { query, setQuery, results, isLoading, error, refetch };
};
