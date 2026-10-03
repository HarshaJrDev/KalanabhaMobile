


















import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import COLOR from '@utils/color';
import { H, S } from '@utils/responsive';
import { ArrowLeft, Home, Package, Plus, Minus, ShieldCheck, Clock3, Route } from 'lucide-react-native';
import CustomLabel from '@components/CustomLabel';
import Button from '@components/Button';
import VehicleVisual from '@components/VehicleVisual';
import PlacePicker from '@components/PlacePicker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import FONTS from '@utils/fonts';
import { useFareEstimate } from '../../location/useFareEstimate';
import { useServiceAreas, useVehicleConfigs } from '@features/settings/hooks';
import type { ServiceArea } from '@features/settings/types';
import { useTranslation } from 'react-i18next';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CheckRate'>;
type ShipmentCategory = 'PARCEL' | 'HOUSE_SHIFTING';

const CheckRate = () => {
    const navigation = useNavigation<NavigationProp>();
    const { t } = useTranslation();
    const [pickupPlace, setPickupPlace] = useState<ServiceArea | null>(null);
    const [dropPlace, setDropPlace] = useState<ServiceArea | null>(null);
    const [category, setCategory] = useState<ShipmentCategory>('PARCEL');
    const [helpersCount, setHelpersCount] = useState(1);
    const [vehicleType, setVehicleType] = useState('');

    const { data: serviceAreasData, isLoading: serviceAreasLoading } = useServiceAreas();
    const activeServiceAreas = useMemo(
        () => (serviceAreasData ?? []).filter((area) => area.active),
        [serviceAreasData],
    );

    // Real, admin-managed vehicle types (GET /settings/vehicle-configs) —
    // was a hardcoded bike/van/truck array with made-up weight-limit copy.
    const { data: vehicleConfigsData, isLoading: vehiclesLoading } = useVehicleConfigs();
    const activeVehicleConfigs = useMemo(() => {
        const active = (vehicleConfigsData ?? []).filter((v) => v.active);
        return category === 'HOUSE_SHIFTING'
            ? active.filter((v) => !v.name.toLowerCase().includes('bike'))
            : active;
    }, [vehicleConfigsData, category]);

    
    
    useEffect(() => {
        if (activeVehicleConfigs.length === 0) return;
        const stillAvailable = activeVehicleConfigs.some((v) => v.name.toLowerCase() === vehicleType);
        if (!vehicleType || !stillAvailable) {
            setVehicleType(activeVehicleConfigs[0].name.toLowerCase());
        }
    }, [vehicleType, activeVehicleConfigs]);

    const pickup = pickupPlace ? `${pickupPlace.name}, ${pickupPlace.city}` : '';
    const drop = dropPlace ? `${dropPlace.name}, ${dropPlace.city}` : '';
    const selectedVehicle = activeVehicleConfigs.find((v) => v.name.toLowerCase() === vehicleType);

    // Quote-only — 'standard' is a stand-in serviceType since this screen
    
    
    const fareEstimate = useFareEstimate(
        pickup,
        drop,
        vehicleType,
        'standard',
        pickupPlace ? { lat: pickupPlace.lat, lng: pickupPlace.lng } : null,
        dropPlace ? { lat: dropPlace.lat, lng: dropPlace.lng } : null,
        category,
        category === 'HOUSE_SHIFTING' ? helpersCount : undefined,
    );

    const swapLocations = () => {
        setPickupPlace(dropPlace);
        setDropPlace(pickupPlace);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('checkRate.title')}</Text>
            </View>

            <ScrollView
                style={styles.formWrapper}
                contentContainerStyle={styles.formContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.heroCard}>
                    <View style={styles.heroIcon}>
                        <Route color={COLOR.PRIMARY} size={22} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.heroTitle}>Plan your price before booking</Text>
                        <Text style={styles.heroSub}>Pick serviceable localities, vehicle, and service type to preview the real admin rate.</Text>
                    </View>
                </View>

                <View>
                    <CustomLabel label="Service" required />
                    <View style={styles.segmentRow}>
                        {([
                            { key: 'PARCEL', label: 'Parcel', icon: Package },
                            { key: 'HOUSE_SHIFTING', label: 'House shifting', icon: Home },
                        ] as const).map((item) => {
                            const selected = category === item.key;
                            const Icon = item.icon;
                            return (
                                <TouchableOpacity
                                    key={item.key}
                                    style={[styles.segmentButton, selected && styles.segmentButtonSelected]}
                                    onPress={() => setCategory(item.key)}
                                >
                                    <Icon size={16} color={selected ? COLOR.PRIMARY : '#6B7280'} />
                                    <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{item.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    {serviceAreasLoading ? (
                        <View style={styles.locationLoadingCard}>
                            <ActivityIndicator color={COLOR.PRIMARY} size="small" />
                            <Text style={styles.resultLoadingText}>Loading locations…</Text>
                        </View>
                    ) : null}
                    <PlacePicker
                        label={t('checkRate.pickupLocation')}
                        value={pickupPlace}
                        areas={activeServiceAreas}
                        onSelect={setPickupPlace}
                        placeholder="Select pickup locality"
                    />
                    <TouchableOpacity style={styles.swapButton} onPress={swapLocations} disabled={!pickupPlace && !dropPlace}>
                        <Text style={styles.swapButtonText}>Swap pickup and drop</Text>
                    </TouchableOpacity>
                    <PlacePicker
                        label={t('checkRate.packageDestination')}
                        value={dropPlace}
                        areas={activeServiceAreas}
                        onSelect={setDropPlace}
                        placeholder="Select destination locality"
                    />
                </View>

                <View>
                    <CustomLabel label={t('checkRate.vehicleType')} required />
                    {vehiclesLoading ? (
                        <View style={styles.vehicleLoadingRow}>
                            <ActivityIndicator color={COLOR.PRIMARY} size="small" />
                        </View>
                    ) : (
                        <View style={styles.vehicleRow}>
                            {activeVehicleConfigs.map((vt) => {
                                const selected = vehicleType === vt.name.toLowerCase();
                                return (
                                    <TouchableOpacity
                                        key={vt.id}
                                        style={[styles.vehicleCard, selected && styles.vehicleCardSelected]}
                                        onPress={() => setVehicleType(vt.name.toLowerCase())}
                                    >
                                        <VehicleVisual
                                            vehicle={vt}
                                            size={44}
                                            iconSize={22}
                                            borderRadius={12}
                                            backgroundColor={selected ? '#EFF6FF' : '#F3F4F6'}
                                            iconColor={selected ? COLOR.PRIMARY : '#6B7280'}
                                        />
                                        <Text style={[styles.vehicleLabel, selected && styles.vehicleLabelSelected]}>
                                            {vt.name}
                                        </Text>
                                        <Text style={styles.vehicleDesc}>{t('checkRate.upToKg', { weight: vt.maxWeight })}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>

                {category === 'HOUSE_SHIFTING' && (
                    <View style={styles.helperCard}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.helperTitle}>Loading helpers</Text>
                            <Text style={styles.helperSub}>House shifting uses van/truck and adds helper charges in the quote.</Text>
                        </View>
                        <View style={styles.stepper}>
                            <TouchableOpacity
                                style={[styles.stepperBtn, helpersCount <= 1 && styles.stepperBtnDisabled]}
                                disabled={helpersCount <= 1}
                                onPress={() => setHelpersCount((v) => Math.max(1, v - 1))}
                            >
                                <Minus size={16} color={helpersCount <= 1 ? '#9CA3AF' : COLOR.PRIMARY} />
                            </TouchableOpacity>
                            <Text style={styles.stepperValue}>{helpersCount}</Text>
                            <TouchableOpacity
                                style={[styles.stepperBtn, helpersCount >= 4 && styles.stepperBtnDisabled]}
                                disabled={helpersCount >= 4}
                                onPress={() => setHelpersCount((v) => Math.min(4, v + 1))}
                            >
                                <Plus size={16} color={helpersCount >= 4 ? '#9CA3AF' : COLOR.PRIMARY} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {fareEstimate.loading && (
                    <View style={styles.resultCard}>
                        <ActivityIndicator color={COLOR.PRIMARY} />
                        <Text style={styles.resultLoadingText}>{t('checkRate.calculatingRate')}</Text>
                    </View>
                )}

                {!fareEstimate.loading && fareEstimate.error && (
                    <View style={styles.resultCard}>
                        <Text style={styles.errorText}>{fareEstimate.error}</Text>
                    </View>
                )}

                {!fareEstimate.loading && !fareEstimate.error && fareEstimate.price != null && (
                    <View style={styles.resultCard}>
                        <Text style={styles.resultLabel}>{t('checkRate.estimatedRate')}</Text>
                        <Text style={styles.resultPrice}>₹{fareEstimate.price}</Text>
                        <Text style={styles.resultDistance}>
                            {fareEstimate.distanceKm} km · {selectedVehicle?.name}
                        </Text>
                        <View style={styles.breakdown}>
                            {/* Was a fabricated distance*4 formula — now the
                                same real OSRM driving-route estimate the
                                booking flow and live tracking both use.
                                Hidden (not shown with a fake number) if the
                                routing service doesn't respond. */}
                            {fareEstimate.etaMinutes != null && (
                                <View style={styles.breakdownRow}>
                                    <Clock3 size={14} color="#6B7280" />
                                    <Text style={styles.breakdownText}>Estimated delivery: ~{fareEstimate.etaMinutes} min</Text>
                                </View>
                            )}
                            <View style={styles.breakdownRow}>
                                <ShieldCheck size={14} color="#6B7280" />
                                <Text style={styles.breakdownText}>Includes OTP proof and live tracking</Text>
                            </View>
                            {category === 'HOUSE_SHIFTING' && fareEstimate.helperCost != null && (
                                <View style={styles.breakdownRow}>
                                    <Home size={14} color="#6B7280" />
                                    <Text style={styles.breakdownText}>{helpersCount} helper charge: ₹{fareEstimate.helperCost}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.buttonWrapper}>
                            <Button
                                title={t('checkRate.bookThisShipment')}
                                onPress={() =>
                                    (navigation as any).navigate('addOrder', {
                                        prefill: { pickup, drop, vehicleType, category },
                                    })
                                }
                            />
                        </View>
                    </View>
                )}

                {!pickup.trim() || !drop.trim() ? (
                    <Text style={styles.hint}>{t('checkRate.enterBothHint')}</Text>
                ) : null}
            </ScrollView>
        </View>
    );
};

export default CheckRate;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fb',
    },
    header: {
        backgroundColor: COLOR.PRIMARY,
        height: H(140),
        borderBottomLeftRadius: S(15),
        borderBottomRightRadius: S(15),
        paddingHorizontal: S(15),
        paddingTop: S(40),
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        padding: S(5),
        marginRight: S(10),
    },
    headerTitle: {
        fontSize: 20,
        color: '#fff',
        fontFamily: FONTS.PRIMARY
    },
    formWrapper: {
        flex: 1,
        marginTop: -S(30), 
    },
    formContent: {
        paddingHorizontal: S(15),
        paddingTop: S(25),
        paddingBottom: S(40),
        rowGap: S(20),
        backgroundColor: '#fff',
        borderTopLeftRadius: S(20),
        borderTopRightRadius: S(20),
        minHeight: '100%',
    },
    heroCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: S(12),
        padding: S(14),
        borderRadius: S(16),
        backgroundColor: '#FFF7ED',
        borderWidth: 1,
        borderColor: '#FED7AA',
    },
    heroIcon: {
        width: S(44),
        height: S(44),
        borderRadius: S(14),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    heroTitle: {
        fontSize: 15,
        fontFamily: FONTS.BOLD_PRIMARY,
        color: '#111827',
    },
    heroSub: {
        marginTop: 3,
        fontSize: 12,
        lineHeight: 17,
        color: '#6B7280',
    },
    segmentRow: {
        flexDirection: 'row',
        gap: S(10),
        marginTop: S(8),
    },
    segmentButton: {
        flex: 1,
        minHeight: S(46),
        borderRadius: S(12),
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: S(7),
        paddingHorizontal: S(10),
    },
    segmentButtonSelected: {
        borderColor: COLOR.PRIMARY,
        backgroundColor: '#FFF7ED',
    },
    segmentText: {
        fontSize: 12,
        fontFamily: FONTS.SEMI_BOLD_PRIMARY,
        color: '#6B7280',
    },
    segmentTextSelected: {
        color: COLOR.PRIMARY,
    },
    inputGroup: {
        rowGap: S(15),
    },
    locationLoadingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: S(8),
        backgroundColor: '#F9FAFB',
        borderRadius: S(12),
        padding: S(12),
    },
    swapButton: {
        alignSelf: 'center',
        paddingHorizontal: S(12),
        paddingVertical: S(8),
        borderRadius: S(999),
        backgroundColor: '#F3F4F6',
    },
    swapButtonText: {
        fontSize: 12,
        fontFamily: FONTS.SEMI_BOLD_PRIMARY,
        color: '#4B5563',
    },
    vehicleRow: {
        flexDirection: 'row',
        gap: S(10),
        marginTop: S(8),
    },
    vehicleLoadingRow: {
        marginTop: S(8),
        paddingVertical: S(20),
        alignItems: 'center',
    },
    vehicleCard: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
        paddingVertical: S(14),
        borderRadius: S(12),
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
    },
    vehicleCardSelected: {
        borderColor: COLOR.PRIMARY,
        backgroundColor: '#EFF6FF',
    },
    vehicleLabel: {
        fontSize: 13,
        fontFamily: FONTS.BOLD_PRIMARY,
        color: '#111827',
    },
    vehicleLabelSelected: {
        color: COLOR.PRIMARY,
    },
    vehicleDesc: {
        fontSize: 10,
        color: '#9CA3AF',
    },
    helperCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: S(12),
        backgroundColor: '#F9FAFB',
        borderRadius: S(14),
        padding: S(14),
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    helperTitle: {
        fontSize: 14,
        fontFamily: FONTS.BOLD_PRIMARY,
        color: '#111827',
    },
    helperSub: {
        marginTop: 3,
        fontSize: 11,
        lineHeight: 15,
        color: '#6B7280',
    },
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: S(12),
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
    },
    stepperBtn: {
        width: S(34),
        height: S(34),
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperBtnDisabled: {
        backgroundColor: '#F3F4F6',
    },
    stepperValue: {
        width: S(34),
        textAlign: 'center',
        fontSize: 14,
        fontFamily: FONTS.BOLD_PRIMARY,
        color: '#111827',
    },
    resultCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: S(14),
        padding: S(16),
        alignItems: 'center',
        gap: 4,
    },
    resultLoadingText: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 6,
    },
    resultLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    resultPrice: {
        fontSize: 28,
        fontFamily: FONTS.BOLD_PRIMARY,
        color: '#111827',
    },
    resultDistance: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 8,
    },
    breakdown: {
        alignSelf: 'stretch',
        gap: S(8),
        marginTop: S(8),
        paddingTop: S(10),
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    breakdownRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: S(7),
    },
    breakdownText: {
        flex: 1,
        fontSize: 12,
        color: '#6B7280',
    },
    errorText: {
        fontSize: 13,
        color: '#DC2626',
        textAlign: 'center',
    },
    hint: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    buttonWrapper: {
        marginTop: S(10),
        alignSelf: 'stretch',
    },
});
