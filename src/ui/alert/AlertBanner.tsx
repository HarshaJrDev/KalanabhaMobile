import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import COLOR from '../../utils/color';
import { S } from '../../utils/responsive';
import FONTS from '../../utils/fonts';
import { AlertState } from './useAlert';

interface Props {
    alert: AlertState | null;
}

const AlertBanner = ({ alert }: Props) => {
    if (!alert) return null;

    return (
        <View style={[styles.container, styles[alert.type]]}>
            <Text style={styles.text}>{alert.message}</Text>
        </View>
    );
};

export default memo(AlertBanner);

const styles = StyleSheet.create({
    container: {
        padding: S(10),
        borderRadius: 8,
        marginTop: S(10),
    },
    text: {
        color: '#fff',
        fontFamily: FONTS.MEDIUM_PRIMARY,
    },
    error: {
        backgroundColor: '#E53935',
    },
    success: {
        backgroundColor: '#43A047',
    },
    info: {
        backgroundColor: '#1E88E5',
    },
});