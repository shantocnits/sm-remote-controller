import React from 'react';
import { Text, StyleSheet } from 'react-native';

export type IconName =
  | 'bars'
  | 'mobile'
  | 'desktop'
  | 'laptop'
  | 'copy'
  | 'keyboard'
  | 'arrow-right'
  | 'thumbtack'
  | 'ellipsis-v'
  | 'trash'
  | 'camera'
  | 'microphone'
  | 'record'
  | 'phone-slash'
  | 'phone'
  | 'video'
  | 'video-slash'
  | 'compress'
  | 'expand'
  | 'folder'
  | 'clipboard'
  | 'chat'
  | 'apps'
  | 'terminal'
  | 'arrow-left'
  | 'plus'
  | 'image'
  | 'paper-plane'
  | 'check-double'
  | 'search'
  | 'home'
  | 'tools';

interface VectorIconProps {
  name: IconName;
  size?: number;
  color?: string;
}

// Icon symbol mappings (Clean unicode & visual symbols for instant rendering)
const ICON_MAP: Record<IconName, string> = {
  bars: '☰',
  mobile: '📱',
  desktop: '🖥',
  laptop: '💻',
  copy: '📋',
  keyboard: '⌨',
  'arrow-right': '➜',
  thumbtack: '📌',
  'ellipsis-v': '⋮',
  trash: '🗑',
  camera: '📷',
  microphone: '🎤',
  record: '⏺',
  'phone-slash': '📵',
  phone: '📞',
  video: '📹',
  'video-slash': '🚫',
  compress: '⤢',
  expand: '⤡',
  folder: '📁',
  clipboard: '📋',
  chat: '💬',
  apps: '❖',
  terminal: '⌨',
  'arrow-left': '←',
  plus: '＋',
  image: '🖼',
  'paper-plane': '➤',
  'check-double': '✓✓',
  search: '🔍',
  home: '🏠',
  tools: '🛠',
};

export const VectorIcon: React.FC<VectorIconProps> = ({
  name,
  size = 18,
  color = '#ffffff',
}) => {
  return (
    <Text
      allowFontScaling={false}
      style={[
        styles.iconText,
        {
          fontSize: size,
          color,
          lineHeight: size + 4,
        },
      ]}>
      {ICON_MAP[name] || '•'}
    </Text>
  );
};

const styles = StyleSheet.create({
  iconText: {
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
