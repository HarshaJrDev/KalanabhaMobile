import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, GestureResponderEvent } from 'react-native';
import { Icon as LucideIcon } from 'lucide-react-native';
import FONTS from '@utils/fonts';

interface IconLabelProps {
    icon: keyof typeof import('lucide-react-native');
    label: string;
    color?: string;
    size?: number;
    onPress?: (event: GestureResponderEvent) => void;
}

const IconLabel: React.FC<IconLabelProps> = ({
    icon,
    label,
    color = '#111',
    size = 22,
    onPress,
}) => {
    const Icon = (require('lucide-react-native')[icon] as LucideIcon) || null;
    if (!Icon) return null;

    const Container = onPress ? TouchableOpacity : View;

    return (
        <Container
            style={styles.container}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <Icon size={size} color={color} />
            <Text style={[styles.label, { color }]}>{label}</Text>
        </Container>
    );
};

export default IconLabel;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    label: {
        fontSize: 16,
        fontFamily: FONTS.SEMI_BOLD_PRIMARY
    },
});
