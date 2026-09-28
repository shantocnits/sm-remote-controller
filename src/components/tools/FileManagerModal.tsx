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
import { Shadows } from '../../theme/shadows';

interface FileManagerModalProps {
  visible: boolean;
  onClose: () => void;
}

interface FileItem {
  id: string;
  name: string;
  size: string;
  date: string;
  type: 'image' | 'video' | 'doc' | 'audio' | 'apk';
}

export const FileManagerModal: React.FC<FileManagerModalProps> = ({
  visible,
  onClose,
}) => {
  const [activeFolder, setActiveFolder] = useState<'all' | 'gallery' | 'downloads' | 'docs'>('all');
  const [files, setFiles] = useState<FileItem[]>([
    {
      id: 'f1',
      name: 'IMG_20260928_124500.jpg',
      size: '3.4 MB',
      date: 'Today, 12:45 PM',
      type: 'image',
    },
    {
      id: 'f2',
      name: 'Client_Requirements.pdf',
      size: '1.2 MB',
      date: 'Today, 11:30 AM',
      type: 'doc',
    },
    {
      id: 'f3',
      name: 'Screen_Recording_2026.mp4',
      size: '24.8 MB',
      date: 'Yesterday, 04:12 PM',
      type: 'video',
    },
    {
      id: 'f4',
      name: 'sm-remote-controller.apk',
      size: '48.5 MB',
      date: '27 Sept 2026',
      type: 'apk',
    },
    {
      id: 'f5',
      name: 'Voice_Note_0928.aac',
      size: '840 KB',
      date: 'Today, 10:15 AM',
      type: 'audio',
    },
  ]);

  const handleAction = (file: FileItem) => {
    Alert.alert(
      file.name,
      `Size: ${file.size}\nDate: ${file.date}`,
      [
        {
          text: 'Send to Device',
          onPress: () => {
            const msg = `Sending "${file.name}" to connected device...`;
            if (Platform.OS === 'android') {
              ToastAndroid.show(msg, ToastAndroid.LONG);
            } else {
              Alert.alert('Sent', msg);
            }
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setFiles(files.filter((f) => f.id !== file.id));
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getFileIcon = (type: FileItem['type']) => {
    switch (type) {
      case 'image':
        return { name: 'image' as const, color: Colors.brandGreen };
      case 'video':
        return { name: 'camera' as const, color: '#60a5fa' };
      case 'doc':
        return { name: 'clipboard' as const, color: '#fb923c' };
      case 'audio':
        return { name: 'microphone' as const, color: '#c084fc' };
      case 'apk':
        return { name: 'apps' as const, color: '#facc15' };
      default:
        return { name: 'folder' as const, color: Colors.brandGreen };
    }
  };

  const filteredFiles = files.filter((file) => {
    if (activeFolder === 'gallery') return file.type === 'image' || file.type === 'video';
    if (activeFolder === 'downloads') return file.type === 'apk' || file.type === 'audio';
    if (activeFolder === 'docs') return file.type === 'doc';
    return true;
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.titleIconBox}>
                <VectorIcon name="folder" size={20} color={Colors.brandGreen} />
              </View>
              <div>
                <Text style={[Typography.titleMedium, styles.title]}>File Manager</Text>
                <Text style={styles.storageText}>Used: 42.8 GB / 128 GB</Text>
              </div>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <VectorIcon name="close" size={16} color={Colors.textWhite} />
            </TouchableOpacity>
          </View>

          {/* Storage Bar */}
          <View style={styles.storageBarBg}>
            <View style={styles.storageBarFill} />
          </View>

          {/* Folder Tabs */}
          <View style={styles.tabRow}>
            {(['all', 'gallery', 'downloads', 'docs'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.7}
                onPress={() => setActiveFolder(tab)}
                style={[styles.tabChip, activeFolder === tab && styles.tabChipActive]}>
                <Text style={[styles.tabText, activeFolder === tab && styles.tabTextActive]}>
                  {tab === 'all' ? 'All Files' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* File List */}
          <ScrollView style={styles.fileList} showsVerticalScrollIndicator={false}>
            {filteredFiles.map((file) => {
              const iconInfo = getFileIcon(file.type);
              return (
                <TouchableOpacity
                  key={file.id}
                  activeOpacity={0.7}
                  onPress={() => handleAction(file)}
                  style={styles.fileRow}>
                  <View style={[styles.fileIconBox, { borderColor: iconInfo.color + '40' }]}>
                    <VectorIcon name={iconInfo.name} size={18} color={iconInfo.color} />
                  </View>
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <Text style={styles.fileMeta}>
                      {file.size} • {file.date}
                    </Text>
                  </View>
                  <VectorIcon name="ellipsis-v" size={14} color={Colors.textGray} />
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
    borderColor: Colors.brandGreenBorder,
  },
  title: {
    color: Colors.textWhite,
    fontSize: 18,
    fontWeight: '700',
  },
  storageText: {
    color: Colors.brandGreen,
    fontSize: 11,
    fontWeight: '600',
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
  storageBarBg: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.appBg,
    marginBottom: 16,
    overflow: 'hidden',
  },
  storageBarFill: {
    width: '35%',
    height: '100%',
    backgroundColor: Colors.brandGreen,
    borderRadius: 3,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: Colors.appBg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  tabChipActive: {
    backgroundColor: Colors.brandGreen,
    borderColor: Colors.brandGreen,
  },
  tabText: {
    color: Colors.textGray,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#000000',
  },
  fileList: {
    maxHeight: 380,
  },
  fileRow: {
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
  fileIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    color: Colors.textWhite,
    fontSize: 13,
    fontWeight: '600',
  },
  fileMeta: {
    color: Colors.textGray,
    fontSize: 11,
    marginTop: 2,
  },
});
