import React, { FC, useState } from 'react';
import { Image, ImageProps, ActivityIndicator, View, StyleSheet } from 'react-native';
import { colors } from '@config/theme';

export interface AppImageProps extends ImageProps {
    /** Shows a small centered spinner over the image area while it loads. Off by default — existing screens render Image with no loader today. */
    showLoader?: boolean;
}

/**
 * Thin wrapper around RN's Image. Existing screens set `resizeMode`
 * per-usage (mixes of "contain"/"cover") — this doesn't force one, it just
 * gives future screens one import for the common "network image with a
 * loading spinner" case instead of each screen re-implementing it.
 */
const AppImage: FC<AppImageProps> = ({ showLoader, style, onLoadStart, onLoadEnd, ...rest }) => {
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
