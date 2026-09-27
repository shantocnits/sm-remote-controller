import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { ToolsHeader } from '../components/tools/ToolsHeader';
import { ToolGridItem, ToolItemData } from '../components/tools/ToolGridItem';
import { useAppStore } from '../store/useAppStore';

export const ToolsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { setActiveTab } = useAppStore();

  const handleToolPress = (toolName: string) => {
    Alert.alert(toolName, `${toolName} module initialized.`);
  };

  const tools: ToolItemData[] = [
    {
      id: 'file-manager',
      title: 'File Manager',
      subtitle: 'Access Gallery & Storage',
      icon: 'folder',
      iconColor: Colors.iconFolder,
      onPress: () => handleToolPress('File Manager'),
    },
    {
      id: 'call-logs',
      title: 'Call Logs',
      subtitle: 'View Call History',
      icon: 'phone',
      iconColor: Colors.iconPhone,
      onPress: () => handleToolPress('Call Logs'),
    },
    {
      id: 'clipboard',
      title: 'Clipboard',
      subtitle: 'Copy, Paste & Sync',
      icon: 'clipboard',
      iconColor: Colors.iconClipboard,
      onPress: () => handleToolPress('Clipboard & Transfer'),
    },
    {
      id: 'live-chat',
      title: 'Live Chat',
      subtitle: 'Send Text & Voice Msg',
      icon: 'chat',
      iconColor: Colors.iconChat,
      onPress: () => setActiveTab('chat'), // Directly navigates to Chat tab
    },
    {
      id: 'app-manager',
      title: 'App Manager',
      subtitle: 'Manage Installed Apps',
      icon: 'apps',
      iconColor: Colors.iconApps,
      onPress: () => handleToolPress('App Manager'),
    },
    {
      id: 'system-shell',
      title: 'System Shell',
      subtitle: 'Remote Terminal Access',
      icon: 'terminal',
      iconColor: Colors.iconTerminal,
      onPress: () => handleToolPress('System Shell'),
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 10, 16) }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ToolsHeader onSearchPress={() => handleToolPress('Search Tools')} />

        <View style={styles.grid}>
          {tools.map((tool) => (
            <ToolGridItem key={tool.id} tool={tool} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
});
