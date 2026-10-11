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
import { Milestone, Navigation } from 'lucide-react-native';
import { useAppTheme } from '@theme/ThemeContext';
import { NearbyPoiMap } from '@components/NearbyPoiMap';
import { useNearbyTollGates } from '@features/maps/hooks';
import { useLogFuelExpense } from '@features/fuelExpenses/hooks';
import { ensureLocationPermission } from '@utils/locationPermission';
import type { TollGate } from '@features/maps/types';
import AppTextInput from '../../components/ui/AppTextInput';
import AppButton from '../../components/ui/AppButton';
import { showToast } from '@ui/alert/toastStore';
import { EmptyState } from '@components/EmptyState';
import { useTranslation } from 'react-i18next';

const TollGatesScreen = () => {
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
        setLocationError(t('tollGates.unableToGetLocation'));
        return;
      }
      Geolocation.getCurrentPosition(
        position =>
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        () => setLocationError(t('tollGates.unableToGetLocation')),
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
    data: tollGates,
    isLoading,
    error,
    refetch,
  } = useNearbyTollGates(coords?.lat ?? null, coords?.lng ?? null);
  const [loggingFor, setLoggingFor] = useState<TollGate | null>(null);
  const [selectedTollId, setSelectedTollId] = useState<string | null>(null);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.BACKGROUND} />
      <ScreenHeader title={t('tollGates.nearbyTollGates')} />

      {loggingFor ? (
        <LogTollForm
          tollGate={loggingFor}
          onDone={() => setLoggingFor(null)}
          styles={styles}
        />
      ) : locationError ? (
        <EmptyState variant="fuel" title={locationError} />
      ) : isLoading || !coords ? (
        <SkeletonList />
      ) : error ? (
        <EmptyState
          variant="error"
          title={t('tollGates.mapDataUnavailable')}
          onRetry={refetch}
        />
      ) : (
        <FlatList
          showsVerticalScrollIndicator={false}
          data={tollGates ?? []}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            coords && (tollGates?.length ?? 0) > 0 ? (
              <NearbyPoiMap
                center={coords}
                points={tollGates ?? []}
                selectedId={selectedTollId}
                onSelectPoint={setSelectedTollId}
                height={200}
              />
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.tollCard, selectedTollId === item.id && styles.tollCardSelected]}
              onPress={() => setSelectedTollId(item.id)}
            >
              <View style={styles.tollIconWrap}>
                <Milestone color={colors.PRIMARY} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tollName}>{item.name}</Text>
                <View style={styles.tollMetaRow}>
                  <Navigation color={colors.TEXT_SECONDARY} size={12} />
                  <Text style={styles.tollMeta}>
                    {t('tollGates.kmAway', { km: item.distanceKm })}
                  </Text>
                </View>
              </View>
              <Pressable
                style={styles.logBtn}
                onPress={() => setLoggingFor(item)}
              >
                <Text style={styles.logBtnText}>
                  {t('tollGates.logToll')}
                </Text>
              </Pressable>
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState
              variant="fuel"
              title={t('tollGates.noTollGatesFound')}
            />
          }
        />
      )}
    </View>
  );
};

export default TollGatesScreen;




const LogTollForm = ({
  tollGate,
  onDone,
  styles,
}: {
  tollGate: TollGate;
  onDone: () => void;
  styles: ReturnType<typeof makeStyles>;
}) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const { mutate, isPending } = useLogFuelExpense();

  const handleSubmit = () => {
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      showToast(t('tollGates.enterValidAmount'), 'error');
      return;
    }
    mutate(
      {
        category: 'TOLL',
        stationName: tollGate.name,
        lat: tollGate.lat,
        lng: tollGate.lng,
        amount: amountNum,
      },
      {
        onSuccess: () => {
          showToast(t('tollGates.tollExpenseLogged'), 'success');
          onDone();
        },
        onError: () => showToast(t('tollGates.logExpenseFailed'), 'error'),
      },
    );
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.formStation}>{tollGate.name}</Text>
      <Text style={styles.formStationSub}>
        {t('tollGates.kmAway', { km: tollGate.distanceKm })}
      </Text>

      <AppTextInput
        label={t('tollGates.amountPaid')}
        value={amount}
        onChange={setAmount}
        keyboardType="numeric"
        placeholder={t('tollGates.amountPaidPlaceholder')}
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
    tollCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.SURFACE,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.BORDER,
    },
    tollCardSelected: {
      borderColor: colors.PRIMARY,
      backgroundColor: colors.PRIMARY_LIGHT,
    },
    tollIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: colors.PRIMARY_LIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tollName: {
      fontFamily: fonts.SEMI_BOLD_PRIMARY,
      fontSize: 14,
      color: colors.TEXT_PRIMARY,
    },
    tollMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    tollMeta: {
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
