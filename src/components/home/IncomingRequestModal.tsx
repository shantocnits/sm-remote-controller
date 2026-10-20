import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Shadows } from '../../theme/shadows';
import { VectorIcon } from '../common/VectorIcon';
import { useAppStore } from '../../store/useAppStore';

export const IncomingRequestModal: React.FC = () => {
  const incomingRequest = useAppStore((state) => state.incomingRequest);
  const acceptIncomingRequest = useAppStore((state) => state.acceptIncomingRequest);
  const rejectIncomingRequest = useAppStore((state) => state.rejectIncomingRequest);

  React.useEffect(() => {
    if (incomingRequest) {
      try {
        Vibration.vibrate([0, 250, 150, 250]);
      } catch {}
    }
  }, [incomingRequest]);

  if (!incomingRequest) return null;

  const formattedId =
    incomingRequest.fromId.length === 6
      ? `${incomingRequest.fromId.slice(0, 3)} ${incomingRequest.fromId.slice(3)}`
      : incomingRequest.fromId;

  return (
    <Modal visible={true} transparent animationType="slide" onRequestClose={rejectIncomingRequest}>
      <View style={styles.overlay}>
        <View style={[styles.card, Shadows.cardShadow]}>
          {/* Header Icon */}
          <View style={styles.iconCircle}>
            <VectorIcon name="shield" size={32} color={Colors.brandGreen} />
          </View>

          <Text style={[Typography.titleMedium, styles.title]}>Incoming Connection Request</Text>
          <Text style={styles.subtitle}>
            A remote device wants to connect to your phone (AnyDesk style)
          </Text>

          {/* Device Info Card */}
          <View style={styles.deviceCard}>
            <View style={styles.deviceRow}>
              <View style={styles.deviceIconBox}>
                <VectorIcon name="mobile" size={24} color={Colors.brandGreen} />
              </View>
              <View style={styles.deviceDetails}>
                <Text style={styles.deviceName}>{incomingRequest.fromName || 'Remote Mobile'}</Text>
                <Text style={styles.deviceId}>ID: {formattedId}</Text>
              </View>
            </View>
          </View>

          {/* Security Warning */}
          <View style={styles.warningBox}>
            <VectorIcon name="alert" size={18} color="#f59e0b" />
            <Text style={styles.warningText}>
              Accepting will allow this remote device to view and control your screen. Only accept if you trust this person.
            </Text>
          </View>

          {/* Actions: Decline & Accept */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.declineBtn}
              activeOpacity={0.8}
              onPress={rejectIncomingRequest}>
              <VectorIcon name="close" size={16} color="#ef4444" />
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptBtn}
              activeOpacity={0.8}
              onPress={acceptIncomingRequest}>
              <VectorIcon name="check" size={16} color="#000000" />
              <Text style={styles.acceptBtnText}>Accept &amp; Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 999999,
  },
  card: {
    width: '100%',
    backgroundColor: '#16191f',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(45, 212, 191, 0.45)',
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    borderWidth: 1.5,
    borderColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: Colors.textWhite,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 18,
  },
  deviceCard: {
    width: '100%',
    backgroundColor: Colors.appBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginBottom: 14,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deviceIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.25)',
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    color: Colors.textWhite,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  deviceId: {
    color: Colors.brandGreen,
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: 22,
  },
  warningText: {
    flex: 1,
    color: '#fbbf24',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  declineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.6)',
  },
  declineBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
  acceptBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.brandGreen,
  },
  acceptBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
});
