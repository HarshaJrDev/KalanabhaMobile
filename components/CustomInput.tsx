
import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { S } from '../utils/responsive';
import COLOR from '../utils/color';
import FONTS from '../utils/fonts';
import { LucideIcon } from 'lucide-react-native';

type CustomInputProps = TextInputProps & {
    leftIcon?: LucideIcon;
    rightIcon?: LucideIcon;
    onRightIconPress?: () => void;
    containerStyle?: object;
    isEnable?: boolean
};

const CustomInput: React.FC<CustomInputProps> = ({
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    isEnable: isEnable,
    onRightIconPress,
    containerStyle,
    ...textInputProps
}) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {LeftIcon && (
                <View style={styles.leftIcon}>
                    <LeftIcon width={20} height={20} color={COLOR.PRIMARY} />
                </View>
            )}
            <TextInput
                editable={isEnable}
                placeholderTextColor="#999"
                style={styles.input}
                {...textInputProps}
            />
            {RightIcon && (
                <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
                    <RightIcon width={20} height={20} color={COLOR.PRIMARY} />
                </TouchableOpacity>
            )}
        </View>
    );
};

export default CustomInput;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: S(10),
        paddingHorizontal: S(10),
        height: S(48),
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        width: '100%'
    },
    leftIcon: {
        marginRight: S(8),
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontFamily: FONTS.PRIMARY,
        color: '#000',
        width: '100%'
    },
    rightIcon: {
        marginLeft: S(8),
    },
});
