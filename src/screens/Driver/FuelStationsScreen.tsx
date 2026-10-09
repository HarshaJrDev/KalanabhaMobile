







import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  StatusBar,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { SkeletonList } from '@components/ui';
import { ScreenHeader } from '@components/ScreenHeader';
import { Fuel, Navigation } from 'lucide-react-native';
import { useAppTheme } from '@theme/ThemeContext';
import { useNearbyFuelStations } from '@features/maps/hooks';
import { useLogFuelExpense } from '@features/fuelExpenses/hooks';
import { ensureLocationPermission } from '@utils/locationPermission';
import type { FuelStation } from '@features/maps/types';
import AppTextInput from '../../components/ui/AppTextInput';
import AppButton from '../../components/ui/AppButton';
import { showToast } from '@ui/alert/toastStore';
import { EmptyState } from '@components/EmptyState';
import { useTranslation } from 'react-i18next';

const FuelStationsScreen = () => {
  const { colors, fonts, spacing, radius } = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(
    () => makeStyles(colors, fonts, spacing, radius),
    [colors, fonts, spacing, radius],
  );

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const granted = await ensureLocationPermission();
      if (cancelled) return;
      if (!granted) {
        setLocationError(t('fuelStations.unableToGetLocation'));
        return;
      }
      Geolocation.getCurrentPosition(
        position =>
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        () => setLocationError(t('fuelStations.unableToGetLocation')),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
          forceRequestLocation: true,
        },
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const {
    data: stations,
    isLoading,
    error,
    refetch,
  } = useNearbyFuelStations(coords?.lat ?? null, coords?.lng ?? null);
  const [loggingFor, setLoggingFor] = useState<FuelStation | null>(null);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.BACKGROUND} />
      <ScreenHeader title={t('fuelStations.nearbyFuelStations')} />

      {loggingFor ? (
        <LogFuelForm
          station={loggingFor}
          onDone={() => setLoggingFor(null)}
          styles={styles}
          colors={colors}
        />
      ) : locationError ? (
        <EmptyState variant="fuel" title={locationError} />
      ) : isLoading || !coords ? (
        <SkeletonList />
      ) : error ? (
        <EmptyState
          variant="error"
          title={t('fuelStations.mapDataUnavailable')}
          onRetry={refetch}
        />
      ) : (
        <FlatList
          showsVerticalScrollIndicator={false}
          data={stations ?? []}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.stationCard}>
              <View style={styles.stationIconWrap}>
                <Fuel color={colors.PRIMARY} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stationName}>{item.name}</Text>
                <View style={styles.stationMetaRow}>
                  <Navigation color={colors.TEXT_SECONDARY} size={12} />
                  <Text style={styles.stationMeta}>
                    {t('fuelStations.kmAway', { km: item.distanceKm })}
                  </Text>
                </View>
              </View>
              <Pressable
                style={styles.logBtn}
                onPress={() => setLoggingFor(item)}
              >
                <Text style={styles.logBtnText}>
                  {t('fuelStations.logFillUp')}
                </Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              variant="fuel"
              title={t('fuelStations.noFuelStationsFound')}
            />
          }
        />
      )}
    </View>
  );
};

export default FuelStationsScreen;




const LogFuelForm = ({
  station,
  onDone,
  styles,
  colors,
}: {
  station: FuelStation;
  onDone: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [litres, setLitres] = useState('');
  const { mutate, isPending } = useLogFuelExpense();

  const handleSubmit = () => {
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      showToast(t('fuelStations.enterValidAmount'), 'error');
      return;
    }
    mutate(
      {
        stationName: station.name,
        lat: station.lat,
        lng: station.lng,
        amount: amountNum,
        litres: litres ? Number(litres) : undefined,
      },
      {
        onSuccess: () => {
          showToast(t('fuelStations.fuelExpenseLogged'), 'success');
          onDone();
        },
        onError: () => showToast(t('fuelStations.logExpenseFailed'), 'error'),
      },
    );
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.formStation}>{station.name}</Text>
      <Text style={styles.formStationSub}>
        {t('fuelStations.kmAway', { km: station.distanceKm })}
      </Text>

      <AppTextInput
        label={t('fuelStations.amountPaid')}
        value={amount}
        onChange={setAmount}
        keyboardType="numeric"
        placeholder={t('fuelStations.amountPaidPlaceholder')}
      />
      <AppTextInput
        label={t('fuelStations.litresOptional')}
        value={litres}
        onChange={setLitres}
        keyboardType="numeric"
        placeholder={t('fuelStations.litresPlaceholder')}
      />

      <View style={styles.formActions}>
        <Pressable style={styles.cancelBtn} onPress={onDone}>
          <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppButton
            title={isPending ? t('addOrder.saving') : t('common.save')}
            onPress={handleSubmit}
            loading={isPending}
            disabled={isPending}
          />
        </View>
      </View>
    </View>
  );
};

const makeStyles = (
  colors: ReturnType<typeof useAppTheme>['colors'],
  fonts: ReturnType<typeof useAppTheme>['fonts'],
  spacing: ReturnType<typeof useAppTheme>['spacing'],
  radius: ReturnType<typeof useAppTheme>['radius'],
) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.BACKGROUND },

    list: { padding: spacing.lg, gap: spacing.sm },
    stationCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.SURFACE,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.BORDER,
    },
    stationIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: colors.PRIMARY_LIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stationName: {
      fontFamily: fonts.SEMI_BOLD_PRIMARY,
      fontSize: 14,
      color: colors.TEXT_PRIMARY,
    },
    stationMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    stationMeta: {
      fontFamily: fonts.PRIMARY,
      fontSize: 12,
      color: colors.TEXT_SECONDARY,
    },
    logBtn: {
      backgroundColor: colors.PRIMARY,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm - 2,
    },
    logBtnText: {
      fontFamily: fonts.SEMI_BOLD_PRIMARY,
      fontSize: 12,
      color: '#fff',
    },

    formCard: { flex: 1, padding: spacing.xl, gap: spacing.md },
    formStation: {
      fontFamily: fonts.BOLD_PRIMARY,
      fontSize: 18,
      color: colors.TEXT_PRIMARY,
    },
    formStationSub: {
      fontFamily: fonts.PRIMARY,
      fontSize: 13,
      color: colors.TEXT_SECONDARY,
      marginBottom: spacing.sm,
    },
    formActions: {
      flexDirection: 'row',
      gap: spacing.md,
      alignItems: 'center',
      marginTop: spacing.md,
    },
    cancelBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    cancelBtnText: {
      fontFamily: fonts.SEMI_BOLD_PRIMARY,
      fontSize: 14,
      color: colors.TEXT_SECONDARY,
    },
  });
