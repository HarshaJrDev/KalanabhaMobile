// components/StatusBadge.tsx
import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import COLOR from '../utils/color';
import { S } from '../utils/responsive';
import FONTS from '../utils/fonts';

interface StatusBadgeProps {
    label: string;
    status?: 'success' | 'pending' | 'failed';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ label, status = 'success' }) => {
    const background =
        status === 'success'
            ? '#D4F5E9'
            : status === 'pending'
                ? '#FFF4D2'
                : '#FDDCDC';

    const color =
        status === 'success'
            ? '#1A8F4B'
            : status === 'pending'
                ? '#C29E00'
                : '#C23A2B';

    return (
        <View style={[styles.badge, { backgroundColor: background }]}>
            <Text style={[styles.text, { color }]}>{label}</Text>
        </View>
    );
};

export default StatusBadge;

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: S(10),
        paddingVertical: S(4),
        borderRadius: S(12),
    },
    text: {
        fontFamily: FONTS.MEDIUM_PRIMARY,
        fontSize: 13,
    },
});
