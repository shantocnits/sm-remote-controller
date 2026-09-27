import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={tool.onPress}
      style={styles.touchable}>
      <NeonCard style={styles.card}>
        <View style={styles.iconCircle}>
          <VectorIcon name={tool.icon} size={22} color={tool.iconColor} />
        </View>
        <Text style={[Typography.bodyMedium, styles.title]}>{tool.title}</Text>
        <Text style={[Typography.caption, styles.subtitle]} numberOfLines={1}>
          {tool.subtitle}
        </Text>
      </NeonCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
    margin: 6,
  },
  card: {
    padding: 18,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.appBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  title: {
    color: Colors.textWhite,
    fontSize: 15,
    marginBottom: 2,
  },
  subtitle: {
    color: Colors.textGray,
    fontSize: 11,
  },
});
