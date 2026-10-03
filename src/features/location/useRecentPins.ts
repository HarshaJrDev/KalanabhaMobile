




import { useCallback, useMemo, useState } from 'react';
import { storage } from '@services/storage';

const RECENT_PINS_KEY = 'recent_pinned_locations';
const MAX_RECENT_PINS = 5;

export interface RecentPin {
    lat: number;
    lng: number;
    address: string;
}

const readRecentPins = (): RecentPin[] => {
    try {
        const raw = storage.getString(RECENT_PINS_KEY);
        return raw ? (JSON.parse(raw) as RecentPin[]) : [];
    } catch {
        return [];
    }
};

const writeRecentPins = (pins: RecentPin[]) => {
    try {
        storage.set(RECENT_PINS_KEY, JSON.stringify(pins.slice(0, MAX_RECENT_PINS)));
    } catch {
        
    }
};

export const recordRecentPin = (pin: RecentPin) => {
    const current = readRecentPins().filter((p) => p.address !== pin.address);
    writeRecentPins([pin, ...current]);
};

export const useRecentPins = () => {
    const [version, setVersion] = useState(0);
    const recentPins = useMemo(() => readRecentPins(), [version]);
    const refresh = useCallback(() => setVersion((v) => v + 1), []);
    return { recentPins, refresh };
};
