import React, { useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { ChatHeader } from '../components/chat/ChatHeader';
import { ChatBubble } from '../components/chat/ChatBubble';
import { ChatInputBar } from '../components/chat/ChatInputBar';
import { VoiceRecordBar } from '../components/chat/VoiceRecordBar';
import { AudioCallBanner } from '../components/overlays/AudioCallBanner';
import { useAppStore } from '../store/useAppStore';

export const ChatScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { messages, setActiveTab, isVoiceRecording } = useAppStore();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Auto scroll to latest message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Math.max(insets.top, 10) },
      ]}>
      {/* Header */}
      <ChatHeader onBack={() => setActiveTab('tools')} />

      {/* Audio Call Banner (Displays when audio call is active) */}
      <AudioCallBanner />

      {/* Message List */}
      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={[
            styles.messageList,
            { paddingBottom: Math.max(insets.bottom + 10, 16) },
          ]}
          showsVerticalScrollIndicator={false}
        />

        {/* Input Bar or Voice Recording Bar */}
        {isVoiceRecording ? <VoiceRecordBar /> : <ChatInputBar />}
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  flexOne: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    justifyContent: 'flex-end',
  },
});
