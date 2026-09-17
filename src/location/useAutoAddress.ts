import { useCallback } from 'react';
import Geolocation from 'react-native-geolocation-service';
import { reverseGeocode } from '../services/location';
import { ensureLocationPermission } from '@utils/locationPermission';

interface UseAutoAddressReturn {
  getAddress: (onSuccess: (addr: string) => void) => void;
}

export const useAutoAddress = (): UseAutoAddressReturn => {
  const getAddress = useCallback(
    async (onSuccess: (addr: string) => void) => {
      const granted = await ensureLocationPermission();
      if (!granted) {
        console.warn('[useAutoAddress] location permission denied');
        return;
      }

      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const address = await reverseGeocode(latitude, longitude);
            onSuccess(address);
          } catch (error) {
            console.warn('[useAutoAddress] Reverse geocode failed', error);
          }
        },
        (error) => {
          console.warn('[useAutoAddress] Location error', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
          forceRequestLocation: true,
          showLocationDialog: true,
        }
      );
    },
    []
  );

  return { getAddress };
};
