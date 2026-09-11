module.exports = {
  preset: 'react-native',
  // The react-native preset's default transformIgnorePatterns excludes all
  // of node_modules, but several real dependencies (react-native-mmkv,
  // @react-navigation/*, and others in this app) ship untranspiled ESM
  // ("export { ... } from ...") that Jest can't parse without going
  // through Babel first — this was breaking every test that imports
  // App.tsx transitively (any component importing services/storage or
  // navigation), including the default __tests__/App.test.tsx, before any
  // real test suite existed to notice.
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-mmkv|@react-navigation|react-native-reanimated|react-native-gesture-handler|react-native-safe-area-context|react-native-linear-gradient|react-native-svg|react-native-image-picker|@shopify/flash-list)/)',
  ],
  // Official setup shims for native modules these libraries expect —
  // documented by each library itself, not something specific to this app.
  setupFiles: [
    'react-native-gesture-handler/jestSetup',
  ],
  moduleNameMapper: {
    '^@react-native-community/netinfo$': '@react-native-community/netinfo/jest/netinfo-mock.js',
  },
};
