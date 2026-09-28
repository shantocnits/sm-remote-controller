import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { VectorIcon } from '../common/VectorIcon';
import { useAppStore } from '../../store/useAppStore';

interface CallLogsModalProps {
  visible: boolean;
  onClose: () => void;
}

interface CallRecord {
  id: string;
  name: string;
  number: string;
  type: 'incoming' | 'outgoing' | 'missed';
  time: string;
  duration: string;
}

export const CallLogsModal: React.FC<CallLogsModalProps> = ({
  visible,
  onClose,
}) => {
  const { startAudioCall, startVideoCall } = useAppStore();

  const [calls] = useState<CallRecord[]>([
    {
      id: 'c1',
      name: 'Galaxy S23 Ultra',
      number: '+880 1712-345678',
      type: 'incoming',
      time: 'Today, 12:40 PM',
      duration: '04:12',
    },
    {
      id: 'c2',
      name: "Shanto's PC",
      number: '+880 1819-987654',
      type: 'outgoing',
      time: 'Today, 11:20 AM',
      duration: '02:45',
    },
    {
      id: 'c3',
      name: 'Remote Device 03',
      number: '+880 1911-001122',
      type: 'missed',
      time: 'Yesterday, 06:15 PM',
      duration: 'Missed',
    },
    {
      id: 'c4',
      name: 'Galaxy S23 Ultra',
      number: '+880 1712-345678',
      type: 'outgoing',
      time: '26 Sept, 03:30 PM',
      duration: '08:20',
    },
  ]);

  const handleCall = (record: CallRecord) => {
    Alert.alert(
      record.name,
      `Choose call type for ${record.name}:`,
      [
        {
          text: 'Audio Call',
          onPress: () => {
            onClose();
            startAudioCall();
          },
        },
        {
          text: 'Video Call',
          onPress: () => {
            onClose();
            startVideoCall();
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getCallIcon = (type: CallRecord['type']) => {
    switch (type) {
      case 'incoming':
        return { name: 'phone' as const, color: Colors.brandGreen, label: 'Incoming' };
      case 'outgoing':
        return { name: 'arrow-right' as const, color: '#60a5fa', label: 'Outgoing' };
      case 'missed':
        return { name: 'phone-slash' as const, color: Colors.dangerRed, label: 'Missed' };
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.titleIconBox}>
                <VectorIcon name="phone" size={20} color="#60a5fa" />
              </View>
              <div>
                <Text style={[Typography.titleMedium, styles.title]}>Call History</Text>
                <Text style={styles.subtitle}>Recent Remote Voice & Video Calls</Text>
              </div>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <VectorIcon name="close" size={16} color={Colors.textWhite} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.callList} showsVerticalScrollIndicator={false}>
            {calls.map((call) => {
              const iconInfo = getCallIcon(call.type);
              return (
                <TouchableOpacity
                  key={call.id}
                  activeOpacity={0.7}
                  onPress={() => handleCall(call)}
                  style={styles.callRow}>
                  <View style={[styles.callIconBox, { borderColor: iconInfo.color + '40' }]}>
                    <VectorIcon name={iconInfo.name} size={16} color={iconInfo.color} />
                  </View>
                  <View style={styles.callInfo}>
                    <Text style={styles.callerName}>{call.name}</Text>
                    <Text style={[styles.callMeta, call.type === 'missed' && { color: Colors.dangerRed }]}>
                      {iconInfo.label} • {call.duration} • {call.time}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleCall(call)}
                    style={styles.callActionBtn}>
                    <VectorIcon name="phone" size={14} color={Colors.brandGreen} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.35)',
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.appBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
  },
  title: {
    color: Colors.textWhite,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textGray,
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callList: {
    maxHeight: 360,
  },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: Colors.appBg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  callIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 12,
  },
  callInfo: {
    flex: 1,
  },
  callerName: {
    color: Colors.textWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  callMeta: {
    color: Colors.textGray,
    fontSize: 11,
    marginTop: 3,
  },
  callActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.brandGreenBorder,
  },
});
