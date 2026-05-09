import React, { FC, memo } from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
} from 'react-native';

import COLOR from '../utils/color';
import FONTS from '../utils/fonts';
import { H } from '../utils/responsive';

interface Props {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
}

const AppButton: FC<Props> = ({
    title,
    onPress,
    loading = false,
    disabled = false,
    style,
}) => {
    const isDisabled = loading || disabled;

    return (
        <TouchableOpacity
            style={[
                styles.container,
                isDisabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.85}
        >
            {loading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.text}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

export default memo(AppButton);

const styles = StyleSheet.create({
    container: {
        height: H(50),
        backgroundColor: COLOR.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    disabled: {
        opacity: 0.6,
    },
    text: {
        color: '#fff',
        fontFamily: FONTS.BOLD_PRIMARY,
        fontSize: 16,
    },
});