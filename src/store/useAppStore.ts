import { create } from 'zustand';
import { ActiveTab, AppMode, AudioCallStatus, ChatMessage, Device, VideoCallStatus } from '../types';

interface AppStoreState {
  // Mode & Navigation
  currentMode: AppMode;
  activeTab: ActiveTab;
  isModeDropdownOpen: boolean;
  partnerIdInput: string;

  // Devices
  devices: Device[];

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
  setAppVersion: (ver: string) => void;

  // Actions
  setMode: (mode: AppMode) => void;
  setActiveTab: (tab: ActiveTab) => void;
  toggleModeDropdown: () => void;
  closeModeDropdown: () => void;
  setPartnerIdInput: (val: string) => void;

  // Device Actions
  togglePinDevice: (id: string) => void;
  setDeviceNickname: (id: string, nickname: string) => void;
  removeDevice: (id: string) => void;
  clearDevices: () => void;

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

const initialDevices: Device[] = [
  {
    id: '1',
    name: 'Galaxy S23 Ultra',
    code: '412 887',
    type: 'mobile',
    isPinned: false,
  },
  {
    id: '2',
    name: "Shanto's PC",
    code: '882 109',
    type: 'desktop',
    isPinned: false,
  },
];

const initialMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'partner',
    text: 'Hey, device is connected perfectly!',
    time: '10:42 AM',
  },
  {
    id: 'msg-2',
    sender: 'self',
    text: 'Can you check the file manager? I sent a photo.',
    time: '10:44 AM',
    isDelivered: true,
  },
];

export const useAppStore = create<AppStoreState>((set, get) => ({
  // Mode & Navigation
  currentMode: 'm2m',
  activeTab: 'home',
  isModeDropdownOpen: false,
  partnerIdInput: '',

  // Devices
  devices: initialDevices,

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

  // Mode selection: dynamic tab hiding logic
  setMode: (mode: AppMode) => {
    const currentTab = get().activeTab;
    const newTab = mode !== 'm2m' && currentTab === 'tools' ? 'home' : currentTab;
    set({
      currentMode: mode,
      activeTab: newTab,
      isModeDropdownOpen: false,
    });
  },

  setActiveTab: (tab: ActiveTab) => set({ activeTab: tab }),

  toggleModeDropdown: () =>
    set((state) => ({ isModeDropdownOpen: !state.isModeDropdownOpen })),

  // App Version
  appVersion: '1.3.0',
  setAppVersion: (ver: string) => set({ appVersion: ver }),

  setPartnerIdInput: (val: string) => set({ partnerIdInput: val }),

  // Device actions
  togglePinDevice: (id: string) => {
    set((state) => {
      const target = state.devices.find((d) => d.id === id);
      if (!target) return state;

      const updated = state.devices.map((d) =>
        d.id === id ? { ...d, isPinned: !d.isPinned } : d
      );

      const sorted = [...updated].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });

      return { devices: sorted };
    });
  },

  setDeviceNickname: (id: string, nickname: string) => {
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === id ? { ...d, nickname: nickname.trim() || undefined } : d
      ),
    }));
  },

  removeDevice: (id: string) => {
    set((state) => ({
      devices: state.devices.filter((d) => d.id !== id),
    }));
  },

  clearDevices: () => set({ devices: [] }),

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
