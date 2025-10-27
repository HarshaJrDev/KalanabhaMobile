import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import COLOR from '../utils/color';
import FONTS from '../utils/fonts';
import { H } from '../utils/responsive';

interface ButtonProps {
    title: string;
    onPress: () => void;
    backgroundColor?: string;
    textColor?: string;
    style?: object;
}

const Button: React.FC<ButtonProps> = ({ title, onPress, backgroundColor, textColor, style }) => {
    return (
        <TouchableOpacity
            style={[styles.button, { backgroundColor: backgroundColor || COLOR.PRIMARY }, style]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Text style={[styles.text, { color: textColor || COLOR.TEXT_PRIMARY }]}>{title}</Text>
        </TouchableOpacity>
    );
};

export default Button;

const styles = StyleSheet.create({
    button: {
        height: H(50),
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    text: {
        fontSize: 16,
        fontFamily: FONTS.MEDIUM_PRIMARY,
    },
});
