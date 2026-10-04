import { useCallback } from 'react';
import Geolocation from 'react-native-geolocation-service';
import { reverseGeocode } from '../services/location';
import { ensureLocationPermission } from '@utils/locationPermission';

interface UseAutoAddressReturn {
  // `addr` is null on any failure (permission denied, GPS error, reverse-
  // geocode error) — callers must handle both branches. Previously this
  // callback was only ever invoked on success, so a caller with no other
  // feedback mechanism (e.g. Signup.tsx) saw a silent, permanent hang on
  // failure — no toast, no re-enabled button, nothing.
  getAddress: (onResult: (addr: string | null) => void) => void;
}

export const useAutoAddress = (): UseAutoAddressReturn => {
  const getAddress = useCallback(
    async (onResult: (addr: string | null) => void) => {
      const granted = await ensureLocationPermission();
      if (!granted) {
        console.warn('[useAutoAddress] location permission denied');
        onResult(null);
        return;
      }

      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const address = await reverseGeocode(latitude, longitude);
            onResult(address);
          } catch (error) {
            console.warn('[useAutoAddress] Reverse geocode failed', error);
            onResult(null);
          }
        },
        (error) => {
          console.warn('[useAutoAddress] Location error', error);
          onResult(null);
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
