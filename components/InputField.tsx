import React, {
    FC,
    memo,
    useState,
    forwardRef,
    useCallback,
} from 'react';
import {
    View,
    TextInput,
    Text,
    TouchableOpacity,
    StyleSheet,
    TextInputProps,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

import COLOR from '../utils/color';
import FONTS from '../utils/fonts';
import { H, S } from '../utils/responsive';

interface InputFieldProps extends Omit<TextInputProps, 'onChange'> {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    secure?: boolean;
}

const InputField: FC<InputFieldProps> = memo(
    forwardRef<TextInput, InputFieldProps>(
        ({ label, value, onChange, error, secure, style, ...rest }, ref) => {
            const [visible, setVisible] = useState<boolean>(false);

            const toggleVisibility = useCallback(() => {
                setVisible((p) => !p);
            }, []);

            const isSecure = secure && !visible;

            return (
                <View style={styles.wrapper}>
                    <Text style={styles.label}>{label}</Text>

                    <View
                        style={[
                            styles.inputContainer,
                            error && styles.errorBorder,
                        ]}
                    >
                        <TextInput
                            ref={ref}
                            style={[styles.input, style]}
                            value={value}
                            onChangeText={onChange}
                            secureTextEntry={isSecure}
                            placeholderTextColor="#999" // FIX: readable
                            autoCapitalize="none"
                            {...rest}
                        />

                        {secure && (
                            <TouchableOpacity
                                onPress={toggleVisibility}
                                hitSlop={HIT_SLOP}
                            >
                                {visible ? (
                                    <Eye size={20} color={COLOR.TEXT_SECONDARY} />
                                ) : (
                                    <EyeOff size={20} color={COLOR.TEXT_SECONDARY} />
                                )}
                            </TouchableOpacity>
                        )}
                    </View>

                    {!!error && <Text style={styles.errorText}>{error}</Text>}
                </View>
            );
        }
    )
);

export default InputField;

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

const styles = StyleSheet.create({
    wrapper: {
        gap: S(6), // FIX: remove margin leakage
    },
    label: {
        color: COLOR.TEXT_SECONDARY,
        fontSize: 14,
        fontFamily: FONTS.MEDIUM_PRIMARY,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        height: H(50),
        paddingHorizontal: S(12),
    },
    input: {
        flex: 1,
        color: COLOR.TEXT_SECONDARY,
        fontFamily: FONTS.PRIMARY,
        fontSize: 14,
    },
    errorBorder: {
        borderColor: '#E53935',
    },
    errorText: {
        color: '#E53935',
        fontSize: 12,
        fontFamily: FONTS.PRIMARY,
    },
});