import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { VectorIcon } from '../common/VectorIcon';
import { LivePulseBadge } from '../common/LivePulseBadge';
import { useAppStore } from '../../store/useAppStore';
import { formatSecondsToTimer } from '../../utils/timerUtils';

export const AudioCallBanner: React.FC = () => {
  const {
    audioCallStatus,
    audioSeconds,
    tickAudioTimer,
    connectAudioCall,
    endAudioCall,
  } = useAppStore();

  useEffect(() => {
    if (audioCallStatus === 'idle') return;

    if (audioCallStatus === 'ringing') {
      const ringTimer = setTimeout(() => {
        connectAudioCall();
      }, 2000);
      return () => clearTimeout(ringTimer);
    }

    if (audioCallStatus === 'connected') {
      const interval = setInterval(() => {
        tickAudioTimer();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [audioCallStatus, connectAudioCall, tickAudioTimer]);

  if (audioCallStatus === 'idle') return null;

  return (
    <View style={styles.banner}>
      <View style={styles.leftRow}>
        <LivePulseBadge color={Colors.brandGreen} size={7} />
        <Text style={[Typography.monoTimer, styles.statusText]}>
          {audioCallStatus === 'ringing'
            ? 'Calling...'
            : formatSecondsToTimer(audioSeconds)}
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={endAudioCall}
        style={styles.endBtn}>
        <VectorIcon name="phone-slash" size={12} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.audioBannerBg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.audioBannerBorder,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusText: {
    color: Colors.brandGreen,
    fontSize: 13,
  },
  endBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dangerRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
