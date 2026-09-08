// LiveTrackingMap.tsx
//
// Real map view — this app had NO map library at all before this (only
// "Open directions in Maps", which hands off to the external Google Maps
// app). Uses MapLibre (genuinely open-source, no Google Maps API key —
// react-native-maps was considered but its Android implementation is a
// thin wrapper around the Google Maps SDK and requires a billing-enabled
// Google Cloud API key even for basic display, which this app doesn't
// have) with OpenFreeMap's free, no-signup hosted style
// (https://openfreemap.org — real OpenStreetMap data, no API key, no
// usage cap for reasonable app traffic).
//
// Every marker plotted here is a real coordinate already flowing through
// this app: pickup/drop from the real Shipment row, driver position from
// the real WebSocket-backed useLiveDriverLocation. Nothing fabricated.
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Map, Camera, Marker, type LngLat } from '@maplibre/maplibre-react-native';

// No API key required — OpenFreeMap serves this style publicly and free.
const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export interface MapPoint {
    lat: number;
    lng: number;
}

interface LiveTrackingMapProps {
    pickup?: MapPoint | null;
    drop?: MapPoint | null;
    driver?: MapPoint | null;
    height?: number;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({ pickup, drop, driver, height = 220 }) => {
    // Center on whichever real point is most relevant right now — the
    // moving driver if we have one, otherwise the pickup point, otherwise
    // the drop point. Never a fabricated default city/coordinate.
    const center = useMemo<LngLat | null>(() => {
        const point = driver ?? pickup ?? drop;
        return point ? [point.lng, point.lat] : null;
    }, [driver, pickup, drop]);

    if (!center) return null;

    return (
        <View style={[styles.container, { height }]}>
            <Map style={styles.map} mapStyle={MAP_STYLE_URL}>
                <Camera center={center} zoom={13} />

                {pickup && (
                    <Marker id="pickup" lngLat={[pickup.lng, pickup.lat]}>
                        <View style={[styles.marker, styles.pickupMarker]} />
                    </Marker>
                )}

                {drop && (
                    <Marker id="drop" lngLat={[drop.lng, drop.lat]}>
                        <View style={[styles.marker, styles.dropMarker]} />
                    </Marker>
                )}

                {driver && (
                    <Marker id="driver" lngLat={[driver.lng, driver.lat]}>
                        <View style={[styles.marker, styles.driverMarker]} />
                    </Marker>
                )}
            </Map>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { width: '100%', borderRadius: 14, overflow: 'hidden' },
    map: { flex: 1 },
    marker: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#fff' },
    pickupMarker: { backgroundColor: '#10B981' },
    dropMarker: { backgroundColor: '#EF4444' },
    driverMarker: { backgroundColor: '#FF7518', width: 20, height: 20, borderRadius: 10 },
});
