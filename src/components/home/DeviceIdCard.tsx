import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { VectorIcon } from '../common/VectorIcon';
import { LivePulseBadge } from '../common/LivePulseBadge';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrentDate, formatCurrentTime } from '../../utils/dateUtils';
import { getDeviceId, copyTextToClipboard } from '../../utils/deviceUtils';

export const DeviceIdCard: React.FC = () => {
  const { currentMode } = useAppStore();
  const [deviceId] = useState<string>(getDeviceId());
  const [liveDate, setLiveDate] = useState(formatCurrentDate());
  const [liveTime, setLiveTime] = useState(formatCurrentTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveDate(formatCurrentDate());
      setLiveTime(formatCurrentTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = () => {
    copyTextToClipboard(deviceId, 'Device ID');
  };

  const modeLabel = currentMode === 'm2m' ? 'Mobile Mode' : 'Desktop Mode';

  return (
    <View style={styles.card}>
      {/* Top row */}
      <View style={styles.topRow}>
        <Text style={[Typography.bodyMedium, styles.label]}>Your Device ID</Text>
        <View style={styles.badge}>
          <LivePulseBadge color="#000000" size={7} />
          <Text style={[Typography.caption, styles.badgeText]}>{modeLabel}</Text>
        </View>
      </View>

      {/* Device ID and Copy */}
      <View style={styles.idRow}>
        <Text style={[Typography.monoHeading, styles.idText]}>{deviceId}</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleCopy}
          style={styles.copyButton}>
          <VectorIcon name="copy" size={20} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Date & Time footer */}
      <View style={styles.footerRow}>
        <Text style={[Typography.bodyMedium, styles.dateText]}>{liveDate}</Text>
        <View style={styles.timeBadge}>
          <Text style={[Typography.monoText, styles.timeText]}>{liveTime}</Text>
        </View>
      </View>

      {/* Decorative background watermark */}
      <View pointerEvents="none" style={styles.watermark}>
        <Text style={styles.watermarkText}>📡</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.brandGreen,
    borderRadius: 28,
    padding: 22,
    marginTop: 8,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: Colors.brandGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  label: {
    color: '#000000',
    opacity: 0.85,
    fontWeight: '700',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 11,
  },
  idRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 14,
    zIndex: 10,
  },
  idText: {
    color: '#000000',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 2,
  },
  copyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.15)',
    paddingTop: 12,
    zIndex: 10,
  },
  dateText: {
    color: '#000000',
    opacity: 0.85,
    fontWeight: '700',
    fontSize: 12,
  },
  timeBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timeText: {
    color: '#000000',
    opacity: 0.9,
    fontSize: 12,
    fontWeight: '700',
  },
  watermark: {
    position: 'absolute',
    right: -10,
    bottom: -15,
    opacity: 0.08,
  },
  watermarkText: {
    fontSize: 90,
  },
});
