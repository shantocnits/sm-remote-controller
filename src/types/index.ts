export type AppMode = 'm2m' | 'm2d' | 'd2d';

export type ActiveTab = 'home' | 'remote' | 'tools' | 'chat';

export interface Device {
  id: string;
  name: string;
  code: string;
  type: 'mobile' | 'desktop';
  isPinned: boolean;
  nickname?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'partner' | 'self';
  text?: string;
  time: string;
  isVoice?: boolean;
  voiceDuration?: string;
  isDelivered?: boolean;
}

export type VideoCallStatus = 'idle' | 'ringing' | 'connected' | 'minimized';

export type AudioCallStatus = 'idle' | 'ringing' | 'connected';
