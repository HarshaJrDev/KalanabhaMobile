







import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { ScreenHeader } from '@components/ScreenHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { useAppTheme } from '@theme/ThemeContext';

const WebViewScreen = () => {
  const route = useRoute<any>();
  const { colors, fonts, spacing } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(
    () => makeStyles(colors, fonts, spacing, insets),
    [colors, fonts, spacing, insets],
  );
  const [loading, setLoading] = useState(true);

  const url: string = route.params?.url;
  const title: string = route.params?.title ?? '';

  return (
    <View style={styles.root}>
      <ScreenHeader title={title} />

      <WebView
        source={{ uri: url }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        // Android's WebView keeps its own on-disk HTTP cache,
        
        
        
        
        
        
        
        
        cacheEnabled={false}
        incognito
      />
      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      )}
    </View>
  );
};

export default WebViewScreen;

const makeStyles = (
  colors: ReturnType<typeof useAppTheme>['colors'],
  fonts: ReturnType<typeof useAppTheme>['fonts'],
  spacing: ReturnType<typeof useAppTheme>['spacing'],
  insets: { top: number },
) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.BACKGROUND },
    webview: { flex: 1 },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      top: insets.top + 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
