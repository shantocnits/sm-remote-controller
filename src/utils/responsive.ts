import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Baseline mobile layout 375x812
const baseWidth = 375;
const baseHeight = 812;

export const isTablet = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) >= 600;

export function scaleWidth(size: number): number {
  return (SCREEN_WIDTH / baseWidth) * size;
}

export function scaleHeight(size: number): number {
  return (SCREEN_HEIGHT / baseHeight) * size;
}

export function moderateScale(size: number, factor = 0.5): number {
  return size + (scaleWidth(size) - size) * factor;
}

export const AppDimensions = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isTablet,
};
