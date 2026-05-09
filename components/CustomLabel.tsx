
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import COLOR from '../utils/color';
import FONTS from '../utils/fonts';
import { S } from '../utils/responsive';

type CustomLabelProps = {
    label: string;
    required?: boolean;
    description?: string;
    style?: object;
};

const CustomLabel: React.FC<CustomLabelProps> = ({ label, required, description, style }) => {
    return (
        <View style={{ marginBottom: S(8) }}>
            <Text style={[styles.label, style]}>
                {label}
                {required && <Text style={styles.required}> *</Text>}
            </Text>
            {description && <Text style={styles.description}>{description}</Text>}
        </View>
    );
};

export default CustomLabel;

const styles = StyleSheet.create({
    label: {
        fontSize: 15,
        fontFamily: FONTS.MEDIUM_PRIMARY,
        color: COLOR.TEXT_SECONDARY || '#000',
    },
    required: {
        color: 'red',
        fontFamily: FONTS.PRIMARY,
    },
    description: {
        fontSize: 12,
        fontFamily: FONTS.SECONDARY,
        color: '#777',
        marginTop: S(2),
    },
});
