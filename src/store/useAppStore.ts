import { create } from 'zustand';
import { Alert } from 'react-native';
import { ActiveTab, AppMode, AudioCallStatus, ChatMessage, Device, VideoCallStatus } from '../types';
import versionConfig from '../../version.json';
import { peerService } from '../services/peerService';
import { getCleanDeviceId } from '../utils/deviceUtils';

const CURRENT_VERSION = versionConfig.version || '1.5.0';

interface AppStoreState {
  // Mode & Navigation
  currentMode: AppMode;
  activeTab: ActiveTab;
  isModeDropdownOpen: boolean;
  partnerIdInput: string;

  // Real-time P2P Connection States
  isConnecting: boolean;
  connectionError: string | null;
  incomingPartner: { id: string; name: string } | null;

  // Devices (Real dynamic recent devices, persistent)
  devices: Device[];
  connectedDevice: Device | null;

  // Video Call State
  videoCallStatus: VideoCallStatus;
  videoSeconds: number;
  isSelfCameraOn: boolean;

  // Audio Call State
  audioCallStatus: AudioCallStatus;
  audioSeconds: number;

  // Chat & Voice Recording
  messages: ChatMessage[];
  isVoiceRecording: boolean;
  voiceSeconds: number;

  // App Version & Updates
  appVersion: string;
  hasNewUpdate: boolean;
  setAppVersion: (ver: string) => void;
  setHasNewUpdate: (val: boolean) => void;

  // Actions
  setMode: (mode: AppMode) => void;
  setActiveTab: (tab: ActiveTab) => void;
  toggleModeDropdown: () => void;
  closeModeDropdown: () => void;
  setPartnerIdInput: (val: string) => void;

  // Device & P2P Actions
  loadSavedDevices: () => Promise<void>;
  addDevice: (code: string, customName?: string, type?: 'mobile' | 'desktop') => Device;
  connectToPartner: (code: string) => Promise<boolean>;
  setConnectedDevice: (device: Device | null) => void;
  setIncomingPartner: (partner: { id: string; name: string } | null) => void;
  togglePinDevice: (id: string) => void;
  setDeviceNickname: (id: string, nickname: string) => void;
  removeDevice: (id: string) => void;
  clearDevices: () => void;
  disconnectSession: () => void;

  // Video Call Actions
  startVideoCall: () => void;
  connectVideoCall: () => void;
  minimizeVideoCall: () => void;
  expandVideoCall: () => void;
  endVideoCall: () => void;
  toggleSelfCamera: () => void;
  tickVideoTimer: () => void;

  // Audio Call Actions
  startAudioCall: () => void;
  connectAudioCall: () => void;
  endAudioCall: () => void;
  tickAudioTimer: () => void;

  // Chat & Voice Actions
  sendMessage: (text: string) => void;
  sendImageMessage: (imageUrl: string, caption?: string) => void;
  sendFileMessage: (fileName: string, fileSize: string) => void;
  startVoiceRecording: () => void;
  cancelVoiceRecording: () => void;
  sendVoiceRecording: () => void;
  tickVoiceTimer: () => void;
}

const initialMessages: ChatMessage[] = [];

export const useAppStore = create<AppStoreState>((set, get) => ({
  // Mode & Navigation - strictly Mobile to Mobile
  currentMode: 'm2m',
  activeTab: 'home',
  isModeDropdownOpen: false,
  partnerIdInput: '',

  // Connection states
  isConnecting: false,
  connectionError: null,
  incomingPartner: null,

  // Devices: Starts empty, purely dynamic and cloud-persisted
  devices: [],
  connectedDevice: null,

  // Calls
  videoCallStatus: 'idle',
  videoSeconds: 0,
  isSelfCameraOn: true,

  audioCallStatus: 'idle',
  audioSeconds: 0,

  // Chat
  messages: initialMessages,
  isVoiceRecording: false,
  voiceSeconds: 0,

  // Mode selection
  setMode: (_mode: AppMode) => {
    set({
      currentMode: 'm2m',
      isModeDropdownOpen: false,
    });
  },

  setActiveTab: (tab: ActiveTab) => set({ activeTab: tab }),

  toggleModeDropdown: () =>
    set((state) => ({ isModeDropdownOpen: !state.isModeDropdownOpen })),
  closeModeDropdown: () => set({ isModeDropdownOpen: false }),

  // App Version & Updates
  appVersion: CURRENT_VERSION,
  hasNewUpdate: false,
  setAppVersion: (ver: string) => set({ appVersion: ver }),
  setHasNewUpdate: (val: boolean) => set({ hasNewUpdate: val }),

  setPartnerIdInput: (val: string) => set({ partnerIdInput: val }),
  setConnectedDevice: (device: Device | null) => set({ connectedDevice: device }),
  setIncomingPartner: (partner) => set({ incomingPartner: partner }),

  // Load saved devices from cloud cache on startup
  loadSavedDevices: async () => {
    try {
      const selfId = getCleanDeviceId();
      const saved = await peerService.loadRecentDevices(selfId);
      if (Array.isArray(saved)) {
        set({ devices: saved });
      }
    } catch (e) {
      console.warn('[useAppStore] loadSavedDevices error:', e);
    }
  },

  addDevice: (code: string, customName?: string, _type?: 'mobile' | 'desktop') => {
    const cleanDigits = code.replace(/[^0-9]/g, '');
    const formattedCode =
      cleanDigits.length === 6
        ? `${cleanDigits.slice(0, 3)} ${cleanDigits.slice(3)}`
        : code.trim();

    const currentDevices = get().devices;
    const existing = currentDevices.find(
      (d) => d.code.replace(/\s+/g, '') === cleanDigits
    );

    let updatedDevices: Device[];
    let targetDevice: Device;

    if (existing) {
      targetDevice = {
        ...existing,
        name: customName || existing.name,
      };
      updatedDevices = [
        targetDevice,
        ...currentDevices.filter((d) => d.id !== existing.id),
      ];
    } else {
      targetDevice = {
        id: `dev-${cleanDigits}-${Date.now()}`,
        name: customName || `Mobile (${formattedCode})`,
        code: formattedCode,
        type: 'mobile',
        isPinned: false,
      };
      updatedDevices = [targetDevice, ...currentDevices];
    }

    set({
      devices: updatedDevices,
      connectedDevice: targetDevice,
    });

    // Persist immediately
    peerService.saveRecentDevices(getCleanDeviceId(), updatedDevices);
    return targetDevice;
  },

  connectToPartner: async (code: string) => {
    const cleanDigits = code.replace(/[^0-9]/g, '');
    const selfId = getCleanDeviceId();

    if (cleanDigits === selfId) {
      Alert.alert(
        'Same Device ID',
        'You cannot connect to your own phone ID. Please enter the Partner ID shown on the other phone.'
      );
      return false;
    }

    if (cleanDigits.length < 3) {
      Alert.alert('Invalid ID', 'Please enter a valid 6-digit Partner ID.');
      return false;
    }

    set({ isConnecting: true, connectionError: null });

    const result = await peerService.requestConnect(cleanDigits);

    if (result.success) {
      const partnerDevice = get().addDevice(cleanDigits, result.partnerName);
      set({
        isConnecting: false,
        connectedDevice: partnerDevice,
        activeTab: 'remote',
        partnerIdInput: '',
      });
      return true;
    } else {
      const errMsg =
        result.error ||
        `Device ${code} is offline or not reachable. Make sure the app is opened on the partner's phone.`;
      set({ isConnecting: false, connectionError: errMsg });
      Alert.alert('Connection Failed', errMsg);
      return false;
    }
  },

  disconnectSession: () => {
    const current = get().connectedDevice;
    if (current) {
      peerService.sendDisconnect(current.code.replace(/[^0-9]/g, ''));
    }
    set({
      connectedDevice: null,
      activeTab: 'home',
      incomingPartner: null,
    });
  },

  // Device actions
  togglePinDevice: (id: string) => {
    set((state) => {
      const updated = state.devices.map((d) =>
        d.id === id ? { ...d, isPinned: !d.isPinned } : d
      );

      const sorted = [...updated].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });

      peerService.saveRecentDevices(getCleanDeviceId(), sorted);
      return { devices: sorted };
    });
  },

  setDeviceNickname: (id: string, nickname: string) => {
    set((state) => {
      const updated = state.devices.map((d) =>
        d.id === id ? { ...d, nickname: nickname.trim() || undefined } : d
      );
      peerService.saveRecentDevices(getCleanDeviceId(), updated);
      return { devices: updated };
    });
  },

  removeDevice: (id: string) => {
    set((state) => {
      const updated = state.devices.filter((d) => d.id !== id);
      // Persist deletion immediately so it never comes back
      peerService.saveRecentDevices(getCleanDeviceId(), updated);
      return { devices: updated };
    });
  },

  clearDevices: () => {
    set({ devices: [] });
    // Persist empty list so it never restores old devices
    peerService.saveRecentDevices(getCleanDeviceId(), []);
  },

  // Video calls
  startVideoCall: () => set({ videoCallStatus: 'ringing', videoSeconds: 0 }),
  connectVideoCall: () => set({ videoCallStatus: 'connected', videoSeconds: 0 }),
  minimizeVideoCall: () => set({ videoCallStatus: 'minimized' }),
  expandVideoCall: () => set({ videoCallStatus: 'connected' }),
  endVideoCall: () => set({ videoCallStatus: 'idle', videoSeconds: 0 }),
  toggleSelfCamera: () =>
    set((state) => ({ isSelfCameraOn: !state.isSelfCameraOn })),
  tickVideoTimer: () =>
    set((state) => ({ videoSeconds: state.videoSeconds + 1 })),

  // Audio calls
  startAudioCall: () => set({ audioCallStatus: 'ringing', audioSeconds: 0 }),
  connectAudioCall: () => set({ audioCallStatus: 'connected', audioSeconds: 0 }),
  endAudioCall: () => set({ audioCallStatus: 'idle', audioSeconds: 0 }),
  tickAudioTimer: () =>
    set((state) => ({ audioSeconds: state.audioSeconds + 1 })),

  // Chat & Voice
  sendMessage: (text: string) => {
    if (!text.trim()) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'self',
      text: text.trim(),
      time,
      isDelivered: true,
    };
    set((state) => ({ messages: [...state.messages, newMsg] }));
  },

  sendImageMessage: (imageUrl: string, caption?: string) => {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessage = {
      id: `msg-img-${Date.now()}`,
      sender: 'self',
      imageUrl,
      text: caption,
      time,
      isDelivered: true,
    };
    set((state) => ({ messages: [...state.messages, newMsg] }));
  },

  sendFileMessage: (fileName: string, fileSize: string) => {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessage = {
      id: `msg-file-${Date.now()}`,
      sender: 'self',
      fileName,
      fileSize,
      time,
      isDelivered: true,
    };
    set((state) => ({ messages: [...state.messages, newMsg] }));
  },

  startVoiceRecording: () =>
    set({ isVoiceRecording: true, voiceSeconds: 0 }),

  cancelVoiceRecording: () =>
    set({ isVoiceRecording: false, voiceSeconds: 0 }),

  sendVoiceRecording: () => {
    const { voiceSeconds } = get();
    const durationSec = Math.max(voiceSeconds, 3);
    const minutes = Math.floor(durationSec / 60);
    const secs = durationSec % 60;
    const voiceDuration = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: `msg-voice-${Date.now()}`,
      sender: 'self',
      isVoice: true,
      voiceDuration,
      time,
      isDelivered: true,
    };

    set((state) => ({
      messages: [...state.messages, newMsg],
      isVoiceRecording: false,
      voiceSeconds: 0,
    }));
  },

  tickVoiceTimer: () =>
    set((state) => ({ voiceSeconds: state.voiceSeconds + 1 })),
}));
