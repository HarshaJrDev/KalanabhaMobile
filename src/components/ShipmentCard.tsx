// ShipmentCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Truck, Box, CheckCircle, Loader, MoreVertical } from 'lucide-react-native';
import FONTS from '@utils/fonts';
import { S } from '@utils/responsive';
import COLOR from '@utils/color';

export type ShipmentStatus = 'Order Placed' | 'Confirmed' | 'Shipped' | 'Delivered';

export interface ShipmentCardProps {
    from: string;
    to: string;
    shipmentType: 'truck' | 'box';
    status: ShipmentStatus;
    label?: string;
    date?: string;
    onPress?: () => void;
    onOptionsPress?: () => void;
}

const STATUS_COLORS: Record<ShipmentStatus, string> = {
    'Order Placed': COLOR.PRIMARY,
    Confirmed: COLOR.WARNING,
    Shipped: COLOR.WARNING,
    Delivered: COLOR.SUCCESS,
};

const ShipmentCard: React.FC<ShipmentCardProps> = ({
    from,
    to,
    shipmentType,
    status,
    label,
    date,
    onPress,
    onOptionsPress,
}) => {
    const IconComponent = shipmentType === 'truck' ? Truck : Box;

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
            {/* Top Row: Icon + Label + Options */}
            <View style={styles.topRow}>
                <View style={styles.row}>
                    <IconComponent color={COLOR.PRIMARY} width={24} height={24} />
                    {label && <Text style={styles.labelText}>{label}</Text>}
                </View>
                {onOptionsPress && (
                    <TouchableOpacity onPress={onOptionsPress}>
                        <MoreVertical color={COLOR.GRAY} width={20} height={20} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Addresses */}
            <View style={styles.addressContainer}>
                <View style={styles.addressColumn}>
                    <Text style={styles.addressLabel}>From</Text>
                    <Text style={styles.addressText}>{from}</Text>
                </View>
                <View style={styles.addressColumn}>
                    <Text style={styles.addressLabel}>To</Text>
                    <Text style={styles.addressText}>{to}</Text>
                </View>
            </View>

            {/* Status & Date */}
            <View style={styles.bottomRow}>
                <View style={styles.statusContainer}>
                    {status === 'Delivered' ? (
                        <CheckCircle color={STATUS_COLORS[status]} width={18} height={18} />
                    ) : (
                        <Loader color={STATUS_COLORS[status]} width={18} height={18} />
                    )}
                    <Text style={[styles.statusText, { color: STATUS_COLORS[status] }]}>{status}</Text>
                </View>
                {date && <Text style={styles.dateText}>{date}</Text>}
            </View>
        </TouchableOpacity>
    );
};

export default ShipmentCard;

const styles = StyleSheet.create({
    card: {
        padding: S(16),
        borderRadius: S(12),
        marginVertical: S(8),
        borderWidth: 0.5,
        borderColor: COLOR.GRAY,

    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: S(12),
    },
    labelText: {
        marginLeft: S(8),
        fontFamily: FONTS.MEDIUM_PRIMARY,
        fontSize: 14,
        color: COLOR.TEXT_SECONDARY,
    },
    addressContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: S(12),
    },
    addressColumn: {
        flex: 1,
    },
    addressLabel: {
        fontFamily: FONTS.MEDIUM_PRIMARY,
        fontSize: 12,
        color: COLOR.GRAY,
        marginBottom: S(2),
    },
    addressText: {
        fontFamily: FONTS.PRIMARY,
        fontSize: 14,
        color: COLOR.TEXT_SECONDARY,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        marginLeft: S(6),
        fontSize: 14,
        fontFamily: FONTS.MEDIUM_PRIMARY,
    },
    dateText: {
        fontSize: 12,
        fontFamily: FONTS.PRIMARY,
        color: COLOR.GRAY,
    },
});
