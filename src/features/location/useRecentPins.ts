// useRecentPins.ts — MMKV-persisted "recently pinned" locations for
// LocationPinPicker, mirroring useLocationSearch.ts's recordRecentServiceArea
// pattern but for free lat/lng/address points (not ServiceArea ids) — the
// map-pin picker resolves to an arbitrary coordinate, not one of the
// curated ServiceArea rows that pattern was built around.
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
        // Non-critical — recents are a convenience, not load-bearing.
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
