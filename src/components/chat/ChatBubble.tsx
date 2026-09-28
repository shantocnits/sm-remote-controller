import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { VectorIcon } from '../common/VectorIcon';
import { ChatMessage } from '../../types';

interface ChatBubbleProps {
  message: ChatMessage;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isSelf = message.sender === 'self';
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);

  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setPlayProgress((p) => {
          if (p >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return p + 20;
        });
      }, 500);
    } else {
      setPlayProgress(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying]);

  const togglePlayVoice = () => {
    setIsPlaying(!isPlaying);
  };

  const handleFilePress = () => {
    Alert.alert(
      message.fileName || 'Attachment',
      `Size: ${message.fileSize || '1.5 MB'}\nStatus: Downloaded and verified.`,
      [{ text: 'Open File', onPress: () => {} }, { text: 'Close', style: 'cancel' }]
    );
  };

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
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={togglePlayVoice}
              style={styles.voiceNoteRow}>
              <View
                style={[
                  styles.voicePlayBtn,
                  isSelf ? styles.voicePlayBtnSelf : styles.voicePlayBtnPartner,
                ]}>
                <Text style={isSelf ? styles.playIconSelf : styles.playIconPartner}>
                  {isPlaying ? '❚❚' : '▶'}
                </Text>
              </View>

              <View style={styles.voiceInfo}>
                <Text
                  style={[
                    styles.voiceDurationText,
                    isSelf ? styles.selfText : styles.partnerText,
                  ]}>
                  Voice message ({message.voiceDuration || '00:04'})
                </Text>
                {/* Simulated Audio Waveform / Progress */}
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${isPlaying ? playProgress : 100}%`,
                        backgroundColor: isSelf ? '#000000' : Colors.brandGreen,
                      },
                    ]}
                  />
                </View>
              </View>
            </TouchableOpacity>
          ) : message.imageUrl ? (
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: message.imageUrl }}
                style={styles.chatImage}
                resizeMode="cover"
              />
              {message.text ? (
                <Text
                  style={[
                    Typography.bodyRegular,
                    styles.imageCaption,
                    isSelf ? styles.selfText : styles.partnerText,
                  ]}>
                  {message.text}
                </Text>
              ) : null}
            </View>
          ) : message.fileName ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleFilePress}
              style={styles.fileCard}>
              <View style={styles.fileIconBox}>
                <VectorIcon name="clipboard" size={16} color={Colors.brandGreen} />
              </View>
              <View style={styles.fileTextCol}>
                <Text
                  style={[styles.fileNameText, isSelf ? styles.selfText : styles.partnerText]}
                  numberOfLines={1}>
                  {message.fileName}
                </Text>
                <Text style={styles.fileSizeText}>{message.fileSize || 'File Document'}</Text>
              </View>
            </TouchableOpacity>
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
    maxWidth: '78%',
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
    minWidth: 180,
  },
  voicePlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    fontWeight: '800',
  },
  playIconPartner: {
    color: Colors.brandGreen,
    fontSize: 12,
    fontWeight: '800',
  },
  voiceInfo: {
    flex: 1,
  },
  voiceDurationText: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  imageWrapper: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  chatImage: {
    width: 200,
    height: 140,
    borderRadius: 12,
  },
  imageCaption: {
    marginTop: 6,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 160,
  },
  fileIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileTextCol: {
    flex: 1,
  },
  fileNameText: {
    fontSize: 13,
    fontWeight: '700',
  },
  fileSizeText: {
    fontSize: 10,
    opacity: 0.7,
    marginTop: 2,
  },
});
