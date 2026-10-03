




import React from 'react';
import type { TextInputProps } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import AppTextInput from './ui/AppTextInput';

type CustomInputProps = Omit<TextInputProps, 'onChange'> & {
    leftIcon?: LucideIcon;
    rightIcon?: LucideIcon;
    onRightIconPress?: () => void;
    containerStyle?: object;
    isEnable?: boolean;
};

const CustomInput: React.FC<CustomInputProps> = (props) => (
    <AppTextInput variant="card" {...props} />
);

export default CustomInput;
