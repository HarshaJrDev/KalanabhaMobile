// Backward-compat shim — this file was a near-duplicate of AppButton.tsx
// (same height/font, different radius/margin). Its exact look is now the
// "legacy" variant of the canonical src/components/ui/AppButton.tsx, so
// button styling has one source of truth instead of two. Existing imports
// of `@components/Button` keep working unchanged; new code should import
// AppButton from `@components/ui` directly.
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
