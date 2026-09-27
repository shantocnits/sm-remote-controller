import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { VectorIcon } from '../common/VectorIcon';
import { useAppStore } from '../../store/useAppStore';

interface ChatHeaderProps {
  onBack: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onBack }) => {
  const { startAudioCall, startVideoCall } = useAppStore();

  return (
    <View style={styles.header}>
      {/* Back and Avatar Info */}
      <View style={styles.leftCol}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          style={styles.backButton}>
          <VectorIcon name="arrow-left" size={20} color={Colors.textGray} />
        </TouchableOpacity>

        <View style={styles.avatarWrapper}>
          <View style={styles.avatarPlaceholder}>
            <VectorIcon name="mobile" size={20} color={Colors.brandGreen} />
          </View>
          <View style={styles.activeDot} />
        </View>

        <View style={styles.infoCol}>
          <Text style={[Typography.bodyMedium, styles.partnerName]}>
            Galaxy S23 Ultra
          </Text>
          <Text style={[Typography.caption, styles.activeStatus]}>Active now</Text>
        </View>
      </View>

      {/* Audio & Video Call buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={startAudioCall}
          style={styles.actionBtn}>
          <VectorIcon name="phone" size={16} color={Colors.brandGreen} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={startVideoCall}
          style={styles.actionBtn}>
          <VectorIcon name="video" size={16} color={Colors.brandGreen} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 6,
    marginRight: 6,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.appBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  activeDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.brandGreen,
    borderWidth: 2,
    borderColor: Colors.cardBg,
  },
  infoCol: {
    justifyContent: 'center',
  },
  partnerName: {
    color: Colors.textWhite,
    fontSize: 14,
  },
  activeStatus: {
    color: Colors.brandGreen,
    fontSize: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.appBg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
