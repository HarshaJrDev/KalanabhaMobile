




import React, { forwardRef, memo } from 'react';
import type { TextInput, TextInputProps } from 'react-native';
import AppTextInput from './ui/AppTextInput';

interface InputFieldProps extends Omit<TextInputProps, 'onChange'> {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    secure?: boolean;
}

const InputField = memo(
    forwardRef<TextInput, InputFieldProps>((props, ref) => (
        <AppTextInput ref={ref} variant="outline" {...props} />
    )),
);

export default InputField;
