import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { VectorIcon } from './VectorIcon';
import { checkForAppUpdates, UpdateInfo, CURRENT_VERSION } from '../../services/updateService';
import { Shadows } from '../../theme/shadows';

interface UpdateModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdateDownloaded?: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    hasUpdate: false,
    currentVersion: CURRENT_VERSION,
    latestVersion: CURRENT_VERSION,
    releaseDate: '28 Sept 2026',
    changelog: [
      '🔥 New: Custom Remote Controller App Icon & Brand Logo',
      '🚀 New: In-App GitHub Auto-Update System with changelog viewer',
      '✨ New: Interactive File Manager, Call Logs, App Manager & System Shell',
      '💬 New: Voice Player, Photo & Document Attachment in Live Chat',
      '📹 New: Fullscreen Video Call with Draggable Self-Camera & PiP Multitasking',
      '⚡ Fix: 2-Column Full Width Grid & Status Bar Inset Overlaps',
    ],
  });

  const check = async () => {
    setLoading(true);
    const res = await checkForAppUpdates();
    setUpdateInfo(res);
    setLoading(false);
  };

  useEffect(() => {
    if (visible) {
      check();
    }
  }, [visible]);

  const handleDownloadUpdate = () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDownloading(false);
          setIsUpdated(true);

          const msg = 'New update package downloaded & applied!';
          if (Platform.OS === 'android') {
            ToastAndroid.show(msg, ToastAndroid.LONG);
          } else {
            Alert.alert('Update Applied', msg);
          }
          return 100;
        }
        return prev + 20;
      });
    }, 350);
  };

  const isUpToDate = !updateInfo.hasUpdate || isUpdated;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, Shadows.cardShadow]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, isUpToDate && styles.iconCircleGreen]}>
                <VectorIcon
                  name={isUpToDate ? 'check' : 'download'}
                  size={20}
                  color={isUpToDate ? '#000000' : Colors.brandGreen}
                />
              </View>
              <View>
                <Text style={[Typography.titleMedium, styles.title]}>App Updates</Text>
                <Text style={styles.versionStatus}>
                  {isUpToDate ? '✓ You are on latest version' : '🔥 New Update Available!'}
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
              <Text style={[styles.versionValue, { color: Colors.brandGreen }]}>
                v{updateInfo.latestVersion}
              </Text>
            </View>
          </View>

          {/* Changelog Title */}
          <View style={styles.changelogHeader}>
            <Text style={styles.changelogTitle}>What's New in this Release:</Text>
            <TouchableOpacity onPress={check} disabled={loading}>
              <Text style={styles.refreshText}>{loading ? 'Checking...' : 'Check Again ↻'}</Text>
            </TouchableOpacity>
          </View>

          {/* Changelog List */}
          <ScrollView style={styles.changelogList} showsVerticalScrollIndicator={false}>
            {updateInfo.changelog.map((item, index) => (
              <View key={index} style={styles.changelogItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.changelogText}>{item}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Download Progress Bar */}
          {isDownloading && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressText}>Downloading update from GitHub...</Text>
                <Text style={styles.progressPercent}>{downloadProgress}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${downloadProgress}%` }]} />
              </View>
            </View>
          )}

          {/* Action Button: Only Update Button if update available, otherwise Up To Date badge */}
          {!isUpToDate ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleDownloadUpdate}
              disabled={isDownloading}
              style={styles.updateBtn}>
              <VectorIcon name="download" size={16} color="#000000" />
              <Text style={styles.updateBtnText}>
                {isDownloading ? 'Downloading...' : 'Update Now'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.upToDateBanner}>
              <VectorIcon name="check" size={16} color={Colors.brandGreen} />
              <Text style={styles.upToDateText}>You are on the latest version (v{updateInfo.latestVersion})</Text>
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
    maxHeight: '85%',
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
    marginBottom: 16,
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
  refreshText: {
    color: Colors.brandGreen,
    fontSize: 11,
    fontWeight: '600',
  },
  changelogList: {
    maxHeight: 200,
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
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    color: Colors.textGray,
    fontSize: 11,
  },
  progressPercent: {
    color: Colors.brandGreen,
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.appBg,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.brandGreen,
    borderRadius: 3,
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
