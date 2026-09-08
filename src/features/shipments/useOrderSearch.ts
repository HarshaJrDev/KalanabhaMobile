// useOrderSearch.ts
//
// Extracted from SearchScreen.tsx's real search logic (was inline in the
// screen) rather than a second implementation — this is the real,
// backend-honest scope: filtering the customer's own already-fetched
// shipments (GET /shipments/mine) by tracking/shipment ID client-side.
// There's no backend search-by-tracking-ID endpoint (GET /shipments/:id
// looks up by internal UUID, not the human-readable tracking ID), so this
// deliberately does not pretend to call one.
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
