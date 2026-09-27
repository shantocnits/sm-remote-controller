import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Shadows } from '../../theme/shadows';
import { Device } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface DeviceActionModalProps {
  device: Device | null;
  visible: boolean;
  onClose: () => void;
}

export const DeviceActionModal: React.FC<DeviceActionModalProps> = ({
  device,
  visible,
  onClose,
}) => {
  const { togglePinDevice, setDeviceNickname, removeDevice } = useAppStore();
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');

  if (!device) return null;

  const handleStartNickname = () => {
    setNicknameInput(device.nickname || '');
    setIsEditingNickname(true);
  };

  const handleSaveNickname = () => {
    setDeviceNickname(device.id, nicknameInput);
    setIsEditingNickname(false);
    onClose();
  };

  const handleTogglePin = () => {
    togglePinDevice(device.id);
    onClose();
  };

  const handleRemove = () => {
    Alert.alert(
      'Remove Device',
      `Are you sure you want to remove ${device.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeDevice(device.id);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={[styles.dialogCard, Shadows.cardShadow]}>
              <Text style={[Typography.bodyMedium, styles.title]}>
                {device.name}
              </Text>
              <Text style={[Typography.micro, styles.subtitle]}>
                ID: {device.code}
              </Text>

              {isEditingNickname ? (
                <View style={styles.nicknameEditSection}>
                  <TextInput
                    placeholder="Enter nickname"
                    placeholderTextColor={Colors.textGray}
                    value={nicknameInput}
                    onChangeText={setNicknameInput}
                    style={styles.nicknameInput}
                    autoFocus
                  />
                  <View style={styles.nicknameBtnRow}>
                    <TouchableOpacity
                      onPress={() => setIsEditingNickname(false)}
                      style={[styles.smallBtn, styles.cancelBtn]}>
                      <Text style={styles.btnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveNickname}
                      style={[styles.smallBtn, styles.saveBtn]}>
                      <Text style={styles.saveBtnText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.actionsList}>
                  <TouchableOpacity
                    onPress={handleStartNickname}
                    style={styles.actionItem}>
                    <Text style={styles.actionText}>Set Nickname</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleTogglePin}
                    style={styles.actionItem}>
                    <Text style={styles.actionText}>
                      {device.isPinned ? 'Unpin Device' : 'Pin Device'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleRemove}
                    style={[styles.actionItem, styles.dangerItem]}>
                    <Text style={styles.dangerText}>Remove Device</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: Colors.cardBgLight,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderMuted,
  },
  title: {
    color: Colors.textWhite,
    fontSize: 16,
  },
  subtitle: {
    color: Colors.textGray,
    marginBottom: 16,
    marginTop: 2,
  },
  actionsList: {
    gap: 8,
  },
  actionItem: {
    backgroundColor: Colors.cardBg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  actionText: {
    color: Colors.textWhite,
    fontSize: 13,
    fontWeight: '600',
  },
  dangerItem: {
    backgroundColor: Colors.dangerRedSoft,
  },
  dangerText: {
    color: Colors.dangerRed,
    fontSize: 13,
    fontWeight: '700',
  },
  nicknameEditSection: {
    gap: 12,
  },
  nicknameInput: {
    backgroundColor: Colors.appBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.brandGreenBorder,
    color: Colors.textWhite,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  nicknameBtnRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  cancelBtn: {
    backgroundColor: Colors.cardBg,
  },
  saveBtn: {
    backgroundColor: Colors.brandGreen,
  },
  btnText: {
    color: Colors.textWhite,
    fontWeight: '600',
    fontSize: 13,
  },
  saveBtnText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 13,
  },
});
