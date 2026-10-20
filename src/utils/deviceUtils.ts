import { Platform, ToastAndroid, Alert, Dimensions } from 'react-native';

export interface DeviceIdentity {
  internalId: string;
  pairingCode: string;
  cleanCode: string;
  deviceName: string;
  platform: string;
  width: number;
  height: number;
}

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
 * Maps known model code prefixes to user-friendly consumer names
 */
const friendlyModelMap: Record<string, string> = {
  'SM-S918': 'Galaxy S23 Ultra',
  'SM-S911': 'Galaxy S23',
  'SM-S908': 'Galaxy S22 Ultra',
  'SM-G998': 'Galaxy S21 Ultra',
  'SM-A546': 'Galaxy A54',
  'SM-A536': 'Galaxy A53',
  'Pixel 8 Pro': 'Pixel 8 Pro',
  'Pixel 8': 'Pixel 8',
  'Pixel 7 Pro': 'Pixel 7 Pro',
  'Pixel 7': 'Pixel 7',
};

/**
 * Returns human-readable device model name (e.g. "Samsung Galaxy S23" or "Xiaomi Redmi Note 12")
 */
export const getDeviceName = (): string => {
  if (cachedDeviceName) return cachedDeviceName;

  try {
    const constants: any = Platform.constants || {};
    const brand = constants.Brand || constants.Manufacturer || '';
    const rawModel = constants.Model || '';

    // Check friendly model map
    for (const [key, val] of Object.entries(friendlyModelMap)) {
      if (rawModel.includes(key)) {
        cachedDeviceName = brand.toLowerCase().includes('samsung') ? `Samsung ${val}` : val;
        return cachedDeviceName;
      }
    }

    if (brand && rawModel) {
      const formattedBrand = brand.charAt(0).toUpperCase() + brand.slice(1);
      if (rawModel.toLowerCase().startsWith(brand.toLowerCase())) {
        cachedDeviceName = rawModel;
      } else {
        cachedDeviceName = `${formattedBrand} ${rawModel}`;
      }
    } else if (rawModel) {
      cachedDeviceName = rawModel;
    } else {
      cachedDeviceName = Platform.OS === 'android' ? 'Android Device' : 'Mobile Device';
    }
  } catch (e) {
    cachedDeviceName = Platform.OS === 'android' ? 'Android Device' : 'Mobile Device';
  }

  return cachedDeviceName || 'Android Device';
};

/**
 * Returns complete device identity object
 */
export const getDeviceIdentity = (): DeviceIdentity => {
  const { width, height } = Dimensions.get('window');
  const pairingCode = getDeviceId();
  const cleanCode = getCleanDeviceId();
  const deviceName = getDeviceName();
  const constants: any = Platform.constants || {};

  return {
    internalId: constants.Fingerprint || `dev-${cleanCode}`,
    pairingCode,
    cleanCode,
    deviceName,
    platform: Platform.OS === 'android' ? 'Android' : 'iOS',
    width: Math.round(width),
    height: Math.round(height),
  };
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
