import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Shadows } from '../../theme/shadows';
import { VectorIcon } from './VectorIcon';
import { useAppStore } from '../../store/useAppStore';
import { UpdateModal } from './UpdateModal';
import { checkForAppUpdates } from '../../services/updateService';

export const Header: React.FC = () => {
  const { toggleModeDropdown, isModeDropdownOpen } = useAppStore();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.9,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    );
    pulse.start();

    // Check updates on startup
    checkForAppUpdates().then((info) => {
      if (info.hasUpdate) {
        setHasNewUpdate(true);
      }
    });

    return () => pulse.stop();
  }, [glowAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={[Typography.titleLarge, styles.title]}>
          SM <Text style={styles.brandAccent}>CONTROLLER</Text>
        </Text>
        <Text style={[Typography.caption, styles.developerText]}>
          dev: Khandaker shanto
        </Text>
        <Text style={[Typography.micro, styles.versionText]}>Version 1.0.0</Text>
      </View>

      <View style={styles.buttonsRow}>
        {/* Update Button (Left of Menu) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsUpdateModalOpen(true)}
          style={[styles.updateButton, Shadows.subtleNeon]}>
          <VectorIcon name="update" size={18} color={Colors.brandGreen} />
          {hasNewUpdate && <View style={styles.updateBadge} />}
        </TouchableOpacity>

        {/* Menu Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={toggleModeDropdown}
          style={[
            styles.menuButton,
            Shadows.neonGlow,
            isModeDropdownOpen && styles.menuButtonActive,
          ]}>
          <VectorIcon name="bars" size={20} color={Colors.brandGreen} />
        </TouchableOpacity>
      </View>

      {/* In-App GitHub Auto-Update Modal */}
      <UpdateModal
        visible={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    zIndex: 50,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: Colors.textWhite,
  },
  brandAccent: {
    color: Colors.brandGreen,
  },
  developerText: {
    color: Colors.brandGreen,
    marginTop: 3,
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  versionText: {
    color: Colors.textGray,
    marginTop: 2,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  updateButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(45, 212, 191, 0.4)',
    position: 'relative',
  },
  updateBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.dangerRed,
    borderWidth: 1.5,
    borderColor: Colors.cardBg,
  },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.brandGreenBorder,
  },
  menuButtonActive: {
    backgroundColor: Colors.cardBgLight,
    borderColor: Colors.brandGreen,
  },
});
