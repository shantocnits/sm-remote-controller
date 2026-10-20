import React, { useState, useEffect, useMemo } from 'react';
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
import { DeviceIdCard } from '../components/home/DeviceIdCard';
import { RemoteConnectCard } from '../components/home/RemoteConnectCard';
import { DeviceCard } from '../components/home/DeviceCard';
import { DeviceActionModal } from '../components/home/DeviceActionModal';
import { useAppStore } from '../store/useAppStore';
import { Device } from '../types';
import { peerService, PeerMessage } from '../services/peerService';
import { screenStreamService } from '../services/screenStreamService';

export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const devices = useAppStore((state) => state.devices);
  const clearDevices = useAppStore((state) => state.clearDevices);
  const connectToPartner = useAppStore((state) => state.connectToPartner);
  const loadSavedDevices = useAppStore((state) => state.loadSavedDevices);
  const incomingPartner = useAppStore((state) => state.incomingPartner);
  const setIncomingPartner = useAppStore((state) => state.setIncomingPartner);

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  // Initialize peer service and load persistent devices on mount
  useEffect(() => {
    peerService.init();
    loadSavedDevices();

    const unsubscribe = peerService.addListener((msg: PeerMessage) => {
      if (msg.type === 'CONNECT_REQUEST') {
        const partnerName = msg.fromName || `Mobile (${msg.fromId})`;
        setIncomingPartner({ id: msg.fromId, name: partnerName });
        screenStreamService.startBroadcasting(msg.fromId);
        Alert.alert(
          '📱 Incoming Remote Connection',
          `${partnerName} (ID: ${msg.fromId}) is connected and viewing your screen.`,
          [{ text: 'OK', style: 'default' }]
        );
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleOptions = (device: Device) => {
    setSelectedDevice(device);
    setIsActionModalOpen(true);
  };

  const handleConnect = (device: Device) => {
    connectToPartner(device.code);
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
        {incomingPartner && (
          <View style={styles.broadcastingCard}>
            <View style={styles.broadcastingHeader}>
              <View style={styles.broadcastingDot} />
              <Text style={styles.broadcastingTitle}>SCREEN SHARING ACTIVE</Text>
            </View>
            <Text style={styles.broadcastingSub}>
              Broadcasting screen to {incomingPartner.name} (ID: {incomingPartner.id})
            </Text>
            <TouchableOpacity
              style={styles.stopBroadcastBtn}
              activeOpacity={0.8}
              onPress={() => {
                screenStreamService.stopBroadcasting();
                setIncomingPartner(null);
                Alert.alert('Session Stopped', 'Screen sharing has been stopped.');
              }}>
              <Text style={styles.stopBroadcastBtnText}>Stop Screen Sharing</Text>
            </TouchableOpacity>
          </View>
        )}
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
    [hasDevices, incomingPartner]
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📱</Text>
      <Text style={styles.emptyTitle}>No Recent Devices</Text>
      <Text style={styles.emptySub}>
        Enter a 6-digit Partner ID in the card above to connect and control another mobile.
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 6, 14) }]}>
      <Header />

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
        ListEmptyComponent={renderEmptyList}
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
  broadcastingCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.dangerRed,
    padding: 16,
    marginBottom: 12,
  },
  broadcastingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  broadcastingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dangerRed,
  },
  broadcastingTitle: {
    color: Colors.dangerRed,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  broadcastingSub: {
    color: '#e2e8f0',
    fontSize: 12,
    marginBottom: 12,
  },
  stopBroadcastBtn: {
    backgroundColor: Colors.dangerRed,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBroadcastBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
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
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginTop: 6,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  emptyTitle: {
    color: Colors.textWhite,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySub: {
    color: Colors.textGray,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
