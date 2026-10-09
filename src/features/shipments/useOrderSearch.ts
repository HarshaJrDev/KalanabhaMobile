import { useMemo, useState } from 'react';
import { useMyShipmentHistory, useMyShipmentsAsDriver } from './hooks';
import { useAuthStore } from '@features/store/authStore';

// SearchScreen.tsx is shared UI for both customer and driver roles, but
// previously always queried useMyShipments() -> GET /shipments/mine,
// which is customer-scoped AND active-only
// (ShipmentsService.findActiveForCustomer). For a driver, req.user.sub
// never matches any shipment's customerId, so the search silently
// returned empty every time, for any query, delivered or not — not a
// delivery-specific bug, the driver side of this screen never worked.
// Fixed to pick the right, full-history data source per role: a driver
// searches GET /shipments/driver/mine (every shipment ever assigned to
// them, any status), a customer searches GET /shipments/mine/history
// (every shipment they've ever booked, any status — previously this
// screen used the narrower active-only endpoint even for customers,
// so a past/delivered tracking ID wouldn't surface either).
export const useOrderSearch = () => {
    const [query, setQuery] = useState('');
    const role = useAuthStore((s) => s.user?.role);
    const isDriver = role === 'DRIVER';

    const driverQuery = useMyShipmentsAsDriver(isDriver);
    const customerQuery = useMyShipmentHistory(!isDriver);
    const { data: shipments, isLoading, error, refetch } = isDriver
        ? driverQuery
        : customerQuery;

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return [];
        return (shipments ?? []).filter(
            (s) => s.trackingId.toLowerCase().includes(q) || s.shipmentId.toLowerCase().includes(q),
        );
    }, [query, shipments]);

    return { query, setQuery, results, isLoading, error, refetch };
};
