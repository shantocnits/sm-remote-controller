import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Header } from '../components/common/Header';
import { ModeDropdown } from '../components/common/ModeDropdown';
import { DeviceIdCard } from '../components/home/DeviceIdCard';
import { RemoteConnectCard } from '../components/home/RemoteConnectCard';
import { DeviceCard } from '../components/home/DeviceCard';
import { DeviceActionModal } from '../components/home/DeviceActionModal';
import { useAppStore } from '../store/useAppStore';
import { Device } from '../types';

export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const devices = useAppStore((state) => state.devices);
  const clearDevices = useAppStore((state) => state.clearDevices);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const setConnectedDevice = useAppStore((state) => state.setConnectedDevice);
  const currentMode = useAppStore((state) => state.currentMode);

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  const handleOptions = (device: Device) => {
    setSelectedDevice(device);
    setIsActionModalOpen(true);
  };

  const handleConnect = (device: Device) => {
    // Mode Enforcement
    if (currentMode === 'm2m' && device.type === 'desktop') {
      Alert.alert(
        'Mode Mismatch',
        `You have selected "Mobile to Mobile" mode, but "${device.name}" is a Desktop PC.\n\n👉 To connect and control a PC, tap the top-right menu and choose "Mobile to Desktop" mode.`
      );
      return;
    }
    if (currentMode === 'm2d' && device.type === 'mobile') {
      Alert.alert(
        'Mode Mismatch',
        `You have selected "Mobile to Desktop" mode, but "${device.name}" is a Mobile device.\n\n👉 To connect to a Mobile phone, tap the top-right menu and choose "Mobile to Mobile" mode.`
      );
      return;
    }
    setConnectedDevice(device);
    setActiveTab('remote');
  };

  const handleClear = () => {
    Alert.alert(
      'Clear Devices',
      'Are you sure you want to clear recent devices?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearDevices },
      ]
    );
  };

  const hasDevices = devices.length > 0;

  const renderHeader = useMemo(
    () => (
      <View style={styles.topSection}>
        <DeviceIdCard />
        <RemoteConnectCard />

        <View style={styles.recentSectionHeader}>
          <Text style={[Typography.titleMedium, styles.recentTitle]}>
            Recent Devices
          </Text>
          {hasDevices && (
            <TouchableOpacity activeOpacity={0.7} onPress={handleClear}>
              <Text style={[Typography.caption, styles.clearText]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    ),
    [hasDevices]
  );

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 6, 14) }]}>
      <Header />
      <ModeDropdown />

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DeviceCard
            device={item}
            onOptionsPress={handleOptions}
            onConnectPress={handleConnect}
          />
        )}
        ListHeaderComponent={renderHeader}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <DeviceActionModal
        device={selectedDevice}
        visible={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  topSection: {
    marginBottom: 10,
  },
  recentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 22,
    marginBottom: 12,
  },
  recentTitle: {
    color: Colors.textWhite,
  },
  clearText: {
    color: Colors.textGray,
    fontWeight: '600',
  },
});
