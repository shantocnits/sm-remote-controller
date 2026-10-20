import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ToastAndroid,
  Platform,
  Alert,
  Animated,
  Easing,
  Linking,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { VectorIcon } from './VectorIcon';
import { checkForAppUpdates, UpdateInfo, compareVersions } from '../../services/updateService';
import { Shadows } from '../../theme/shadows';
import { useAppStore } from '../../store/useAppStore';

interface UpdateModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdateDownloaded?: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  onClose,
}) => {
  const { appVersion, setHasNewUpdate } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  // Spin animation for the modal checking icon
  const spinAnim = useRef(new Animated.Value(0)).current;

  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    hasUpdate: false,
    currentVersion: appVersion,
    latestVersion: appVersion,
    releaseDate: '20 Oct 2026',
    changelog: [
      '⚡ Dynamic real-time Device ID connection across any mobile phone',
      '🔄 Real-time bidirectional touch, keyboard, and navigation sync',
      '🗑️ Dynamic Recent Devices persistence (removed dummy devices, deletions stay deleted)',
      '🆔 Deterministic stable 6-digit Device ID per physical device',
      '📱 Real mobile model name detection & incoming connection alerts',
    ],
  });

  const startSpinAnimation = () => {
    spinAnim.setValue(0);
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };

  const check = async () => {
    setLoading(true);
    startSpinAnimation();
    try {
      const res = await checkForAppUpdates(appVersion);
      setUpdateInfo(res);
      setHasNewUpdate(Boolean(res.hasUpdate));
    } catch (e) {
      // ignore
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 600);
    }
  };

  useEffect(() => {
    if (visible) {
      setDownloadStarted(false);
      check();
    }
  }, [visible, appVersion]);

  // Real APK download action
  const handleDownloadUpdate = async () => {
    if (!updateInfo.downloadUrl) {
      Alert.alert('Download Error', 'No download URL available for this release.');
      return;
    }

    setIsDownloading(true);
    setDownloadStarted(true);

    try {
      const supported = await Linking.canOpenURL(updateInfo.downloadUrl);
      if (supported) {
        await Linking.openURL(updateInfo.downloadUrl);
        const msg = `📥 Downloading v${updateInfo.latestVersion} APK...\nOnce downloaded, tap the notification to install the update.`;
        if (Platform.OS === 'android') {
          ToastAndroid.show(msg, ToastAndroid.LONG);
        } else {
          Alert.alert('Download Started', msg);
        }
      } else {
        Alert.alert('Download Error', 'Cannot open download link on this device.');
      }
    } catch (err: any) {
      Alert.alert('Download Failed', err?.message || 'Could not launch browser to download APK.');
    } finally {
      setIsDownloading(false);
    }
  };

  const hasError = !!updateInfo.error && !loading;
  const isUpToDate =
    !hasError &&
    !loading &&
    (!updateInfo.hasUpdate || compareVersions(updateInfo.currentVersion, updateInfo.latestVersion) >= 0);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, Shadows.cardShadow]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconCircle,
                  isUpToDate && styles.iconCircleGreen,
                  hasError && { borderColor: '#ef4444' },
                ]}>
                {loading ? (
                  <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <VectorIcon name="update" size={20} color={Colors.brandGreen} />
                  </Animated.View>
                ) : hasError ? (
                  <VectorIcon name="alert" size={20} color="#ef4444" />
                ) : (
                  <VectorIcon
                    name={isUpToDate ? 'check' : 'download'}
                    size={20}
                    color={isUpToDate ? '#000000' : Colors.brandGreen}
                  />
                )}
              </View>
              <View>
                <Text style={[Typography.titleMedium, styles.title]}>App Updates</Text>
                <Text style={[styles.versionStatus, hasError && { color: '#ef4444' }]}>
                  {loading
                    ? 'Scanning GitHub for updates...'
                    : hasError
                    ? '⚠️ Connection / Repo Visibility Error'
                    : isUpToDate
                    ? '✓ You are on latest version'
                    : '🔥 New Update Available!'}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <VectorIcon name="close" size={16} color={Colors.textWhite} />
            </TouchableOpacity>
          </View>

          {/* Version Comparison Card */}
          <View style={styles.versionCard}>
            <View style={styles.versionCol}>
              <Text style={styles.versionLabel}>Current Version</Text>
              <Text style={styles.versionValue}>v{updateInfo.currentVersion}</Text>
            </View>

            <View style={styles.versionDivider} />

            <View style={styles.versionCol}>
              <Text style={styles.versionLabel}>Latest on GitHub</Text>
              <Text
                style={[
                  styles.versionValue,
                  { color: hasError ? '#ef4444' : Colors.brandGreen },
                ]}>
                {hasError ? 'Failed' : `v${updateInfo.latestVersion}`}
              </Text>
            </View>
          </View>

          {/* Post-Download Instructions Banner */}
          {downloadStarted && !isUpToDate && (
            <View style={styles.instructionBox}>
              <Text style={styles.instructionTitle}>📌 To complete update:</Text>
              <Text style={styles.instructionStep}>
                1. Pull down your phone's notification bar.
              </Text>
              <Text style={styles.instructionStep}>
                2. Tap on the downloaded <Text style={{ fontWeight: '700', color: Colors.brandGreen }}>SM_Remote_Controller.apk</Text>.
              </Text>
              <Text style={styles.instructionStep}>
                3. Tap <Text style={{ fontWeight: '700', color: Colors.textWhite }}>"Update"</Text> or <Text style={{ fontWeight: '700', color: Colors.textWhite }}>"Install"</Text> to apply.
              </Text>
            </View>
          )}

          {/* Changelog Title */}
          <View style={styles.changelogHeader}>
            <Text style={styles.changelogTitle}>
              {hasError ? 'Update Check Notice:' : "What's New in this Release:"}
            </Text>
            <TouchableOpacity
              onPress={check}
              disabled={loading}
              style={styles.refreshBtn}>
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <VectorIcon name="update" size={12} color={Colors.brandGreen} />
              </Animated.View>
              <Text style={styles.refreshText}>
                {loading ? 'Checking...' : 'Check Again'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Changelog List */}
          <ScrollView style={styles.changelogList} showsVerticalScrollIndicator={false}>
            {updateInfo.changelog.map((item, index) => (
              <View key={index} style={styles.changelogItem}>
                <Text style={[styles.bulletDot, hasError && { color: '#ef4444' }]}>•</Text>
                <Text style={[styles.changelogText, hasError && { color: '#e5e7eb' }]}>{item}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Action Buttons */}
          {hasError ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={check}
              disabled={loading}
              style={[styles.updateBtn, { backgroundColor: '#374151' }]}>
              <VectorIcon name="update" size={16} color="#ffffff" />
              <Text style={[styles.updateBtnText, { color: '#ffffff' }]}>
                {loading ? 'Checking...' : 'Retry Update Check'}
              </Text>
            </TouchableOpacity>
          ) : !isUpToDate ? (
            <View style={styles.actionButtonsCol}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleDownloadUpdate}
                disabled={isDownloading || loading}
                style={styles.updateBtn}>
                <VectorIcon name="download" size={16} color="#000000" />
                <Text style={styles.updateBtnText}>
                  {downloadStarted
                    ? `Re-download APK (v${updateInfo.latestVersion})`
                    : `Update Now (v${updateInfo.latestVersion})`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setHasNewUpdate(false);
                  onClose();
                }}
                style={styles.laterBtn}>
                <Text style={styles.laterBtnText}>Remind Me Later (Dismiss Badge)</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.upToDateBanner}>
              <VectorIcon name="check" size={16} color={Colors.brandGreen} />
              <Text style={styles.upToDateText}>
                You are on the latest version (v{updateInfo.currentVersion})
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 9999,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1c1c1e',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(45, 212, 191, 0.35)',
    padding: 20,
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.appBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.brandGreenBorder,
  },
  iconCircleGreen: {
    backgroundColor: Colors.brandGreen,
    borderColor: Colors.brandGreen,
  },
  title: {
    color: Colors.textWhite,
    fontSize: 18,
    fontWeight: '700',
  },
  versionStatus: {
    color: Colors.brandGreen,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardBgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionCard: {
    flexDirection: 'row',
    backgroundColor: Colors.appBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginBottom: 14,
  },
  versionCol: {
    flex: 1,
    alignItems: 'center',
  },
  versionDivider: {
    width: 1,
    backgroundColor: Colors.borderDark,
    marginVertical: 4,
  },
  versionLabel: {
    color: Colors.textGray,
    fontSize: 11,
    marginBottom: 4,
  },
  versionValue: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  instructionBox: {
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    padding: 12,
    marginBottom: 14,
  },
  instructionTitle: {
    color: Colors.brandGreen,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  instructionStep: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },
  changelogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  changelogTitle: {
    color: Colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  refreshText: {
    color: Colors.brandGreen,
    fontSize: 11,
    fontWeight: '600',
  },
  changelogList: {
    maxHeight: 150,
    backgroundColor: Colors.appBg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
  },
  changelogItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletDot: {
    color: Colors.brandGreen,
    fontSize: 16,
    lineHeight: 18,
    marginRight: 8,
  },
  changelogText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  actionButtonsCol: {
    gap: 8,
  },
  updateBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.brandGreen,
  },
  updateBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  laterBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  laterBtnText: {
    color: Colors.textGray,
    fontSize: 12,
    fontWeight: '600',
  },
  upToDateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
  },
  upToDateText: {
    color: Colors.brandGreen,
    fontSize: 13,
    fontWeight: '700',
  },
});
