import { Platform, StyleSheet } from 'react-native';
import { Colors } from './colors';

export const Shadows = StyleSheet.create({
  subtleNeon: {
    ...Platform.select({
      ios: {
        shadowColor: Colors.brandGreen,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  neonGlow: {
    ...Platform.select({
      ios: {
        shadowColor: Colors.brandGreen,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 14,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  pipShadow: {
    ...Platform.select({
      ios: {
        shadowColor: Colors.brandGreen,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  dangerGlow: {
    ...Platform.select({
      ios: {
        shadowColor: Colors.dangerRed,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});
