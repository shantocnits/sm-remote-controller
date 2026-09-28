import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { Colors } from '../../theme/colors';
import { VectorIcon } from './VectorIcon';
import NetInfo from '@react-native-community/netinfo';

export const OfflineBlockingOverlay: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let unsubscribe: any = null;
    try {
      unsubscribe = NetInfo.addEventListener((state) => {
        setIsOffline(state.isConnected === false);
      });
    } catch (e) {}

    const checkPing = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        await fetch('https://raw.githubusercontent.com/shantocnits/sm-remote-controller/main/version.json?t=' + Date.now(), {
          signal: controller.signal,
          method: 'HEAD',
        });
        clearTimeout(timeout);
        setIsOffline(false);
      } catch (err) {
        try {
          const s = await NetInfo.fetch();
          if (s.isConnected === false) setIsOffline(true);
        } catch (e) {}
      }
    };

    const interval = setInterval(checkPing, 4000);

    return () => {
      if (unsubscribe) unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <Modal visible={isOffline} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.iconCircle}>
          <VectorIcon name="wifi-off" size={32} color="#ef4444" />
        </View>

        <Text style={styles.title}>No Internet Connection</Text>
        <Text style={styles.message}>
          Please connect to the internet to use this app. All features require an active network connection.
        </Text>

        <View style={styles.reconnectingBadge}>
          <View style={styles.greenDot} />
          <Text style={styles.reconnectingText}>Reconnecting automatically...</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 10, 12, 0.98)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    zIndex: 99999,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    color: '#8e8e93',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 280,
  },
  reconnectingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brandGreen,
  },
  reconnectingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.brandGreen,
  },
});
