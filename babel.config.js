module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    '@babel/plugin-transform-export-namespace-from',
    
    [
      'module-resolver',
      {
        root: ['.'],
        extensions: ['.ios.ts', '.android.ts', '.ts', '.ios.tsx', '.android.tsx', '.tsx', '.jsx', '.js', '.json'],
        alias: {
          
          
          
          
          
          
          '@app': '.',
          '@api': './src/api',
          '@config': './src/config',
          '@theme': './src/theme',
          '@types': './src/types',
          '@validation': './src/validation',
          '@services': './src/services',
          '@location': './src/location',
          '@data': './src/data',
          
          
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
