// Global reusable UI component system — the single source of truth for
// common UI behavior/styling. Screens should import from here (or via the
// `@components/ui` alias) rather than reaching into utils/color, utils/fonts,
// or re-implementing a button/input/loader/alert locally.
export { default as AppText, type AppTextProps, type AppTextVariant } from './AppText';
export { default as AppTextInput, type AppTextInputProps, type AppTextInputVariant } from './AppTextInput';
export { default as AppButton, type AppButtonProps } from './AppButton';
export { default as AppIcon, type AppIconProps } from './AppIcon';
export { default as AppImage, type AppImageProps } from './AppImage';
export { default as AppLoader, type AppLoaderProps } from './AppLoader';
export * from './AppAlert';
export * as theme from '@config/theme';
