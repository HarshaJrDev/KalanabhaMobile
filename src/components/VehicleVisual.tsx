// VehicleVisual — the one place every screen renders a vehicle type's
// picture. Priority order: (1) a real, bundled K-branded photo for the
// app's core fleet names — matched by the vehicle's own real `name` from
// the backend, not a hardcoded id, so it still tracks whatever admin does
// with that vehicle type; (2) an admin-set illustration (VehicleConfig.
// imageUrl, from KalanabhaAdmin's Vehicle Configs page) for any vehicle
// without a bundled photo; (3) the Lucide icon-by-name mapping while
// loading, on a failed fetch, or whenever neither of the above exists —
// never a fabricated placeholder photo.
import React, { useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator, Animated, type ImageSourcePropType, type DimensionValue } from 'react-native';
import { Truck, Bike, Car, type LucideIcon } from 'lucide-react-native';
import type { VehicleConfig } from '@features/settings/types';

const VEHICLE_ICON_BY_NAME: Record<string, LucideIcon> = { bike: Bike, van: Car, truck: Truck };
export const vehicleIconFor = (name: string): LucideIcon => VEHICLE_ICON_BY_NAME[name.toLowerCase()] ?? Truck;

// Real K-branded fleet photography, matched by the exact vehicle name
// these entries carry in the live backend today (see GET
// /settings/vehicle-configs) — "Mini Truck" is the only truck-class
// entry without an admin-set photo, so the larger lorry/trailer shot is
// mapped there for now; if a real "Lorry" vehicle type gets added later
// this mapping should move to that name instead.
const LOCAL_VEHICLE_IMAGES: Record<string, ImageSourcePropType> = {
    bike: require('../../assets/images/home/Bike.png'),
    van: require('../../assets/images/home/ven.png'),
    truck: require('../../assets/images/home/truck.png'),
    'mini truck': require('../../assets/images/home/Lurry.png'),
};

interface Props {
    vehicle: Pick<VehicleConfig, 'name' | 'imageUrl'>;
    size: number;
    // Optional overrides so this same component can render as a
    // full-width photo banner (a card header) instead of the default
    // square icon chip — width/height fall back to `size` when omitted.
    width?: DimensionValue;
    height?: DimensionValue;
    iconSize?: number;
    borderRadius?: number;
    backgroundColor: string;
    iconColor: string;
}

const VehicleVisual: React.FC<Props> = ({ vehicle, size, width, height, iconSize, borderRadius = 16, backgroundColor, iconColor }) => {
    const Icon = vehicleIconFor(vehicle.name);
    const [loaded, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);
    const fade = React.useRef(new Animated.Value(0)).current;

    const localImage = LOCAL_VEHICLE_IMAGES[vehicle.name.toLowerCase()];
    const imageSource: ImageSourcePropType | null = localImage ?? (vehicle.imageUrl ? { uri: vehicle.imageUrl } : null);
    const showImage = !!imageSource && !failed;

    const onLoad = () => {
        setLoaded(true);
        Animated.timing(fade, { toValue: 1, duration: 280, useNativeDriver: true }).start();
    };

    return (
        <View style={[styles.wrap, { width: width ?? size, height: height ?? size, borderRadius, backgroundColor }]}>
            {/* Icon fallback — always mounted underneath so there's never a
                blank gap while the real image is still loading or if it
                never resolves. */}
            <View style={styles.iconLayer}>
                <Icon color={iconColor} size={iconSize ?? Math.round(size * 0.5)} strokeWidth={1.75} />
            </View>

            {showImage && (
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
                    <Image
                        source={imageSource!}
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
