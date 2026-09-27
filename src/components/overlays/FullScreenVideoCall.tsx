import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Shadows } from '../../theme/shadows';
import { VectorIcon } from '../common/VectorIcon';
import { useAppStore } from '../../store/useAppStore';
import { formatSecondsToTimer } from '../../utils/timerUtils';

export const FullScreenVideoCall: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    videoCallStatus,
    videoSeconds,
    tickVideoTimer,
    minimizeVideoCall,
    endVideoCall,
    isSelfCameraOn,
    toggleSelfCamera,
  } = useAppStore();

  useEffect(() => {
    if (videoCallStatus !== 'connected') return;
    const interval = setInterval(() => {
      tickVideoTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [videoCallStatus, tickVideoTimer]);

  if (videoCallStatus !== 'connected') return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={minimizeVideoCall}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Background Simulated Feed */}
        <View style={styles.remoteFeed}>
          <VectorIcon name="mobile" size={90} color="rgba(45, 212, 191, 0.25)" />
          <Text style={[Typography.bodyMedium, styles.feedLabel]}>
            Remote Video Feed (Galaxy S23 Ultra)
          </Text>
        </View>

        {/* Self-Camera View (Top Right) */}
        {isSelfCameraOn && (
          <View style={[styles.selfCameraBox, Shadows.cardShadow]}>
            <View style={styles.selfCameraFeed}>
              <VectorIcon name="camera" size={24} color={Colors.brandGreen} />
              <Text style={styles.selfLabel}>Self Camera</Text>
            </View>
          </View>
        )}

        {/* Top Controls Bar */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top + 10, 20) }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={minimizeVideoCall}
            style={styles.circleBtn}>
            <VectorIcon name="compress" size={18} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.timerBadge}>
            <Text style={[Typography.monoTimer, styles.timerText]}>
              {formatSecondsToTimer(videoSeconds)}
            </Text>
          </View>

          <View style={styles.spacer} />
        </View>

        {/* Bottom Controls Bar */}
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(insets.bottom + 20, 30) },
          ]}>
          {/* Toggle Cam */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleSelfCamera}
            style={[
              styles.controlBtn,
              !isSelfCameraOn && styles.controlBtnOff,
            ]}>
            <VectorIcon
              name={isSelfCameraOn ? 'video' : 'video-slash'}
              size={20}
              color={isSelfCameraOn ? '#ffffff' : Colors.dangerRed}
            />
          </TouchableOpacity>

          {/* Toggle Mic */}
          <TouchableOpacity activeOpacity={0.7} style={styles.controlBtn}>
            <VectorIcon name="microphone" size={20} color="#ffffff" />
          </TouchableOpacity>

          {/* End Call */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={endVideoCall}
            style={[styles.endCallBtn, Shadows.dangerGlow]}>
            <VectorIcon name="phone-slash" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
  },
  remoteFeed: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0d10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedLabel: {
    color: Colors.textGray,
    marginTop: 16,
    fontSize: 13,
  },
  selfCameraBox: {
    position: 'absolute',
    top: 90,
    right: 20,
    width: 96,
    height: 140,
    borderRadius: 16,
    backgroundColor: '#1f242d',
    borderWidth: 2,
    borderColor: Colors.borderMuted,
    overflow: 'hidden',
    zIndex: 30,
  },
  selfCameraFeed: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161a22',
  },
  selfLabel: {
    color: Colors.textGray,
    fontSize: 10,
    marginTop: 6,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 20,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  timerText: {
    color: Colors.textWhite,
    fontSize: 13,
  },
  spacer: {
    width: 44,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    zIndex: 20,
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(44, 44, 46, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnOff: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
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
