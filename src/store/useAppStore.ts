import { create } from 'zustand';
import { Alert } from 'react-native';
import { ActiveTab, AppMode, AudioCallStatus, ChatMessage, Device, VideoCallStatus } from '../types';
import versionConfig from '../../version.json';
import { peerService } from '../services/peerService';
import { screenStreamService } from '../services/screenStreamService';
import { storageService } from '../services/storageService';
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
  connectingTargetCode: string | null;
  connectionError: string | null;
  incomingRequest: { fromId: string; fromName: string; timestamp: number } | null;
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
  cancelConnectRequest: () => void;
  setConnectedDevice: (device: Device | null) => void;
  setIncomingRequest: (req: { fromId: string; fromName: string; timestamp: number } | null) => void;
  acceptIncomingRequest: () => Promise<void>;
  rejectIncomingRequest: () => Promise<void>;
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
  connectingTargetCode: null,
  connectionError: null,
  incomingRequest: null,
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
  setIncomingRequest: (req) => set({ incomingRequest: req }),
  setIncomingPartner: (partner) => set({ incomingPartner: partner }),

  // Load saved devices from local storage and cloud on startup
  loadSavedDevices: async () => {
    try {
      // 1. Instant offline load from native SharedPreferences
      const local = await storageService.getSavedDevices();
      if (Array.isArray(local) && local.length > 0) {
        set({ devices: local });
      }

      // 2. Cloud sync fallback
      const selfId = getCleanDeviceId();
      const saved = await peerService.loadRecentDevices(selfId);
      if (Array.isArray(saved) && saved.length > 0) {
        set({ devices: saved });
        storageService.saveDevices(saved);
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

    // Persist immediately to both offline SharedPreferences and cloud
    storageService.saveDevices(updatedDevices);
    peerService.saveRecentDevices(getCleanDeviceId(), updatedDevices);
    return targetDevice;
  },

  // 1. Caller: Request connection to partner
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

    const formatted =
      cleanDigits.length === 6
        ? `${cleanDigits.slice(0, 3)} ${cleanDigits.slice(3)}`
        : cleanDigits;

    set({
      isConnecting: true,
      connectingTargetCode: formatted,
      connectionError: null,
    });

    const result = await peerService.requestConnect(cleanDigits);

    if (result.success) {
      const partnerDevice = get().addDevice(cleanDigits, result.partnerName);
      screenStreamService.startReceiving(cleanDigits);
      set({
        isConnecting: false,
        connectingTargetCode: null,
        connectedDevice: partnerDevice,
        activeTab: 'remote',
        partnerIdInput: '',
      });
      return true;
    } else {
      const errMsg = result.error || 'Connection request failed or timed out.';
      set({
        isConnecting: false,
        connectingTargetCode: null,
        connectionError: errMsg,
      });
      if (result.error && result.error !== 'Connection request cancelled.') {
        Alert.alert('Connection Notice', errMsg);
      }
      return false;
    }
  },

  // 2. Caller: Cancel pending connection request
  cancelConnectRequest: () => {
    const target = get().connectingTargetCode;
    if (target) {
      peerService.cancelConnect(target);
    }
    set({
      isConnecting: false,
      connectingTargetCode: null,
      connectionError: null,
    });
  },

  // 3. Callee: Accept incoming connection request
  acceptIncomingRequest: async () => {
    const req = get().incomingRequest;
    if (!req) return;

    await peerService.sendConnectAccept(req.fromId);
    screenStreamService.startBroadcasting(req.fromId);

    set({
      incomingPartner: { id: req.fromId, name: req.fromName },
      incomingRequest: null,
    });
  },

  // 4. Callee: Reject incoming connection request
  rejectIncomingRequest: async () => {
    const req = get().incomingRequest;
    if (!req) return;

    await peerService.sendConnectReject(req.fromId, 'Connection declined by partner.');
    set({
      incomingRequest: null,
    });
  },

  disconnectSession: () => {
    const current = get().connectedDevice;
    const incoming = get().incomingPartner;
    const targetCode = current?.code || incoming?.id;
    if (targetCode) {
      peerService.sendDisconnect(targetCode.replace(/[^0-9]/g, ''));
    }
    screenStreamService.stopReceiving();
    screenStreamService.stopBroadcasting();
    set({
      connectedDevice: null,
      activeTab: 'home',
      incomingPartner: null,
      incomingRequest: null,
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

      storageService.saveDevices(sorted);
      peerService.saveRecentDevices(getCleanDeviceId(), sorted);
      return { devices: sorted };
    });
  },

  setDeviceNickname: (id: string, nickname: string) => {
    set((state) => {
      const updated = state.devices.map((d) =>
        d.id === id ? { ...d, nickname: nickname.trim() || undefined } : d
      );
      storageService.saveDevices(updated);
      peerService.saveRecentDevices(getCleanDeviceId(), updated);
      return { devices: updated };
    });
  },

  removeDevice: (id: string) => {
    set((state) => {
      const updated = state.devices.filter((d) => d.id !== id);
      // Persist deletion immediately so it never comes back
      storageService.saveDevices(updated);
      peerService.saveRecentDevices(getCleanDeviceId(), updated);
      return { devices: updated };
    });
  },

  clearDevices: () => {
    set({ devices: [] });
    // Persist empty list so it never restores old devices
    storageService.saveDevices([]);
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
