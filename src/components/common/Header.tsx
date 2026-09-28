import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Shadows } from '../../theme/shadows';
import { VectorIcon } from './VectorIcon';
import { useAppStore } from '../../store/useAppStore';
import { UpdateModal } from './UpdateModal';
import { checkForAppUpdates } from '../../services/updateService';

export const Header: React.FC = () => {
  const { toggleModeDropdown, isModeDropdownOpen, appVersion } = useAppStore();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Pulse animation for header badge
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  // Rotation animation for update button
  const spinAnim = useRef(new Animated.Value(0)).current;

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
    checkForAppUpdates(appVersion).then((info) => {
      if (info.hasUpdate) {
        setHasNewUpdate(true);
      }
    });

    return () => pulse.stop();
  }, [glowAnim, appVersion]);

  const handleOpenUpdate = () => {
    // Start continuous spin animation
    setIsScanning(true);
    spinAnim.setValue(0);
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      setIsScanning(false);
    });

    setIsUpdateModalOpen(true);
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={[Typography.titleLarge, styles.title]}>
          SM <Text style={styles.brandAccent}>CONTROLLER</Text>
        </Text>
        <Text style={[Typography.caption, styles.developerText]}>
          dev: Khandaker shanto
        </Text>
        <Text style={[Typography.micro, styles.versionText]}>Version {appVersion}</Text>
      </View>

      <View style={styles.buttonsRow}>
        {/* Update Button (Left of Menu) with animated spin */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleOpenUpdate}
          style={[styles.updateButton, Shadows.subtleNeon]}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <VectorIcon name="update" size={18} color={Colors.brandGreen} />
          </Animated.View>
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
    fontFamily: 'monospace',
    fontSize: 11,
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
