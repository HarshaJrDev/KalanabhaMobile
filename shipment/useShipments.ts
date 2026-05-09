import { useEffect, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import { Shipment } from './types';
import { mapShipment } from '../utils/parsers';


export const useShipments = (): {
    data: Shipment[];
    loading: boolean;
    error: string | null;
} => {
    const [data, setData] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = firestore()
            .collection('shipments')
            .where('status', 'in', ['searching', 'accepted', 'in_transit'])
            .orderBy('createdAt', 'desc')
            .limit(50)
            .onSnapshot(
                (snap) => {
                    const mapped = snap.docs.map(mapShipment);
                    setData(mapped);
                    setLoading(false);
                },
                (err) => {
                    setError(err.message);
                    setLoading(false);
                }
            );

        return unsubscribe;
    }, []);

    return { data, loading, error };
};