import { NativeModules } from 'react-native';
import { Device } from '../types';
import { getCleanDeviceId } from '../utils/deviceUtils';

const { LocalStorageModule } = NativeModules;

// In-memory fallback if native module is unavailable
const memoryFallback: Record<string, string> = {};

class StorageService {
  /**
   * Universal key-value getter with SharedPreferences + Cloud fallback
   */
  public async getItem(key: string): Promise<string | null> {
    if (LocalStorageModule && typeof LocalStorageModule.getItem === 'function') {
      try {
        const val = await LocalStorageModule.getItem(key);
        if (val !== null && val !== undefined) {
          return val;
        }
      } catch (err) {
        // Fallback to memory or cloud
      }
    }
    return memoryFallback[key] || null;
  }

  /**
   * Universal key-value setter with SharedPreferences + Cloud sync
   */
  public async setItem(key: string, value: string): Promise<void> {
    memoryFallback[key] = value;
    if (LocalStorageModule && typeof LocalStorageModule.setItem === 'function') {
      try {
        await LocalStorageModule.setItem(key, value);
      } catch (err) {
        // Ignored
      }
    }
  }

  /**
   * Universal key-value remover
   */
  public async removeItem(key: string): Promise<void> {
    delete memoryFallback[key];
    if (LocalStorageModule && typeof LocalStorageModule.removeItem === 'function') {
      try {
        await LocalStorageModule.removeItem(key);
      } catch (err) {
        // Ignored
      }
    }
  }

  /**
   * Get the version that the user has already acknowledged / updated to.
   * If the user clicked "Update" or dismissed v1.5.3, this returns "1.5.3".
   */
  public async getAcknowledgedUpdateVersion(): Promise<string | null> {
    // 1. Try local SharedPreferences first (instant & offline)
    const local = await this.getItem('acknowledged_update_version');
    if (local) return local;

    // 2. Try device cloud sync store as secondary fallback
    try {
      const cleanId = getCleanDeviceId();
      const res = await fetch(`https://ntfy.sh/sm_remote_store_${cleanId}/json?poll=1`);
      if (res.ok) {
        const text = await res.text();
        const lines = text.trim().split('\n');
        if (lines.length > 0) {
          const lastLine = lines[lines.length - 1];
          const parsed = JSON.parse(lastLine);
          if (parsed.message) {
            const payload = JSON.parse(parsed.message);
            if (payload.acknowledgedUpdateVersion) {
              await this.setItem('acknowledged_update_version', payload.acknowledgedUpdateVersion);
              return payload.acknowledgedUpdateVersion;
            }
          }
        }
      }
    } catch (e) {
      // Ignore
    }

    return null;
  }

  /**
   * Set the version that the user has acknowledged / updated to.
   * Prevents repeated update popups and badges until a HIGHER version is released.
   */
  public async setAcknowledgedUpdateVersion(version: string): Promise<void> {
    await this.setItem('acknowledged_update_version', version);

    // Also sync to cloud store for this device
    try {
      const cleanId = getCleanDeviceId();
      await fetch(`https://ntfy.sh/sm_remote_update_ack_${cleanId}`, {
        method: 'POST',
        headers: { 'Title': 'Update Acknowledged', 'Tags': 'update' },
        body: JSON.stringify({ version, timestamp: Date.now() }),
      });
    } catch (e) {
      // Non-blocking
    }
  }

  /**
   * Get saved devices from SharedPreferences first, falling back to cloud
   */
  public async getSavedDevices(): Promise<Device[]> {
    const raw = await this.getItem('saved_recent_devices');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  }

  /**
   * Save devices to SharedPreferences immediately (guarantees offline persistence)
   */
  public async saveDevices(devices: Device[]): Promise<void> {
    await this.setItem('saved_recent_devices', JSON.stringify(devices));
  }
}

export const storageService = new StorageService();
