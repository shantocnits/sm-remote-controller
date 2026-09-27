import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { VectorIcon } from '../common/VectorIcon';
import { NeonCard } from '../common/NeonCard';
import { Device } from '../../types';

interface DeviceCardProps {
  device: Device;
  onOptionsPress: (device: Device) => void;
  onConnectPress: (device: Device) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  onOptionsPress,
  onConnectPress,
}) => {
  return (
    <NeonCard style={styles.card} pulsing={device.isPinned}>
      {device.isPinned && (
        <View style={styles.pinIconWrapper}>
          <VectorIcon name="thumbtack" size={12} color={Colors.brandGreen} />
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => onConnectPress(device)}
        style={styles.contentRow}>
        {/* Device Icon Avatar */}
        <View style={styles.avatar}>
          <VectorIcon
            name={device.type === 'mobile' ? 'mobile' : 'desktop'}
            size={22}
            color={device.type === 'mobile' ? Colors.brandGreen : Colors.textGray}
          />
        </View>

        {/* Device Info */}
        <View style={styles.infoCol}>
          {device.nickname ? (
            <Text style={[Typography.micro, styles.nickname]}>
              {device.nickname.toUpperCase()}
            </Text>
          ) : null}
          <Text style={[Typography.bodyMedium, styles.deviceName]}>
            {device.name}
          </Text>
          <Text style={[Typography.caption, styles.deviceCode]}>
            ID: {device.code}
          </Text>
        </View>

        {/* Options Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={() => onOptionsPress(device)}
          style={styles.moreButton}>
          <VectorIcon name="ellipsis-v" size={18} color={Colors.textGray} />
        </TouchableOpacity>
      </TouchableOpacity>
    </NeonCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 10,
    position: 'relative',
  },
  pinIconWrapper: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.appBg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoCol: {
    flex: 1,
  },
  nickname: {
    color: Colors.brandGreen,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  deviceName: {
    color: Colors.textWhite,
  },
  deviceCode: {
    color: Colors.textGray,
    fontFamily: Typography.monoTimer.fontFamily,
    marginTop: 2,
  },
  moreButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
