import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
    label: string;
}

export const Chip: React.FC<Props> = memo(({ label }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>{label}</Text>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    text: {
        fontSize: 11,
        fontWeight: '600',
    },
});