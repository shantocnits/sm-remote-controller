import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
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
  const [sessionSeconds, setSessionSeconds] = useState(262); // 04:22
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
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Full-Screen Stream Background Image matching index.html */}
      <Image
        source={{
          uri: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop',
        }}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Subtle dark gradient overlay */}
      <View style={styles.darkOverlay} />

      {/* Top Session Status Bar */}
      <View
        style={[
          styles.topHeader,
          { paddingTop: Math.max(insets.top + 8, 20) },
        ]}>
        <View style={styles.liveBadge}>
          <LivePulseBadge color={Colors.dangerRed} size={8} />
          <Text style={[Typography.caption, styles.liveText]}>Live Session</Text>
        </View>

        <View style={styles.timeBadge}>
          <Text style={[Typography.monoTimer, styles.timeText]}>
            {formatSessionTime(sessionSeconds)}
          </Text>
        </View>
      </View>

      {/* Center Device Stream Information Info */}
      <View style={styles.centerInfo}>
        <View style={styles.feedCard}>
          <VectorIcon name="desktop" size={48} color={Colors.brandGreen} />
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
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.65,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
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
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  centerInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  feedCard: {
    backgroundColor: 'rgba(12, 15, 20, 0.75)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    paddingVertical: 24,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedText: {
    color: Colors.textWhite,
    marginTop: 14,
    fontWeight: '700',
    fontSize: 15,
  },
  subFeedText: {
    color: Colors.brandGreen,
    marginTop: 4,
    fontSize: 12,
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
