module.exports = {
  preset: 'react-native',
  
  
  
  
  
  
  
  
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-mmkv|@react-navigation|react-native-reanimated|react-native-gesture-handler|react-native-safe-area-context|react-native-linear-gradient|react-native-svg|react-native-image-picker|@shopify/flash-list)/)',
  ],
  
  
  setupFiles: [
    'react-native-gesture-handler/jestSetup',
  ],
  moduleNameMapper: {
    '^@react-native-community/netinfo$': '@react-native-community/netinfo/jest/netinfo-mock.js',
  },
};
