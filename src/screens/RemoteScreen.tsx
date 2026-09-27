import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Shadows } from '../theme/shadows';
import { VectorIcon } from '../components/common/VectorIcon';
import { LivePulseBadge } from '../components/common/LivePulseBadge';
import { useAppStore } from '../store/useAppStore';

export const RemoteScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { setActiveTab } = useAppStore();
  const [sessionSeconds, setSessionSeconds] = useState(262); // 04:22 start
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatSessionTime = (total: number) => {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleDisconnect = () => {
    setActiveTab('home');
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    Alert.alert(
      isRecording ? 'Recording Stopped' : 'Recording Started',
      isRecording ? 'Session video saved.' : 'Screen recording in progress.'
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Session Status Bar */}
      <View
        style={[
          styles.topHeader,
          { paddingTop: Math.max(insets.top + 8, 16) },
        ]}>
        <View style={styles.liveBadge}>
          <LivePulseBadge color={Colors.dangerRed} size={6} />
          <Text style={[Typography.caption, styles.liveText]}>Live Session</Text>
        </View>

        <View style={styles.timeBadge}>
          <Text style={[Typography.monoTimer, styles.timeText]}>
            {formatSessionTime(sessionSeconds)}
          </Text>
        </View>
      </View>

      {/* Remote Device Canvas Simulator */}
      <View style={styles.canvasContainer}>
        <View style={styles.feedBox}>
          <VectorIcon name="desktop" size={64} color="rgba(45, 212, 191, 0.3)" />
          <Text style={[Typography.bodyMedium, styles.feedText]}>
            Connected to Galaxy S23 Ultra
          </Text>
          <Text style={[Typography.caption, styles.subFeedText]}>
            Streaming at 60 FPS • 1080p
          </Text>
        </View>
      </View>

      {/* Floating Action Toolbar */}
      <View
        style={[
          styles.toolbarWrapper,
          { bottom: Math.max(insets.bottom + 85, 95) },
        ]}>
        <View style={[styles.toolbar, Shadows.cardShadow]}>
          <TouchableOpacity activeOpacity={0.7} style={styles.toolBtn}>
            <VectorIcon name="keyboard" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} style={styles.toolBtn}>
            <VectorIcon name="camera" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} style={styles.toolBtn}>
            <VectorIcon name="microphone" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleRecording}
            style={[styles.toolBtn, isRecording && styles.toolBtnRecording]}>
            <VectorIcon
              name="record"
              size={18}
              color={isRecording ? Colors.dangerRed : Colors.textSecondary}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleDisconnect}
            style={styles.disconnectBtn}>
            <VectorIcon name="phone-slash" size={16} color={Colors.dangerRed} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 20,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    gap: 8,
  },
  liveText: {
    color: Colors.textWhite,
    fontWeight: '700',
  },
  timeBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  timeText: {
    color: Colors.textSecondary,
  },
  canvasContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  feedBox: {
    width: '100%',
    height: '75%',
    backgroundColor: '#0c0f14',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedText: {
    color: Colors.textWhite,
    marginTop: 16,
  },
  subFeedText: {
    color: Colors.brandGreen,
    marginTop: 4,
  },
  toolbarWrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 30,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    gap: 6,
  },
  toolBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.appBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnRecording: {
    borderWidth: 1.5,
    borderColor: Colors.dangerRed,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.borderDark,
    marginHorizontal: 4,
  },
  disconnectBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.dangerRedSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
