import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Shadows } from '../../theme/shadows';
import { VectorIcon, IconName } from '../common/VectorIcon';

interface NavButtonProps {
  label: string;
  icon: IconName;
  isActive: boolean;
  onPress: () => void;
}

export const NavButton: React.FC<NavButtonProps> = ({
  label,
  icon,
  isActive,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.container,
        isActive ? [styles.activeContainer, Shadows.subtleNeon] : styles.inactiveContainer,
      ]}>
      <VectorIcon
        name={icon}
        size={18}
        color={isActive ? '#000000' : Colors.textGray}
      />
      {isActive && (
        <Text style={[Typography.bodyMedium, styles.activeLabel]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  activeContainer: {
    backgroundColor: Colors.brandGreen,
  },
  inactiveContainer: {
    backgroundColor: 'transparent',
  },
  activeLabel: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 13,
  },
});
