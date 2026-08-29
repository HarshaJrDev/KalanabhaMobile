// CheckRate.tsx
//
// Was a fully unbound form: pickup/destination CustomInputs had no
// value/onChangeText, "Shipment Type" offered fake Air/Sea/Road categories
// that don't map to any real backend vehicle type, and "Check" always
// opened ShipmentResultModal with a hardcoded Bangalore->Delhi/3-truck-price
// result regardless of what (if anything) was typed.
//
// Rebuilt to reuse the exact same real pieces addOrders.tsx already uses:
// useAutoAddress (current-location convenience) and useFareEstimate (typed
// address -> geocode -> POST /shipments/quote, the same PricingService the
// real booking flow prices through), with the real Bike/Van/Truck vehicle
// types (VehicleConfig rows) instead of the fake Air/Sea/Road categories.
// "Check Rate" is quote-only — it does not create a shipment; a real quote
// hands off into the existing addOrders flow.
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import COLOR from '@utils/color';
import { H, S } from '@utils/responsive';
import CustomInput from '@components/CustomInput';
import { LocateFixedIcon, ArrowLeft, Bike, Car, Truck } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import CustomLabel from '@components/CustomLabel';
import Button from '@components/Button';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import FONTS from '@utils/fonts';
import { useAutoAddress } from '../../location/useAutoAddress';
import { useFareEstimate } from '../../location/useFareEstimate';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CheckRate'>;

// Same real vehicle types/config rows as addOrders.tsx's VEHICLE_TYPES —
// these are what PricingService.quote() actually prices against
// (kalanabhaBackend VehicleConfig: Bike/Van/Truck), not "shipment types".
const VEHICLE_TYPES: { key: string; label: string; icon: LucideIcon; desc: string }[] = [
    { key: 'bike', label: 'Bike', icon: Bike, desc: 'Up to 20 kg' },
    { key: 'van', label: 'Van', icon: Car, desc: 'Up to 500 kg' },
    { key: 'truck', label: 'Truck', icon: Truck, desc: 'Up to 5000 kg' },
];

const CheckRate = () => {
    const navigation = useNavigation<NavigationProp>();
    const { getAddress } = useAutoAddress();

    const [pickup, setPickup] = useState('');
    const [drop, setDrop] = useState('');
    const [vehicleType, setVehicleType] = useState('bike');

    // Quote-only — 'standard' is a stand-in serviceType since this screen
    // doesn't ask for one; addOrders.tsx's own step lets the user actually
    // pick express/same-day before booking.
    const fareEstimate = useFareEstimate(pickup, drop, vehicleType, 'standard');

    const useCurrentLocationFor = (setter: (addr: string) => void) => {
        getAddress((addr) => setter(addr));
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Check Rate</Text>
            </View>

            <ScrollView
                style={styles.formWrapper}
                contentContainerStyle={styles.formContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.inputGroup}>
                    <CustomInput
                        placeholder="Pick up Location"
                        value={pickup}
                        onChangeText={setPickup}
                        rightIcon={LocateFixedIcon}
                        onRightIconPress={() => useCurrentLocationFor(setPickup)}
                    />
                    <CustomInput
                        placeholder="Package Destination"
                        value={drop}
                        onChangeText={setDrop}
                        rightIcon={LocateFixedIcon}
                        onRightIconPress={() => useCurrentLocationFor(setDrop)}
                    />
                </View>

                <View>
                    <CustomLabel label="Vehicle Type" required />
                    <View style={styles.vehicleRow}>
                        {VEHICLE_TYPES.map((vt) => {
                            const Icon = vt.icon;
                            const selected = vehicleType === vt.key;
                            return (
                                <TouchableOpacity
                                    key={vt.key}
                                    style={[styles.vehicleCard, selected && styles.vehicleCardSelected]}
                                    onPress={() => setVehicleType(vt.key)}
                                >
                                    <Icon color={selected ? COLOR.PRIMARY : '#6B7280'} size={22} />
                                    <Text style={[styles.vehicleLabel, selected && styles.vehicleLabelSelected]}>
                                        {vt.label}
                                    </Text>
                                    <Text style={styles.vehicleDesc}>{vt.desc}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {fareEstimate.loading && (
                    <View style={styles.resultCard}>
                        <ActivityIndicator color={COLOR.PRIMARY} />
                        <Text style={styles.resultLoadingText}>Calculating rate…</Text>
                    </View>
                )}

                {!fareEstimate.loading && fareEstimate.error && (
                    <View style={styles.resultCard}>
                        <Text style={styles.errorText}>{fareEstimate.error}</Text>
                    </View>
                )}

                {!fareEstimate.loading && !fareEstimate.error && fareEstimate.price != null && (
                    <View style={styles.resultCard}>
                        <Text style={styles.resultLabel}>Estimated Rate</Text>
                        <Text style={styles.resultPrice}>₹{fareEstimate.price}</Text>
                        <Text style={styles.resultDistance}>
                            {fareEstimate.distanceKm} km · {VEHICLE_TYPES.find((v) => v.key === vehicleType)?.label}
                        </Text>

                        <View style={styles.buttonWrapper}>
                            <Button
                                title="Book This Shipment"
                                onPress={() =>
                                    (navigation as any).navigate('addOrder', {
                                        prefill: { pickup, drop, vehicleType },
                                    })
                                }
                            />
                        </View>
                    </View>
                )}

                {!pickup.trim() || !drop.trim() ? (
                    <Text style={styles.hint}>Enter both a pickup and destination to see a rate.</Text>
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
        marginTop: -S(30), // overlap effect
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
    inputGroup: {
        rowGap: S(15),
    },
    vehicleRow: {
        flexDirection: 'row',
        gap: S(10),
        marginTop: S(8),
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
        fontWeight: '700',
        color: '#111827',
    },
    vehicleLabelSelected: {
        color: COLOR.PRIMARY,
    },
    vehicleDesc: {
        fontSize: 10,
        color: '#9CA3AF',
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
        fontWeight: '800',
        color: '#111827',
    },
    resultDistance: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 8,
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
