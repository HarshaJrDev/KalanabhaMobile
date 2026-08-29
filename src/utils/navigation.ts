import { Linking, Platform } from 'react-native';

interface Coordinates {
    lat: number;
    lng: number;
}

export const openGoogleMapsDirections = async (
    origin: Coordinates,
    destination: Coordinates
): Promise<void> => {
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;

    const geoUrl = `geo:${destination.lat},${destination.lng}?q=${destination.lat},${destination.lng}`;

    try {
        await Linking.openURL(googleMapsUrl);
    } catch {
        if (Platform.OS === 'android') {
            await Linking.openURL(geoUrl);
            return;
        }
        const appleMapsUrl = `http://maps.apple.com/?saddr=${origin.lat},${origin.lng}&daddr=${destination.lat},${destination.lng}`;
        await Linking.openURL(appleMapsUrl);
    }
};