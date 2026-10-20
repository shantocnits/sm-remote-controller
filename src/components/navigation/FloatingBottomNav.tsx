import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { Shadows } from '../../theme/shadows';
import { NavButton } from './NavButton';
import { useAppStore } from '../../store/useAppStore';

export const FloatingBottomNav: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { activeTab, setActiveTab } = useAppStore();

  // If in chat, hide bottom nav like standard Messenger view
  if (activeTab === 'chat') {
    return null;
  }

  return (
    <View
      style={[
        styles.floatingWrapper,
        { bottom: Math.max(insets.bottom + 8, 16) },
      ]}>
      <View style={[styles.navContainer, Shadows.cardShadow]}>
        <NavButton
          label="Connect"
          icon="home"
          isActive={activeTab === 'home'}
          onPress={() => setActiveTab('home')}
        />
        <NavButton
          label="Screen"
          icon="mobile"
          isActive={activeTab === 'remote'}
          onPress={() => setActiveTab('remote')}
        />
        <NavButton
          label="Tools"
          icon="tools"
          isActive={activeTab === 'tools'}
          onPress={() => setActiveTab('tools')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 60,
  },
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 20,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.25)',
    gap: 6,
  },
});
