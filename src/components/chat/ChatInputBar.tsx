import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Keyboard } from 'react-native';
import { Colors } from '../../theme/colors';
import { VectorIcon } from '../common/VectorIcon';
import { useAppStore } from '../../store/useAppStore';

export const ChatInputBar: React.FC = () => {
  const [text, setText] = useState('');
  const { sendMessage, startVoiceRecording } = useAppStore();

  const handleSend = () => {
    if (text.trim()) {
      sendMessage(text);
      setText('');
      Keyboard.dismiss();
    }
  };

  return (
    <View style={styles.container}>
      {/* Plus Attachment */}
      <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn}>
        <VectorIcon name="plus" size={20} color={Colors.brandGreen} />
      </TouchableOpacity>

      {/* Image Attachment */}
      <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn}>
        <VectorIcon name="image" size={18} color={Colors.brandGreen} />
      </TouchableOpacity>

      {/* Text Input */}
      <View style={styles.inputWrapper}>
        <TextInput
          placeholder="Message..."
          placeholderTextColor={Colors.textGray}
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          style={styles.textInput}
        />
      </View>

      {/* Mic / Send Button */}
      {text.trim().length > 0 ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSend}
          style={styles.actionBtn}>
          <VectorIcon name="paper-plane" size={16} color="#000000" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={startVoiceRecording}
          style={styles.actionBtn}>
          <VectorIcon name="microphone" size={18} color="#000000" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDark,
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: Colors.appBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    paddingHorizontal: 16,
    height: 44,
    justifyContent: 'center',
  },
  textInput: {
    color: Colors.textWhite,
    fontSize: 14,
    paddingVertical: 0,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
