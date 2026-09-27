import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
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
  const { devices, clearDevices, setActiveTab } = useAppStore();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  const handleOptions = (device: Device) => {
    setSelectedDevice(device);
    setIsActionModalOpen(true);
  };

  const handleConnect = (device: Device) => {
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

  const renderHeader = () => (
    <View style={styles.topSection}>
      <DeviceIdCard />
      <RemoteConnectCard />

      <View style={styles.recentSectionHeader}>
        <Text style={[Typography.titleMedium, styles.recentTitle]}>
          Recent Devices
        </Text>
        {devices.length > 0 && (
          <TouchableOpacity activeOpacity={0.7} onPress={handleClear}>
            <Text style={[Typography.caption, styles.clearText]}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
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
