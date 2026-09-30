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
  const currentMode = useAppStore((state) => state.currentMode);
  const devices = useAppStore((state) => state.devices);
  const [partnerId, setPartnerId] = useState('');

  const modeLabel =
    currentMode === 'm2m'
      ? 'Mobile to Mobile'
      : currentMode === 'm2d'
      ? 'Mobile to Desktop'
      : 'Desktop to Desktop';

  const handleConnect = () => {
    const cleanId = partnerId.replace(/[^0-9]/g, '');
    if (!cleanId || cleanId.length < 3) {
      Alert.alert('Partner ID Required', 'Please enter a valid 6-digit Partner ID to connect.');
      return;
    }

    // Strict Mode Enforcement
    const existing = devices.find((d) => d.code.replace(/\s+/g, '') === cleanId);
    if (existing) {
      if (currentMode === 'm2m' && existing.type === 'desktop') {
        Alert.alert(
          'Mode Mismatch',
          `You have selected "Mobile to Mobile" mode, but Device ID ${existing.code} (${existing.name}) is a Desktop PC.\n\n👉 To connect and control a PC, tap the top-right menu and switch to "Mobile to Desktop" mode.`
        );
        return;
      }
      if (currentMode === 'm2d' && existing.type === 'mobile') {
        Alert.alert(
          'Mode Mismatch',
          `You have selected "Mobile to Desktop" mode, but Device ID ${existing.code} (${existing.name}) is a Mobile device.\n\n👉 To connect to a Mobile phone, tap the top-right menu and switch to "Mobile to Mobile" mode.`
        );
        return;
      }
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
        <View style={styles.titleWithBadge}>
          <Text style={[Typography.bodyMedium, styles.title]}>
            Control Remote Device
          </Text>
          <View style={styles.modeTag}>
            <Text style={styles.modeTagText}>{modeLabel}</Text>
          </View>
        </View>
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
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeTag: {
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
  },
  modeTagText: {
    color: Colors.brandGreen,
    fontSize: 10,
    fontWeight: '700',
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
