




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
