import { Platform, ToastAndroid, Alert } from 'react-native';

// In-memory cached ID and clipboard
let cachedDeviceId: string | null = null;
let cachedDeviceName: string | null = null;
let inMemoryClipboard = '';

/**
 * Generate a deterministic 6-digit device ID from hardware fingerprint or stable seed
 * Format: "XXX XXX" (e.g. "586 278")
 */
export const getDeviceId = (): string => {
  if (cachedDeviceId) return cachedDeviceId;

  try {
    const constants: any = Platform.constants || {};
    const seed =
      constants.Fingerprint ||
      `${constants.Brand || ''}-${constants.Model || ''}-${constants.Manufacturer || ''}-${constants.Release || ''}` ||
      'SM_DEVICE_SEED_FALLBACK';

    let hash = 5381;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) + hash) + seed.charCodeAt(i);
      hash = hash & hash;
    }

    const positive = Math.abs(hash);
    const sixDigit = (positive % 900000) + 100000;
    const str = sixDigit.toString();
    cachedDeviceId = `${str.slice(0, 3)} ${str.slice(3)}`;
  } catch (err) {
    cachedDeviceId = '586 278';
  }

  return cachedDeviceId;
};

export const getCleanDeviceId = (): string => {
  return getDeviceId().replace(/\s+/g, '');
};

/**
 * Returns human-readable device model name (e.g. "Samsung Galaxy S23" or "Xiaomi Redmi Note 12")
 */
export const getDeviceName = (): string => {
  if (cachedDeviceName) return cachedDeviceName;

  try {
    const constants: any = Platform.constants || {};
    const brand = constants.Brand || constants.Manufacturer || '';
    const model = constants.Model || '';

    if (brand && model) {
      const formattedBrand = brand.charAt(0).toUpperCase() + brand.slice(1);
      if (model.toLowerCase().startsWith(brand.toLowerCase())) {
        cachedDeviceName = model;
      } else {
        cachedDeviceName = `${formattedBrand} ${model}`;
      }
    } else if (model) {
      cachedDeviceName = model;
    } else {
      cachedDeviceName = 'Android Mobile';
    }
  } catch (e) {
    cachedDeviceName = 'Android Mobile';
  }

  return cachedDeviceName || 'Android Mobile';
};

export const copyTextToClipboard = async (
  text: string,
  label = 'Copied to clipboard'
): Promise<void> => {
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
  return inMemoryClipboard || '';
};
