import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ToastAndroid,
  Platform,
  Alert,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { VectorIcon } from '../common/VectorIcon';
import { copyTextToClipboard, getClipboardText } from '../../utils/deviceUtils';

interface ClipboardModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ClipboardModal: React.FC<ClipboardModalProps> = ({
  visible,
  onClose,
}) => {
  const [currentText, setCurrentText] = useState('');
  const [syncHistory, setSyncHistory] = useState<string[]>([
    'https://github.com/shantocnits/sm-remote-controller',
    'Partner ID: 412 887',
    'npm run android -- --reset-cache',
  ]);

  useEffect(() => {
    if (visible) {
      getClipboardText().then((txt) => {
        if (txt) setCurrentText(txt);
      });
    }
  }, [visible]);

  const handleSyncToRemote = () => {
    if (!currentText.trim()) return;
    setSyncHistory([currentText, ...syncHistory.filter((t) => t !== currentText)]);
    const msg = 'Clipboard pushed & synced with Galaxy S23 Ultra!';
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      Alert.alert('Synced', msg);
    }
  };

  const handleCopyHistory = (text: string) => {
    copyTextToClipboard(text, 'Copied');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.titleIconBox}>
                <VectorIcon name="clipboard" size={20} color="#fb923c" />
              </View>
              <div>
                <Text style={[Typography.titleMedium, styles.title]}>Shared Clipboard</Text>
                <Text style={styles.subtitle}>Instant Real-Time Copy & Paste Sync</Text>
              </div>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <VectorIcon name="close" size={16} color={Colors.textWhite} />
            </TouchableOpacity>
          </View>

          {/* Current Clipboard Input Box */}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Current Clipboard Content:</Text>
            <TextInput
              multiline
              value={currentText}
              onChangeText={setCurrentText}
              placeholder="Type or paste text to sync with remote device..."
              placeholderTextColor={Colors.textGray}
              style={styles.textInput}
            />

            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={() => copyTextToClipboard(currentText, 'Copied')}
                style={styles.copyBtn}>
                <VectorIcon name="copy" size={14} color={Colors.textWhite} />
                <Text style={styles.btnText}>Copy Local</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSyncToRemote}
                style={styles.syncBtn}>
                <VectorIcon name="paper-plane" size={14} color="#000000" />
                <Text style={styles.syncBtnText}>Sync with Device</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Synced History */}
          <Text style={styles.historyHeading}>Recent Synced Clips</Text>
          <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
            {syncHistory.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                onPress={() => handleCopyHistory(item)}
                style={styles.historyItem}>
                <Text style={styles.historyText} numberOfLines={2}>
                  {item}
                </Text>
                <VectorIcon name="copy" size={14} color={Colors.brandGreen} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.35)',
    padding: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.appBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.4)',
  },
  title: {
    color: Colors.textWhite,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textGray,
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputCard: {
    backgroundColor: Colors.appBg,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginBottom: 16,
  },
  inputLabel: {
    color: Colors.textGray,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    color: Colors.textWhite,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.cardBgLight,
  },
  btnText: {
    color: Colors.textWhite,
    fontSize: 12,
    fontWeight: '600',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.brandGreen,
  },
  syncBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
  historyHeading: {
    color: Colors.textWhite,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  historyList: {
    maxHeight: 180,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.appBg,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  historyText: {
    color: Colors.textSecondary,
    fontSize: 12,
    flex: 1,
    marginRight: 10,
  },
});
