import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  NativeModules,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Header } from '../components/common/Header';
import { DeviceIdCard } from '../components/home/DeviceIdCard';
import { RemoteConnectCard } from '../components/home/RemoteConnectCard';
import { DeviceCard } from '../components/home/DeviceCard';
import { DeviceActionModal } from '../components/home/DeviceActionModal';
import { ConnectingModal } from '../components/home/ConnectingModal';
import { IncomingRequestModal } from '../components/home/IncomingRequestModal';
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
  const setIncomingRequest = useAppStore((state) => state.setIncomingRequest);
  const disconnectSession = useAppStore((state) => state.disconnectSession);

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isAccessibilityOn, setIsAccessibilityOn] = useState<boolean>(true);

  // Monitor accessibility service status on Android
  useEffect(() => {
    const checkAccessibility = async () => {
      if (Platform.OS === 'android' && NativeModules.ScreenCaptureModule?.isAccessibilityEnabled) {
        try {
          const enabled = await NativeModules.ScreenCaptureModule.isAccessibilityEnabled();
          setIsAccessibilityOn(!!enabled);
        } catch (e) {}
      }
    };
    checkAccessibility();
    const interval = setInterval(checkAccessibility, 3000);
    return () => clearInterval(interval);
  }, []);

  // Initialize peer service and load persistent devices on mount
  useEffect(() => {
    peerService.init();
    loadSavedDevices();

    const unsubscribe = peerService.addListener((msg: PeerMessage) => {
      if (msg.type === 'CONNECT_REQUEST') {
        const partnerName = msg.fromName || `Mobile (${msg.fromId})`;
        setIncomingRequest({
          fromId: msg.fromId,
          fromName: partnerName,
          timestamp: msg.timestamp || Date.now(),
        });
      } else if (msg.type === 'CONNECT_CANCEL') {
        const currentReq = useAppStore.getState().incomingRequest;
        if (currentReq && currentReq.fromId === msg.fromId) {
          setIncomingRequest(null);
        }
      } else if (msg.type === 'DISCONNECT') {
        screenStreamService.stopBroadcasting();
        screenStreamService.stopReceiving();
        setIncomingPartner(null);
        useAppStore.setState({ connectedDevice: null, incomingPartner: null, activeTab: 'home' });
        Alert.alert('Session Ended', `${msg.fromName || 'Partner'} has disconnected.`);
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

  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  const handleOpenAccessibility = () => {
    NativeModules.ScreenCaptureModule?.openAccessibilitySettings?.();
  };

  const handleOpenAppInfo = () => {
    NativeModules.ScreenCaptureModule?.openAppSettings?.();
  };

  const showPermissionHelp = () => {
    Alert.alert(
      '৩-ডট পারমিশন আনলক করার সঠিক নিয়ম',
      '১ম ধাপ: "১. এক্সেসিবিলিটি" বাটনে চাপুন > SM Controller সিলেক্ট করে On করার চেষ্টা করুন। Android একটি রেস্ট্রিক্টেড পপআপ দেখাবে, সেটাতে OK চাপুন।\n\n' +
      '২য় ধাপ: এবার "২. ৩-ডট আনলক" বাটনে চাপুন > উপরে ডানদিকের ৩টি ডট (⋮) চাপুন > "Allow restricted settings" (বা রেস্ট্রিক্টেড সেটিং অনুমোদন) এ চাপুন এবং ফিঙ্গারপ্রিন্ট/পিন দিন।\n\n' +
      '৩য় ধাপ: আবার "১. এক্সেসিবিলিটি"-তে গিয়ে On করে দিন।\n\n' +
      '💡 বিশেষ দ্রষ্টব্য: লাইভ স্ক্রিন দেখার জন্য এই পারমিশনের প্রয়োজন নেই, স্ক্রিন শেয়ার সরাসরি এমনিতেই চলবে!',
      [{ text: 'বুঝেছি', style: 'default' }]
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
                disconnectSession();
                Alert.alert('Session Stopped', 'Screen sharing has been stopped on both phones.');
              }}>
              <Text style={styles.stopBroadcastBtnText}>Stop Screen Sharing</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Simple Touch Unlock Banner */}
        {!isAccessibilityOn && !isBannerDismissed && (
          <View style={styles.accessibilityWarningCard}>
            <View style={styles.accessibilityWarningLeft}>
              <Text style={styles.accessibilityWarningIcon}>⚡</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.accessibilityWarningTitle}>Remote Touch (ঐচ্ছিক)</Text>
                <Text style={styles.accessibilityWarningSub}>
                  স্ক্রিন শেয়ার সরাসরি চলবে। দূর থেকে টাচ কন্ট্রোল দিতে নিচের ধাপ ২টি করুন:
                </Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <TouchableOpacity
                    style={[styles.accessibilityEnableBtn, { backgroundColor: '#38bdf8' }]}
                    activeOpacity={0.8}
                    onPress={handleOpenAccessibility}>
                    <Text style={[styles.accessibilityEnableBtnText, { color: '#000000', fontWeight: 'bold' }]}>১. এক্সেসিবিলিটি</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.accessibilityEnableBtn, { backgroundColor: '#f59e0b' }]}
                    activeOpacity={0.8}
                    onPress={handleOpenAppInfo}>
                    <Text style={[styles.accessibilityEnableBtnText, { color: '#000000', fontWeight: 'bold' }]}>২. ৩-ডট আনলক</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.accessibilityEnableBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                    activeOpacity={0.8}
                    onPress={showPermissionHelp}>
                    <Text style={[styles.accessibilityEnableBtnText, { color: '#ffffff' }]}>❓ নিয়মাবলী</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={{ paddingHorizontal: 6, paddingVertical: 4, alignSelf: 'flex-start' }}
              activeOpacity={0.7}
              onPress={() => setIsBannerDismissed(true)}>
              <Text style={{ color: '#94a3b8', fontSize: 16, fontWeight: 'bold' }}>✕</Text>
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

      {/* Caller Waiting Radar Modal */}
      <ConnectingModal />

      {/* Callee AnyDesk Style Incoming Connection Prompt */}
      <IncomingRequestModal />
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
  accessibilityWarningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  accessibilityWarningLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accessibilityWarningIcon: {
    fontSize: 20,
  },
  accessibilityWarningTitle: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  accessibilityWarningSub: {
    color: '#d1d5db',
    fontSize: 10,
    lineHeight: 14,
  },
  accessibilityEnableBtn: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  accessibilityEnableBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
  },
});
