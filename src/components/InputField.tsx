// Backward-compat shim — this file's implementation was extracted into
// src/components/ui/AppTextInput.tsx (variant="outline", matching this
// file's original visuals exactly) so input styling has one source of
// truth. Existing imports of `@components/InputField` keep working
// unchanged; new code should import AppTextInput from `@components/ui` directly.
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
