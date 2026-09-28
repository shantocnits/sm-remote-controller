import { Platform, ToastAndroid, Alert } from 'react-native';

// In-memory persistent ID and clipboard
let cachedDeviceId: string | null = null;
let inMemoryClipboard = '';

export const getDeviceId = (): string => {
  if (cachedDeviceId) return cachedDeviceId;
  // Deterministic 6 digit format: "XXX XXX"
  const part1 = Math.floor(100 + Math.random() * 900);
  const part2 = Math.floor(100 + Math.random() * 900);
  cachedDeviceId = `${part1} ${part2}`;
  return cachedDeviceId;
};

export const copyTextToClipboard = async (text: string, label = 'Copied to clipboard'): Promise<void> => {
  try {
    inMemoryClipboard = text;
    if (Platform.OS === 'android') {
      ToastAndroid.show(`${label}: ${text}`, ToastAndroid.SHORT);
    } else {
      Alert.alert('Copied', `${label}: ${text}`);
    }
  } catch (err) {
    if (Platform.OS === 'android') {
      ToastAndroid.show(`Copied: ${text}`, ToastAndroid.SHORT);
    }
  }
};

export const getClipboardText = async (): Promise<string> => {
  return inMemoryClipboard || '412 887';
};
