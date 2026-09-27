import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Shadows } from '../../theme/shadows';
import { VectorIcon } from '../common/VectorIcon';
import { NeonCard } from '../common/NeonCard';
import { useAppStore } from '../../store/useAppStore';

export const RemoteConnectCard: React.FC = () => {
  const { partnerIdInput, setPartnerIdInput, setActiveTab } = useAppStore();

  const handleConnect = () => {
    setActiveTab('remote');
  };

  return (
    <NeonCard style={styles.card}>
      <Text style={[Typography.bodyMedium, styles.title]}>
        Control Remote Device
      </Text>

      <View style={styles.inputRow}>
        <View style={styles.inputWrapper}>
          <VectorIcon name="keyboard" size={16} color={Colors.textGray} />
          <TextInput
            placeholder="Partner ID"
            placeholderTextColor={Colors.textGray}
            value={partnerIdInput}
            onChangeText={setPartnerIdInput}
            keyboardType="numeric"
            style={[Typography.monoText, styles.input]}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleConnect}
          style={[styles.arrowButton, Shadows.subtleNeon]}>
          <VectorIcon name="arrow-right" size={20} color="#000000" />
        </TouchableOpacity>
      </View>
    </NeonCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    marginTop: 14,
  },
  title: {
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.appBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  input: {
    flex: 1,
    color: Colors.textWhite,
    fontSize: 15,
  },
  arrowButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
