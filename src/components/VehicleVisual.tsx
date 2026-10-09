








import React, { useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator, Animated, type ImageSourcePropType, type DimensionValue } from 'react-native';
import { Truck, Bike, Car, type LucideIcon } from 'lucide-react-native';
import type { VehicleConfig } from '@features/settings/types';

const VEHICLE_ICON_BY_NAME: Record<string, LucideIcon> = { bike: Bike, van: Car, truck: Truck };
export const vehicleIconFor = (name: string): LucideIcon => VEHICLE_ICON_BY_NAME[name.toLowerCase()] ?? Truck;







// Real branded fleet photos, keyed by VehicleConfig.name lowercased —
// previously only 4 generic placeholder images existed here (one of
// them, "mini truck", pointed at a mislabeled Lurry.png). Admin can
// still add any other vehicle type with just a name + no matching
// asset here; it simply falls back to the Lucide icon below, same as
// before this map existed.
const LOCAL_VEHICLE_IMAGES: Record<string, ImageSourcePropType> = {
    bike: require('../../assets/images/home/Bike.png'),
    van: require('../../assets/images/home/ven.png'),
    truck: require('../../assets/images/home/truck.png'),
    pickup: require('../../assets/images/vehicles/pickup_tata_ace.png'),
    'mini truck': require('../../assets/images/vehicles/mini_truck.png'),
    '14ft truck': require('../../assets/images/vehicles/truck_14ft.png'),
    '19ft truck': require('../../assets/images/vehicles/truck_19ft.png'),
    '32ft truck': require('../../assets/images/vehicles/truck_32ft.png'),
    'open body truck': require('../../assets/images/vehicles/open_body_truck.png'),
    container: require('../../assets/images/vehicles/container_truck.png'),
    'refrigerated truck': require('../../assets/images/vehicles/refrigerated_truck.png'),
    'low bed trailer': require('../../assets/images/vehicles/low_bed_trailer.png'),
    'tanker truck': require('../../assets/images/vehicles/tanker_truck.png'),
    'heavy haul truck': require('../../assets/images/vehicles/heavy_haul_truck.png'),
};

interface Props {
    vehicle: Pick<VehicleConfig, 'name' | 'imageUrl'>;
    size: number;
    
    
    
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
            {}
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
