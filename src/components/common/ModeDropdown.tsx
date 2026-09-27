import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Shadows } from '../../theme/shadows';
import { VectorIcon } from './VectorIcon';
import { useAppStore } from '../../store/useAppStore';
import { AppMode } from '../../types';

interface ModeOption {
  key: AppMode;
  label: string;
  icon: 'mobile' | 'desktop' | 'laptop';
}

const MODES: ModeOption[] = [
  { key: 'm2m', label: 'Mobile to Mobile', icon: 'mobile' },
  { key: 'm2d', label: 'Mobile to Desktop', icon: 'desktop' },
  { key: 'd2d', label: 'Desktop to Desktop', icon: 'laptop' },
];

export const ModeDropdown: React.FC = () => {
  const { currentMode, setMode, isModeDropdownOpen, closeModeDropdown } = useAppStore();

  if (!isModeDropdownOpen) return null;

  return (
    <Modal
      transparent
      visible={isModeDropdownOpen}
      animationType="fade"
      onRequestClose={closeModeDropdown}>
      <TouchableWithoutFeedback onPress={closeModeDropdown}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.dropdownContainer, Shadows.cardShadow]}>
              <View style={styles.menuList}>
                {MODES.map((item) => {
                  const isActive = currentMode === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      activeOpacity={0.8}
                      onPress={() => setMode(item.key)}
                      style={[
                        styles.menuItem,
                        isActive && styles.menuItemActive,
                      ]}>
                      <VectorIcon
                        name={item.icon}
                        size={16}
                        color={isActive ? '#000000' : Colors.textWhite}
                      />
                      <Text
                        style={[
                          Typography.bodyMedium,
                          styles.itemText,
                          isActive && styles.itemTextActive,
                        ]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 72,
    right: 24,
    width: 210,
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderMuted,
    overflow: 'hidden',
  },
  menuList: {
    padding: 8,
    gap: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 12,
  },
  menuItemActive: {
    backgroundColor: Colors.brandGreen,
  },
  itemText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  itemTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
});
