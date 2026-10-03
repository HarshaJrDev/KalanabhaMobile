const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const {
  wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');

const { withSentryConfig } = require('@sentry/react-native/metro');

const defaultConfig = getDefaultConfig(__dirname);

const customConfig = {
  // keep empty unless you need overrides
};

const mergedConfig = mergeConfig(defaultConfig, customConfig);

// ✅ wrap AFTER merge
module.exports = withSentryConfig(wrapWithReanimatedMetroConfig(mergedConfig));
