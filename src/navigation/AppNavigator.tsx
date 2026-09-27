import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { HomeScreen } from '../screens/HomeScreen';
import { RemoteScreen } from '../screens/RemoteScreen';
import { ToolsScreen } from '../screens/ToolsScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { FloatingBottomNav } from '../components/navigation/FloatingBottomNav';
import { VideoRingingModal } from '../components/overlays/VideoRingingModal';
import { FullScreenVideoCall } from '../components/overlays/FullScreenVideoCall';
import { PipVideoCall } from '../components/overlays/PipVideoCall';
import { useAppStore } from '../store/useAppStore';

export const AppNavigator: React.FC = () => {
  const { activeTab } = useAppStore();

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'remote':
        return <RemoteScreen />;
      case 'tools':
        return <ToolsScreen />;
      case 'chat':
        return <ChatScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Active Screen View */}
      {renderActiveScreen()}

      {/* Dynamic Floating Bottom Pill Navigation */}
      <FloatingBottomNav />

      {/* Global Call Overlays */}
      <VideoRingingModal />
      <FullScreenVideoCall />
      <PipVideoCall />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
});
