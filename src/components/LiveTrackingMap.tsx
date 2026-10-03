














import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Map, Camera, Marker, type LngLat } from '@maplibre/maplibre-react-native';


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
    
    
    
    children?: React.ReactNode;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({ pickup, drop, driver, height = 220, children }) => {
    
    
    
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

                {children}
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
