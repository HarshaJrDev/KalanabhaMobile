// Backward-compat shim — this file's implementation was extracted into
// src/components/ui/AppText.tsx (variant="label", matching this file's
// original visuals exactly) so text styling has one source of truth.
// Existing imports of `@components/CustomLabel` keep working unchanged;
// new code should import AppText from `@components/ui` directly.
import React from 'react';
import type { TextStyle } from 'react-native';
import AppText from './ui/AppText';

type CustomLabelProps = {
    label: string;
    required?: boolean;
    description?: string;
    style?: TextStyle;
};

const CustomLabel: React.FC<CustomLabelProps> = ({ label, required, description, style }) => (
    <AppText variant="label" required={required} description={description} style={style}>
        {label}
    </AppText>
);

export default CustomLabel;
