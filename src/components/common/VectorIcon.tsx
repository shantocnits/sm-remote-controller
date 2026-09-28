import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

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
  | 'tools'
  | 'close'
  | 'update'
  | 'check'
  | 'download';

interface VectorIconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: any;
}

export const VectorIcon: React.FC<VectorIconProps> = ({
  name,
  size = 18,
  color = '#ffffff',
  style,
}) => {
  try {
    switch (name) {
      case 'bars':
        return <FontAwesome6 name="bars" size={size} color={color} style={style} />;
      case 'mobile':
        return <FontAwesome6 name="mobile-screen" size={size} color={color} style={style} />;
      case 'desktop':
        return <FontAwesome6 name="desktop" size={size} color={color} style={style} />;
      case 'laptop':
        return <FontAwesome6 name="laptop" size={size} color={color} style={style} />;
      case 'copy':
        return <FontAwesome6 name="copy" regular size={size} color={color} style={style} />;
      case 'keyboard':
        return <FontAwesome6 name="keyboard" regular size={size} color={color} style={style} />;
      case 'arrow-right':
        return <FontAwesome6 name="arrow-right" size={size} color={color} style={style} />;
      case 'thumbtack':
        return <FontAwesome6 name="thumbtack" size={size} color={color} style={style} />;
      case 'ellipsis-v':
        return <FontAwesome6 name="ellipsis-vertical" size={size} color={color} style={style} />;
      case 'trash':
        return <FontAwesome6 name="trash-can" regular size={size} color={color} style={style} />;
      case 'camera':
        return <FontAwesome6 name="camera" size={size} color={color} style={style} />;
      case 'microphone':
        return <FontAwesome6 name="microphone" size={size} color={color} style={style} />;
      case 'record':
        return <FontAwesome6 name="circle-dot" size={size} color={color} style={style} />;
      case 'phone-slash':
        return <FontAwesome6 name="phone-slash" size={size} color={color} style={style} />;
      case 'phone':
        return <FontAwesome6 name="phone" size={size} color={color} style={style} />;
      case 'video':
        return <FontAwesome6 name="video" size={size} color={color} style={style} />;
      case 'video-slash':
        return <FontAwesome6 name="video-slash" size={size} color={color} style={style} />;
      case 'compress':
        return <FontAwesome6 name="compress" size={size} color={color} style={style} />;
      case 'expand':
        return <FontAwesome6 name="expand" size={size} color={color} style={style} />;
      case 'folder':
        return <FontAwesome6 name="folder-open" size={size} color={color} style={style} />;
      case 'clipboard':
        return <FontAwesome6 name="clipboard-list" size={size} color={color} style={style} />;
      case 'chat':
        return <FontAwesome6 name="comment-dots" size={size} color={color} style={style} />;
      case 'apps':
        return <FontAwesome6 name="google-play" brand size={size} color={color} style={style} />;
      case 'terminal':
        return <FontAwesome6 name="terminal" size={size} color={color} style={style} />;
      case 'arrow-left':
        return <FontAwesome6 name="arrow-left" size={size} color={color} style={style} />;
      case 'plus':
        return <FontAwesome6 name="plus" size={size} color={color} style={style} />;
      case 'image':
        return <FontAwesome6 name="image" regular size={size} color={color} style={style} />;
      case 'paper-plane':
        return <FontAwesome6 name="paper-plane" size={size} color={color} style={style} />;
      case 'check-double':
        return <FontAwesome6 name="check-double" size={size} color={color} style={style} />;
      case 'search':
        return <FontAwesome6 name="magnifying-glass" size={size} color={color} style={style} />;
      case 'home':
        return <FontAwesome6 name="house-chimney" size={size} color={color} style={style} />;
      case 'tools':
        return <FontAwesome6 name="toolbox" size={size} color={color} style={style} />;
      case 'close':
        return <FontAwesome6 name="xmark" size={size} color={color} style={style} />;
      case 'update':
        return <FontAwesome6 name="arrows-rotate" size={size} color={color} style={style} />;
      case 'download':
        return <FontAwesome6 name="cloud-arrow-down" size={size} color={color} style={style} />;
      case 'check':
        return <FontAwesome6 name="check" size={size} color={color} style={style} />;
      default:
        return <FontAwesome6 name="circle-info" size={size} color={color} style={style} />;
    }
  } catch (err) {
    return <Text style={{ color, fontSize: size }}>•</Text>;
  }
};
