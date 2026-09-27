import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { VectorIcon } from '../common/VectorIcon';
import { ChatMessage } from '../../types';

interface ChatBubbleProps {
  message: ChatMessage;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isSelf = message.sender === 'self';

  return (
    <View style={[styles.row, isSelf ? styles.selfRow : styles.partnerRow]}>
      {!isSelf && (
        <View style={styles.partnerAvatar}>
          <VectorIcon name="mobile" size={14} color={Colors.brandGreen} />
        </View>
      )}

      <View style={[styles.bubbleCol, isSelf && styles.selfBubbleCol]}>
        <View
          style={[
            styles.bubble,
            isSelf ? styles.selfBubble : styles.partnerBubble,
          ]}>
          {message.isVoice ? (
            <View style={styles.voiceNoteRow}>
              <View
                style={[
                  styles.voicePlayBtn,
                  isSelf ? styles.voicePlayBtnSelf : styles.voicePlayBtnPartner,
                ]}>
                <Text style={isSelf ? styles.playIconSelf : styles.playIconPartner}>
                  ▶
                </Text>
              </View>
              <Text
                style={[
                  Typography.monoTimer,
                  isSelf ? styles.selfText : styles.partnerText,
                ]}>
                Voice message ({message.voiceDuration || '00:04'})
              </Text>
            </View>
          ) : (
            <Text
              style={[
                Typography.bodyRegular,
                isSelf ? styles.selfText : styles.partnerText,
              ]}>
              {message.text}
            </Text>
          )}
        </View>

        {/* Timestamp and delivery tick */}
        <View style={[styles.metaRow, isSelf && styles.selfMetaRow]}>
          <Text style={[Typography.micro, styles.timeText]}>{message.time}</Text>
          {isSelf && (
            <VectorIcon name="check-double" size={12} color={Colors.brandGreen} />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 14,
    gap: 8,
  },
  selfRow: {
    justifyContent: 'flex-end',
  },
  partnerRow: {
    justifyContent: 'flex-start',
  },
  partnerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginBottom: 16,
  },
  bubbleCol: {
    maxWidth: '75%',
  },
  selfBubbleCol: {
    alignItems: 'flex-end',
  },
  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  partnerBubble: {
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderBottomLeftRadius: 4,
  },
  selfBubble: {
    backgroundColor: Colors.brandGreen,
    borderBottomRightRadius: 4,
    shadowColor: Colors.brandGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  partnerText: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  selfText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginLeft: 4,
  },
  selfMetaRow: {
    justifyContent: 'flex-end',
    marginRight: 4,
  },
  timeText: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  voiceNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  voicePlayBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voicePlayBtnSelf: {
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  voicePlayBtnPartner: {
    backgroundColor: Colors.brandGreenSoft,
  },
  playIconSelf: {
    color: '#000000',
    fontSize: 12,
  },
  playIconPartner: {
    color: Colors.brandGreen,
    fontSize: 12,
  },
});
