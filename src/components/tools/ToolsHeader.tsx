import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { VectorIcon } from '../common/VectorIcon';

interface ToolsHeaderProps {
  onSearchPress?: () => void;
}

export const ToolsHeader: React.FC<ToolsHeaderProps> = ({ onSearchPress }) => {
  return (
    <View style={styles.header}>
      <Text style={[Typography.titleLarge, styles.title]}>Device Tools</Text>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onSearchPress}
        style={styles.searchButton}>
        <VectorIcon name="search" size={18} color={Colors.textGray} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: Colors.textWhite,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
