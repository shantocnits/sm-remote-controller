import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Keyboard } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Shadows } from '../../theme/shadows';
import { VectorIcon } from '../common/VectorIcon';
import { NeonCard } from '../common/NeonCard';
import { useAppStore } from '../../store/useAppStore';
import { getClipboardText } from '../../utils/deviceUtils';

export const RemoteConnectCard: React.FC = () => {
  const connectToPartner = useAppStore((state) => state.connectToPartner);
  const [partnerId, setPartnerId] = useState('');

  const handleConnect = () => {
    const cleanId = partnerId.replace(/[^0-9]/g, '');
    if (!cleanId || cleanId.length < 3) {
      Alert.alert('Partner ID Required', 'Please enter a valid 6-digit Partner ID to connect.');
      return;
    }
    Keyboard.dismiss();
    connectToPartner(cleanId);
  };

  const handlePasteClipboard = async () => {
    const text = await getClipboardText();
    if (text) {
      const clean = text.replace(/[^0-9]/g, '').trim();
      setPartnerId(clean || text.trim());
    }
  };

  return (
    <NeonCard style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={[Typography.bodyMedium, styles.title]}>
          Control Remote Device
        </Text>
        <TouchableOpacity activeOpacity={0.7} onPress={handlePasteClipboard}>
          <Text style={styles.pasteText}>Paste</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputWrapper}>
          <VectorIcon name="keyboard" size={16} color={Colors.textGray} />
          <TextInput
            placeholder="Partner ID"
            placeholderTextColor={Colors.textGray}
            value={partnerId}
            onChangeText={setPartnerId}
            keyboardType="number-pad"
            returnKeyType="go"
            onSubmitEditing={handleConnect}
            blurOnSubmit={false}
            autoCorrect={false}
            autoCapitalize="none"
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: Colors.textSecondary,
  },
  pasteText: {
    color: Colors.brandGreen,
    fontSize: 12,
    fontWeight: '700',
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
