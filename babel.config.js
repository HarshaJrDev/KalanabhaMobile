module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    '@babel/plugin-transform-export-namespace-from',
    // 'react-native-worklets/plugin',
    [
      'module-resolver',
      {
        root: ['.'],
        extensions: ['.ios.ts', '.android.ts', '.ts', '.ios.tsx', '.android.tsx', '.tsx', '.jsx', '.js', '.json'],
        alias: {
          // Target `src/`-based module boundaries. Each alias currently
          // points at wherever that folder physically lives today — some
          // are already under src/, others (Screens, components, features,
          // hooks, utils, ui) are being migrated there incrementally.
          // Moving a folder later means updating ONE line here, not every
          // file that imports it.
          '@app': '.',
          '@api': './src/api',
          '@config': './src/config',
          '@types': './src/types',
          '@validation': './src/validation',
          '@services': './src/services',
          '@location': './src/location',
          '@data': './src/data',
          // @deprecated boundary — src/shipment/ is a thin backward-compat
          // shim over features/shipments; new code should use @features/shipments directly.
          '@shipment': './src/shipment',
          '@features': './src/features',
          '@screens': './src/screens',
          '@navigation': './src/screens/navigation',
          '@components': './src/components',
          '@hooks': './src/hooks',
          '@utils': './src/utils',
          '@ui': './src/ui',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
