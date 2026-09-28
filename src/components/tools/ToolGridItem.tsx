import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { VectorIcon, IconName } from '../common/VectorIcon';
import { NeonCard } from '../common/NeonCard';

export interface ToolItemData {
  id: string;
  title: string;
  subtitle: string;
  icon: IconName;
  iconColor: string;
  onPress: () => void;
}

interface ToolGridItemProps {
  tool: ToolItemData;
}

export const ToolGridItem: React.FC<ToolGridItemProps> = ({ tool }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  // On Mobile: 2 columns full width balance (48.5% width each)
  // On Tablet: 4 columns full width balance (23.5% width each)
  const itemWidth = isTablet ? '23.5%' : '48.5%';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={tool.onPress}
      style={[styles.touchable, { width: itemWidth }]}>
      <NeonCard style={styles.card}>
        <View style={[styles.iconCircle, { borderColor: tool.iconColor + '40' }]}>
          <VectorIcon name={tool.icon} size={22} color={tool.iconColor} />
        </View>
        <Text style={[Typography.bodyMedium, styles.title]} numberOfLines={1}>
          {tool.title}
        </Text>
        <Text style={[Typography.caption, styles.subtitle]} numberOfLines={2}>
          {tool.subtitle}
        </Text>
      </NeonCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    marginBottom: 14,
  },
  card: {
    padding: 18,
    minHeight: 155,
    justifyContent: 'flex-start',
    borderRadius: 24,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.appBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: Colors.borderDark,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    color: Colors.textWhite,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.textGray,
    fontSize: 11,
    lineHeight: 16,
  },
});
