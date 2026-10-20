import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Shadows } from '../../theme/shadows';
import { VectorIcon } from '../common/VectorIcon';
import { useAppStore } from '../../store/useAppStore';

export const ConnectingModal: React.FC = () => {
  const isConnecting = useAppStore((state) => state.isConnecting);
  const connectingTargetCode = useAppStore((state) => state.connectingTargetCode);
  const cancelConnectRequest = useAppStore((state) => state.cancelConnectRequest);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isConnecting) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      const rotate = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      pulse.start();
      rotate.start();

      return () => {
        pulse.stop();
        rotate.stop();
      };
    }
  }, [isConnecting]);

  if (!isConnecting) return null;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal visible={isConnecting} transparent animationType="fade" onRequestClose={cancelConnectRequest}>
      <View style={styles.overlay}>
        <View style={[styles.card, Shadows.cardShadow]}>
          {/* Radar Radar Pulsing Animation */}
          <View style={styles.radarContainer}>
            <Animated.View
              style={[
                styles.pulseCircle,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.25],
                    outputRange: [0.6, 0.15],
                  }),
                },
              ]}
            />
            <Animated.View style={[styles.spinningRadar, { transform: [{ rotate: spin }] }]}>
              <View style={styles.radarSweep} />
            </Animated.View>

            <View style={styles.centerIcon}>
              <VectorIcon name="mobile" size={32} color={Colors.brandGreen} />
            </View>
          </View>

          {/* Title & Partner Code */}
          <Text style={[Typography.titleMedium, styles.title]}>Connecting to Partner</Text>
          <View style={styles.codeBadge}>
            <Text style={[Typography.titleLarge, styles.codeText]}>
              {connectingTargetCode || 'Remote Device'}
            </Text>
          </View>

          {/* Status Message */}
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color={Colors.brandGreen} />
            <Text style={styles.statusText}>Waiting for partner to accept...</Text>
          </View>

          <Text style={styles.description}>
            A connection request was sent. Please ask the partner to tap &ldquo;Accept&rdquo; on their phone screen.
          </Text>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelBtn}
            activeOpacity={0.8}
            onPress={cancelConnectRequest}>
            <VectorIcon name="close" size={16} color="#ef4444" />
            <Text style={styles.cancelBtnText}>Cancel Request</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 99999,
  },
  card: {
    width: '100%',
    backgroundColor: '#16191f',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(45, 212, 191, 0.4)',
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  radarContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(45, 212, 191, 0.25)',
    borderWidth: 1.5,
    borderColor: Colors.brandGreen,
  },
  spinningRadar: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.2)',
  },
  radarSweep: {
    width: 40,
    height: 40,
    borderTopRightRadius: 40,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    alignSelf: 'flex-end',
  },
  centerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.appBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.brandGreen,
  },
  title: {
    color: Colors.textWhite,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  codeBadge: {
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    marginBottom: 14,
  },
  codeText: {
    color: Colors.brandGreen,
    letterSpacing: 2,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  statusText: {
    color: Colors.textWhite,
    fontSize: 13,
    fontWeight: '600',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 10,
    marginBottom: 24,
  },
  cancelBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  cancelBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
});
