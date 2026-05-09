// components/KeyValueRow.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import COLOR from '../utils/color';
import { S } from '../utils/responsive';
import FONTS from '../utils/fonts';

interface KeyValueRowProps {
    left: string;
    right: string;
    bold?: boolean;
}

const KeyValueRow: React.FC<KeyValueRowProps> = ({ left, right, bold = false }) => {
    return (
        <View style={styles.row}>
            <Text style={[styles.leftText, bold && styles.boldText]}>{left}</Text>
            <Text style={[styles.rightText, bold && styles.boldText]}>{right}</Text>
        </View>
    );
};

export default KeyValueRow;

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: S(8),
    },
    leftText: {
        fontSize: 14,
        fontFamily: FONTS.PRIMARY,
        color: COLOR.TEXT_SECONDARY,
    },
    rightText: {
        fontSize: 14,
        fontFamily: FONTS.PRIMARY,
        color: COLOR.TEXT_SECONDARY,
    },
    boldText: {
        fontFamily: FONTS.BOLD_PRIMARY,
        fontSize: 16,
    },
});
