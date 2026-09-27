import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Shadows } from '../../theme/shadows';
import { VectorIcon } from '../common/VectorIcon';
import { useAppStore } from '../../store/useAppStore';

export const VideoRingingModal: React.FC = () => {
  const { videoCallStatus, connectVideoCall, endVideoCall } = useAppStore();
  const pingScale = useRef(new Animated.Value(1)).current;
  const pingOpacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (videoCallStatus !== 'ringing') return;

    // Pulse animation
    const loop = Animated.loop(
      Animated.parallel([
        Animated.timing(pingScale, {
          toValue: 1.8,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pingOpacity, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();

    // Auto connect after 2 seconds like HTML prototype
    const timer = setTimeout(() => {
      connectVideoCall();
    }, 2000);

    return () => {
      loop.stop();
      clearTimeout(timer);
    };
  }, [videoCallStatus, connectVideoCall, pingScale, pingOpacity]);

  if (videoCallStatus !== 'ringing') return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={endVideoCall}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Avatar with pulsing ring */}
          <View style={styles.avatarWrapper}>
            <Animated.View
              style={[
                styles.pingRing,
                {
                  transform: [{ scale: pingScale }],
                  opacity: pingOpacity,
                },
              ]}
            />
            <View style={styles.avatarCircle}>
              <VectorIcon name="mobile" size={40} color={Colors.brandGreen} />
            </View>
          </View>

          <Text style={[Typography.titleLarge, styles.callerName]}>
            Galaxy S23 Ultra
          </Text>
          <Text style={[Typography.bodyMedium, styles.statusText]}>Calling...</Text>

          {/* End Call Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={endVideoCall}
            style={[styles.endCallBtn, Shadows.dangerGlow]}>
            <VectorIcon name="phone-slash" size={26} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  pingRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.brandGreen,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.cardBg,
    borderWidth: 2,
    borderColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callerName: {
    color: Colors.textWhite,
    fontSize: 22,
    marginBottom: 6,
  },
  statusText: {
    color: Colors.brandGreen,
    fontSize: 14,
    marginBottom: 44,
  },
  endCallBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.dangerRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
