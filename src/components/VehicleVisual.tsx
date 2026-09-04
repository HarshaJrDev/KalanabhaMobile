// VehicleVisual — the one place every screen renders a vehicle type's
// picture. Shows the real, admin-set illustration (VehicleConfig.imageUrl,
// set from KalanabhaAdmin's Vehicle Configs page) with a smooth fade-in
// once it loads; falls back to the existing Lucide icon-by-name mapping
// while loading, on a failed fetch, or whenever an admin simply hasn't set
// an image yet — never a fabricated placeholder photo.
import React, { useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { Truck, Bike, Car, type LucideIcon } from 'lucide-react-native';
import type { VehicleConfig } from '@features/settings/types';

const VEHICLE_ICON_BY_NAME: Record<string, LucideIcon> = { bike: Bike, van: Car, truck: Truck };
export const vehicleIconFor = (name: string): LucideIcon => VEHICLE_ICON_BY_NAME[name.toLowerCase()] ?? Truck;

interface Props {
    vehicle: Pick<VehicleConfig, 'name' | 'imageUrl'>;
    size: number;
    iconSize?: number;
    borderRadius?: number;
    backgroundColor: string;
    iconColor: string;
}

const VehicleVisual: React.FC<Props> = ({ vehicle, size, iconSize, borderRadius = 16, backgroundColor, iconColor }) => {
    const Icon = vehicleIconFor(vehicle.name);
    const [loaded, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);
    const fade = React.useRef(new Animated.Value(0)).current;

    const showImage = !!vehicle.imageUrl && !failed;

    const onLoad = () => {
        setLoaded(true);
        Animated.timing(fade, { toValue: 1, duration: 280, useNativeDriver: true }).start();
    };

    return (
        <View style={[styles.wrap, { width: size, height: size, borderRadius, backgroundColor }]}>
            {/* Icon fallback — always mounted underneath so there's never a
                blank gap while the real image is still loading or if it
                never resolves. */}
            <View style={styles.iconLayer}>
                <Icon color={iconColor} size={iconSize ?? Math.round(size * 0.5)} strokeWidth={1.75} />
            </View>

            {showImage && (
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
                    <Image
                        source={{ uri: vehicle.imageUrl! }}
                        style={[styles.image, { borderRadius }]}
                        resizeMode="cover"
                        onLoad={onLoad}
                        onError={() => setFailed(true)}
                    />
                </Animated.View>
            )}

            {showImage && !loaded && (
                <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
                    <ActivityIndicator size="small" color={iconColor} />
                </View>
            )}
        </View>
    );
};

export default VehicleVisual;

const styles = StyleSheet.create({
    wrap: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    iconLayer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    image: { width: '100%', height: '100%' },
    loadingOverlay: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.03)' },
});
