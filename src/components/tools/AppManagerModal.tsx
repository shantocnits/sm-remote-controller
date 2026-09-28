import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
  ToastAndroid,
  Platform,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { VectorIcon } from '../common/VectorIcon';

interface AppManagerModalProps {
  visible: boolean;
  onClose: () => void;
}

interface InstalledApp {
  id: string;
  name: string;
  packageName: string;
  version: string;
  size: string;
  isSystem?: boolean;
}

export const AppManagerModal: React.FC<AppManagerModalProps> = ({
  visible,
  onClose,
}) => {
  const [apps, setApps] = useState<InstalledApp[]>([
    {
      id: 'app-1',
      name: 'SM Controller',
      packageName: 'com.helloworld',
      version: '1.0.0',
      size: '38.4 MB',
    },
    {
      id: 'app-2',
      name: 'WhatsApp',
      packageName: 'com.whatsapp',
      version: '2.24.18',
      size: '85.2 MB',
    },
    {
      id: 'app-3',
      name: 'Chrome Browser',
      packageName: 'com.android.chrome',
      version: '128.0.66',
      size: '142.0 MB',
    },
    {
      id: 'app-4',
      name: 'Telegram',
      packageName: 'org.telegram.messenger',
      version: '10.12.0',
      size: '64.8 MB',
    },
    {
      id: 'app-5',
      name: 'YouTube',
      packageName: 'com.google.android.youtube',
      version: '19.34.42',
      size: '110.5 MB',
      isSystem: true,
    },
  ]);

  const handleAppAction = (app: InstalledApp) => {
    Alert.alert(
      app.name,
      `Package: ${app.packageName}\nVersion: ${app.version}\nSize: ${app.size}`,
      [
        {
          text: 'Launch on Device',
          onPress: () => {
            const msg = `Launching "${app.name}" on connected device...`;
            if (Platform.OS === 'android') {
              ToastAndroid.show(msg, ToastAndroid.SHORT);
            } else {
              Alert.alert('Launched', msg);
            }
          },
        },
        {
          text: 'Backup APK',
          onPress: () => {
            const msg = `Extracting APK for "${app.name}"...`;
            if (Platform.OS === 'android') {
              ToastAndroid.show(msg, ToastAndroid.SHORT);
            } else {
              Alert.alert('Backup', msg);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.titleIconBox}>
                <VectorIcon name="apps" size={20} color="#facc15" />
              </View>
              <div>
                <Text style={[Typography.titleMedium, styles.title]}>App Manager</Text>
                <Text style={styles.subtitle}>{apps.length} Installed Applications</Text>
              </div>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <VectorIcon name="close" size={16} color={Colors.textWhite} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.appList} showsVerticalScrollIndicator={false}>
            {apps.map((app) => (
              <TouchableOpacity
                key={app.id}
                activeOpacity={0.7}
                onPress={() => handleAppAction(app)}
                style={styles.appRow}>
                <View style={styles.appIconBox}>
                  <VectorIcon name="apps" size={18} color="#facc15" />
                </View>
                <View style={styles.appInfo}>
                  <Text style={styles.appName}>{app.name}</Text>
                  <Text style={styles.appMeta} numberOfLines={1}>
                    v{app.version} • {app.size} • {app.packageName}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleAppAction(app)}
                  style={styles.launchBtn}>
                  <Text style={styles.launchBtnText}>Manage</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
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
    borderColor: 'rgba(250, 204, 21, 0.35)',
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    borderColor: 'rgba(250, 204, 21, 0.4)',
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
  appList: {
    maxHeight: 380,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: Colors.appBg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  appIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.3)',
    marginRight: 12,
  },
  appInfo: {
    flex: 1,
    marginRight: 10,
  },
  appName: {
    color: Colors.textWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  appMeta: {
    color: Colors.textGray,
    fontSize: 11,
    marginTop: 2,
  },
  launchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.cardBgLight,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  launchBtnText: {
    color: Colors.brandGreen,
    fontSize: 11,
    fontWeight: '700',
  },
});
