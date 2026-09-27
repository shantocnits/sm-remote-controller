import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Shadows } from '../../theme/shadows';
import { VectorIcon } from './VectorIcon';
import { useAppStore } from '../../store/useAppStore';

export const Header: React.FC = () => {
  const { toggleModeDropdown, isModeDropdownOpen } = useAppStore();
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.9,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [glowAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={[Typography.titleLarge, styles.title]}>
          SM <Text style={styles.brandAccent}>CONTROLLER</Text>
        </Text>
        <Text style={[Typography.caption, styles.developerText]}>
          dev: Khandaker shanto
        </Text>
        <Text style={[Typography.micro, styles.versionText]}>Version 1.0.0</Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={toggleModeDropdown}
        style={[
          styles.menuButton,
          Shadows.neonGlow,
          isModeDropdownOpen && styles.menuButtonActive,
        ]}>
        <VectorIcon name="bars" size={20} color={Colors.brandGreen} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 10,
    zIndex: 50,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: Colors.textWhite,
  },
  brandAccent: {
    color: Colors.brandGreen,
  },
  developerText: {
    color: Colors.brandGreen,
    marginTop: 3,
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  versionText: {
    color: Colors.textGray,
    marginTop: 2,
  },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.brandGreenBorder,
  },
  menuButtonActive: {
    backgroundColor: Colors.cardBgLight,
    borderColor: Colors.brandGreen,
  },
});
