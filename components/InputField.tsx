import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import COLOR from '../utils/color';
import FONTS from '../utils/fonts';
import { H, S } from '../utils/responsive';

interface InputFieldProps {
    label: string;
    placeholder: string;
    secure?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ label, placeholder, secure }) => {
    const [value, setValue] = useState('');
    const [showPassword, setShowPassword] = useState(!secure);

    return (
        <View style={{ marginTop: H(20) }}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={COLOR.BACKGROUND}

                    value={value}
                    onChangeText={setValue}
                    secureTextEntry={secure && !showPassword}
                />
                {secure && (
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? <Eye color={COLOR.BACKGROUND} width={20} height={20} /> : <EyeOff color={COLOR.TEXT_SECONDARY} width={20} height={20} />}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default InputField;

const styles = StyleSheet.create({
    label: {
        color: COLOR.TEXT_SECONDARY,
        fontSize: 16,
        fontFamily: FONTS.MEDIUM_PRIMARY,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLOR.BACKGROUND,
        borderRadius: 5,
        height: H(50),
        paddingHorizontal: S(10),
        marginTop: S(10),
    },
    input: {
        flex: 1,
        color: COLOR.TEXT_SECONDARY,
        fontFamily: FONTS.PRIMARY,
    },
});
