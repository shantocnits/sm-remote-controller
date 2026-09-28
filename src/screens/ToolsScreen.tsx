import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { ToolsHeader } from '../components/tools/ToolsHeader';
import { ToolGridItem, ToolItemData } from '../components/tools/ToolGridItem';
import { ToolsSearchModal } from '../components/tools/ToolsSearchModal';
import { FileManagerModal } from '../components/tools/FileManagerModal';
import { CallLogsModal } from '../components/tools/CallLogsModal';
import { ClipboardModal } from '../components/tools/ClipboardModal';
import { AppManagerModal } from '../components/tools/AppManagerModal';
import { SystemShellModal } from '../components/tools/SystemShellModal';
import { useAppStore } from '../store/useAppStore';
import { ActiveToolModal } from '../types';

export const ToolsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { setActiveTab } = useAppStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveToolModal>('none');

  const tools: ToolItemData[] = [
    {
      id: 'file-manager',
      title: 'File Manager',
      subtitle: 'Access Gallery & Storage',
      icon: 'folder',
      iconColor: Colors.iconFolder,
      onPress: () => setActiveModal('file-manager'),
    },
    {
      id: 'call-logs',
      title: 'Call Logs',
      subtitle: 'View Call History',
      icon: 'phone',
      iconColor: Colors.iconPhone,
      onPress: () => setActiveModal('call-logs'),
    },
    {
      id: 'clipboard',
      title: 'Clipboard',
      subtitle: 'Copy, Paste & File Sync',
      icon: 'clipboard',
      iconColor: Colors.iconClipboard,
      onPress: () => setActiveModal('clipboard'),
    },
    {
      id: 'live-chat',
      title: 'Live Chat',
      subtitle: 'Send Text & Voice Msg',
      icon: 'chat',
      iconColor: Colors.iconChat,
      onPress: () => setActiveTab('chat'), // Directly navigates to Messenger-style Live Chat
    },
    {
      id: 'app-manager',
      title: 'App Manager',
      subtitle: 'Manage Installed Apps',
      icon: 'apps',
      iconColor: Colors.iconApps,
      onPress: () => setActiveModal('app-manager'),
    },
    {
      id: 'system-shell',
      title: 'System Shell',
      subtitle: 'Remote Terminal Access',
      icon: 'terminal',
      iconColor: Colors.iconTerminal,
      onPress: () => setActiveModal('system-shell'),
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 10, 16) }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ToolsHeader onSearchPress={() => setIsSearchOpen(true)} />

        <View style={styles.grid}>
          {tools.map((tool) => (
            <ToolGridItem key={tool.id} tool={tool} />
          ))}
        </View>
      </ScrollView>

      {/* Search Popup / Modal */}
      <ToolsSearchModal
        visible={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        tools={tools}
        onSelectTool={(tool) => tool.onPress()}
      />

      {/* Dynamic Tool Modals */}
      <FileManagerModal
        visible={activeModal === 'file-manager'}
        onClose={() => setActiveModal('none')}
      />

      <CallLogsModal
        visible={activeModal === 'call-logs'}
        onClose={() => setActiveModal('none')}
      />

      <ClipboardModal
        visible={activeModal === 'clipboard'}
        onClose={() => setActiveModal('none')}
      />

      <AppManagerModal
        visible={activeModal === 'app-manager'}
        onClose={() => setActiveModal('none')}
      />

      <SystemShellModal
        visible={activeModal === 'system-shell'}
        onClose={() => setActiveModal('none')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
});
