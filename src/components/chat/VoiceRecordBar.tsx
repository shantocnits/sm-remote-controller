import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { VectorIcon } from '../common/VectorIcon';
import { LivePulseBadge } from '../common/LivePulseBadge';
import { useAppStore } from '../../store/useAppStore';
import { formatSecondsToTimer } from '../../utils/timerUtils';

export const VoiceRecordBar: React.FC = () => {
  const {
    isVoiceRecording,
    voiceSeconds,
    cancelVoiceRecording,
    sendVoiceRecording,
    tickVoiceTimer,
  } = useAppStore();

  useEffect(() => {
    if (!isVoiceRecording) return;
    const interval = setInterval(() => {
      tickVoiceTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [isVoiceRecording, tickVoiceTimer]);

  if (!isVoiceRecording) return null;

  return (
    <View style={styles.container}>
      <View style={styles.pillWrapper}>
        {/* Cancel Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={cancelVoiceRecording}
          style={styles.cancelBtn}>
          <VectorIcon name="trash" size={18} color={Colors.dangerRed} />
        </TouchableOpacity>

        {/* Live Timer with pulsing red dot */}
        <View style={styles.timerRow}>
          <LivePulseBadge color={Colors.dangerRed} size={8} />
          <Text style={[Typography.monoTimer, styles.timerText]}>
            {formatSecondsToTimer(voiceSeconds)}
          </Text>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={sendVoiceRecording}
          style={styles.sendBtn}>
          <VectorIcon name="paper-plane" size={14} color="#000000" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDark,
  },
  pillWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.appBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.brandGreenBorder,
    paddingHorizontal: 12,
    height: 48,
  },
  cancelBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timerText: {
    color: Colors.textWhite,
    fontSize: 14,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
