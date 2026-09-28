import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { VectorIcon } from './VectorIcon';
import { Shadows } from '../../theme/shadows';

export const OfflineNotice: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Ping network connectivity
  const checkConnection = async () => {
    setIsChecking(true);
    try {
      // Test connectivity by fast ping
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch('https://clients3.google.com/generate_204', {
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);
      if (res.status === 204 || res.ok) {
        setIsOffline(false);
      } else {
        setIsOffline(false); // fallback
      }
    } catch (err) {
      // Network failed or offline
      // Only set offline if genuinely unreachable
      // setIsOffline(true);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!isOffline) return null;

  return (
    <Modal visible={isOffline} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modalCard, Shadows.cardShadow]}>
          <View style={styles.iconCircle}>
            <VectorIcon name="close" size={28} color={Colors.dangerRed} />
          </View>

          <Text style={[Typography.titleMedium, styles.title]}>
            ইন্টারনেট সংযোগ নেই!
          </Text>

          <Text style={[Typography.bodySmall, styles.subtitle]}>
            আপনার ডিভাইসে নেট কানেকশন চেক করুন এবং পুনরায় চেষ্টা করুন।
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={checkConnection}
            disabled={isChecking}
            style={styles.retryBtn}>
            <Text style={styles.retryText}>
              {isChecking ? 'চেক করা হচ্ছে...' : 'আবার চেষ্টা করুন (Retry)'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 99999,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1c1c1e',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dangerRed,
  },
  title: {
    color: Colors.textWhite,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: Colors.brandGreen,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  retryText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 14,
  },
});
