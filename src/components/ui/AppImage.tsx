import React, { FC, useState } from 'react';
import { Image, ImageProps, ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAppTheme } from '@theme/ThemeContext';

export interface AppImageProps extends ImageProps {
        showLoader?: boolean;
}

const AppImage: FC<AppImageProps> = ({ showLoader, style, onLoadStart, onLoadEnd, ...rest }) => {
    const { colors } = useAppTheme();
    const [loading, setLoading] = useState(false);

    if (!showLoader) {
        return <Image style={style} {...rest} />;
    }

    return (
        <View style={style}>
            <Image
                style={StyleSheet.absoluteFillObject}
                onLoadStart={() => {
                    setLoading(true);
                    onLoadStart?.();
                }}
                onLoadEnd={() => {
                    setLoading(false);
                    onLoadEnd?.();
                }}
                {...rest}
            />
            {loading && (
                <View style={styles.loaderOverlay}>
                    <ActivityIndicator color={colors.PRIMARY} />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    loaderOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});

export default AppImage;
