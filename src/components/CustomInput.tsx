// Backward-compat shim — this file's implementation was extracted into
// src/components/ui/AppTextInput.tsx (variant="card", matching this file's
// original visuals exactly) so input styling has one source of truth.
// Existing imports of `@components/CustomInput` keep working unchanged;
// new code should import AppTextInput from `@components/ui` directly.
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
