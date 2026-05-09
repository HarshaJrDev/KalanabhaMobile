// components/InfoRow.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CopyIcon, Package2 } from 'lucide-react-native';
import COLOR from '../utils/color';
import { S } from '../utils/responsive';
import FONTS from '../utils/fonts';

interface InfoRowProps {
    label?: string;
    value?: string;
    title?: string;
    subtitle?: string;
    copyable?: boolean;
    icon?: 'package';
    rightElement?: React.ReactNode;
    dotColor?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({
    label,
    value,
    title,
    subtitle,
    copyable,
    icon,
    rightElement,
    dotColor,
}) => {
    return (
        <View style={styles.row}>
            <View style={styles.leftContainer}>
                {icon && <Package2 size={28} color={COLOR.PRIMARY} style={styles.icon} />}
                {dotColor && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
                <View>
                    {label && <Text style={styles.label}>{label}</Text>}
                    {title && <Text style={styles.title}>{title}</Text>}
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>
            </View>
            <View style={styles.rightContainer}>
                {value && <Text style={styles.value}>{value}</Text>}
                {copyable && (
                    <TouchableOpacity>
                        <CopyIcon size={18} color={COLOR.PRIMARY} />
                    </TouchableOpacity>
                )}
                {rightElement}
            </View>
        </View>
    );
};

export default InfoRow;

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: S(12),
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: S(10),
    },
    dot: {
        width: S(8),
        height: S(8),
        borderRadius: 4,
        marginRight: S(12),
    },
    label: {
        fontSize: 13,
        fontFamily: FONTS.PRIMARY,
        color: COLOR.TEXT_SECONDARY,
    },
    title: {
        fontSize: 15,
        fontFamily: FONTS.MEDIUM_PRIMARY,
        color: COLOR.TEXT_SECONDARY,
    },
    subtitle: {
        fontSize: 12,
        fontFamily: FONTS.PRIMARY,
        color: COLOR.TEXT_SECONDARY,
    },
    value: {
        fontSize: 15,
        fontFamily: FONTS.MEDIUM_PRIMARY,
        color: COLOR.TEXT_SECONDARY,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: S(8),
    },
});
