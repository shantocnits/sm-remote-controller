import { Platform, StyleSheet } from 'react-native';

const monospaceFont = Platform.select({
  ios: 'Courier',
  android: 'monospace',
  default: 'monospace',
});

export const Typography = StyleSheet.create({
  titleLarge: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  titleMedium: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bodyRegular: {
    fontSize: 14,
    fontWeight: '400',
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '600',
  },
  caption: {
    fontSize: 11,
    fontWeight: '500',
  },
  micro: {
    fontSize: 9,
    fontWeight: '400',
  },
  monoHeading: {
    fontFamily: monospaceFont,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 3,
  },
  monoText: {
    fontFamily: monospaceFont,
    fontSize: 13,
    fontWeight: '700',
  },
  monoTimer: {
    fontFamily: monospaceFont,
    fontSize: 12,
    fontWeight: '600',
  },
});
