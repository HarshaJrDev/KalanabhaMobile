import { Dimensions, PixelRatio } from 'react-native';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;
const scaleWidth = SCREEN_WIDTH / BASE_WIDTH;
const scaleHeight = SCREEN_HEIGHT / BASE_HEIGHT;
export const W = (size: number): number => size * scaleWidth;
export const H = (size: number): number => size * scaleHeight;
export const F = (size: number): number =>
  size * Math.min(scaleWidth, scaleHeight);
export const RF = (size: number): number =>
  PixelRatio.roundToNearestPixel(F(size));
export const S = (size: number): number => W(size);
