// components/SectionCard.tsx
import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import COLOR from '@utils/color';
import { S } from '@utils/responsive';
import FONTS from '@utils/fonts';

interface SectionCardProps {
    title?: string;
    children: ReactNode;
    style?: ViewStyle;
    transparent?: boolean;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, children, style, transparent = false }) => {
    return (
        <View style={[styles.card, transparent && styles.transparentCard, style]}>
            {title && <Text style={styles.title}>{title}</Text>}
            {children}
        </View>
    );
};

export default SectionCard;

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        padding: S(15),
        marginBottom: S(15),

    },
    transparentCard: {
        backgroundColor: 'transparent',
        shadowOpacity: 0,
        elevation: 0,
    },
    title: {
        fontSize: 16,
        fontFamily: FONTS.BOLD_PRIMARY,
        marginBottom: S(10),
        color: COLOR.TEXT_SECONDARY,
    },
});
