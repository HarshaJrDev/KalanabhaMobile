





import React from 'react';
import type { ViewStyle } from 'react-native';
import AppButton from './ui/AppButton';

interface ButtonProps {
    title: string;
    onPress: () => void;
    backgroundColor?: string;
    textColor?: string;
    style?: ViewStyle;
}

const Button: React.FC<ButtonProps> = ({ title, onPress, backgroundColor, textColor, style }) => (
    <AppButton
        variant="legacy"
        title={title}
        onPress={onPress}
        backgroundColor={backgroundColor}
        textColor={textColor}
        style={style}
    />
);

export default Button;
