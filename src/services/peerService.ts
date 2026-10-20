import { Platform } from 'react-native';
import { Device } from '../types';
import { getCleanDeviceId, getDeviceId, getDeviceName, getDeviceIdentity } from '../utils/deviceUtils';
import { screenStreamService } from './screenStreamService';

export interface PeerMessage {
  type: 'CONNECT_REQUEST' | 'CONNECT_ACCEPT' | 'CONNECT_REJECT' | 'TOUCH' | 'KEY' | 'NAV' | 'DISCONNECT' | 'HEARTBEAT';
  fromId: string;
  fromName: string;
  payload?: any;
  timestamp: number;
}

type PeerEventListener = (msg: PeerMessage) => void;

class PeerService {
  private ws: WebSocket | null = null;
  private selfId: string = '';
  private selfName: string = '';
  private listeners: Set<PeerEventListener> = new Set();
  private isConnectingWs: boolean = false;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private pendingConnectPromise: {
    targetId: string;
    resolve: (val: { success: boolean; partnerName?: string; partnerCode?: string; error?: string }) => void;
    timer: any;
  } | null = null;

  /**
   * Initialize WebSocket listener for this device
   */
  public init(customSelfId?: string) {
    this.selfId = (customSelfId || getCleanDeviceId()).replace(/\s+/g, '');
    this.selfName = getDeviceName();

    this.connectWs();
    this.startHeartbeat();
  }

  public getSelfCleanId(): string {
    return this.selfId || getCleanDeviceId().replace(/\s+/g, '');
  }

  public getSelfFormattedId(): string {
    const id = this.getSelfCleanId();
    if (id.length === 6) {
      return `${id.slice(0, 3)} ${id.slice(3)}`;
    }
    return id;
  }

  public addListener(listener: PeerEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(msg: PeerMessage) {
    this.listeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (err) {
        console.warn('[PeerService] Listener error:', err);
      }
    });
  }

  private connectWs() {
    if (this.isConnectingWs || (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING))) {
      return;
    }

    this.isConnectingWs = true;
    const topic = `sm_remote_${this.getSelfCleanId()}`;
    const wsUrl = `wss://ntfy.sh/${topic}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnectingWs = false;
        console.log(`[PeerService] Connected to real-time channel: ${topic}`);
      };

      this.ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          if (raw.event === 'message' && raw.message) {
            const data: PeerMessage = JSON.parse(raw.message);
            // Ignore messages sent by self
            if (data.fromId === this.selfId) return;

            this.handleIncomingMessage(data);
          }
        } catch (e) {
          // non-json or ping
        }
      };

      this.ws.onerror = (err) => {
        this.isConnectingWs = false;
      };

      this.ws.onclose = () => {
        this.isConnectingWs = false;
        this.scheduleReconnect();
      };
    } catch (err) {
      this.isConnectingWs = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connectWs();
    }, 3000);
  }

  private startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        this.connectWs();
      }
    }, 15000);
  }

  private async handleIncomingMessage(msg: PeerMessage) {
    console.log('[PeerService] Received incoming message:', msg.type, 'from:', msg.fromId);

    // If waiting for connect accept
    if (this.pendingConnectPromise && this.pendingConnectPromise.targetId === msg.fromId) {
      if (msg.type === 'CONNECT_ACCEPT') {
        clearTimeout(this.pendingConnectPromise.timer);
        const resolve = this.pendingConnectPromise.resolve;
        this.pendingConnectPromise = null;
        resolve({
          success: true,
          partnerName: msg.fromName || `Mobile (${msg.fromId})`,
          partnerCode: msg.fromId,
        });
      } else if (msg.type === 'CONNECT_REJECT') {
        clearTimeout(this.pendingConnectPromise.timer);
        const resolve = this.pendingConnectPromise.resolve;
        this.pendingConnectPromise = null;
        resolve({
          success: false,
          error: 'Connection rejected by partner device.',
        });
      }
    }

    // If another device wants to connect to us:
    if (msg.type === 'CONNECT_REQUEST') {
      const identity = getDeviceIdentity();
      // Auto-accept connection and send back our real device info
      await this.sendToDevice(msg.fromId, {
        type: 'CONNECT_ACCEPT',
        fromId: this.getSelfCleanId(),
        fromName: identity.deviceName,
        payload: {
          brand: Platform.OS === 'android' ? (Platform.constants as any)?.Brand : 'Mobile',
          model: Platform.OS === 'android' ? (Platform.constants as any)?.Model : identity.deviceName,
          width: identity.width,
          height: identity.height,
          fps: 60,
          status: 'LIVE_STREAMING_ACTIVE',
        },
        timestamp: Date.now(),
      });
    }

    screenStreamService.handlePeerMessage(msg);
    this.emit(msg);
  }

  /**
   * Post message directly to remote device's channel
   */
  public async sendToDevice(targetId: string, message: PeerMessage): Promise<boolean> {
    const cleanTarget = targetId.replace(/[^0-9]/g, '');
    const topic = `sm_remote_${cleanTarget}`;
    const url = `https://ntfy.sh/${topic}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
      return res.ok;
    } catch (err) {
      console.warn('[PeerService] Failed to send message:', err);
      return false;
    }
  }

  /**
   * Request connection to partner device ID
   */
  public async requestConnect(
    targetCode: string
  ): Promise<{ success: boolean; partnerName?: string; partnerCode?: string; error?: string }> {
    const cleanTarget = targetCode.replace(/[^0-9]/g, '');
    const cleanSelf = this.getSelfCleanId();

    if (cleanTarget === cleanSelf) {
      return {
        success: false,
        error: 'Cannot connect to your own device ID. Please enter another phone’s ID.',
      };
    }

    if (cleanTarget.length < 3) {
      return {
        success: false,
        error: 'Invalid Device ID. Partner ID must have at least 6 digits.',
      };
    }

    // Ensure our listener is connected
    this.connectWs();

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        if (this.pendingConnectPromise && this.pendingConnectPromise.targetId === cleanTarget) {
          this.pendingConnectPromise = null;
          resolve({
            success: false,
            error: `Device ${targetCode} is offline or app is not open. Please make sure the SM Controller app is open on the other phone.`,
          });
        }
      }, 7000); // 7 second timeout

      this.pendingConnectPromise = {
        targetId: cleanTarget,
        resolve,
        timer,
      };

      // Send connection request
      this.sendToDevice(cleanTarget, {
        type: 'CONNECT_REQUEST',
        fromId: cleanSelf,
        fromName: this.selfName,
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Send touch coordinate to partner
   */
  public sendTouch(targetId: string, x: number, y: number) {
    this.sendToDevice(targetId, {
      type: 'TOUCH',
      fromId: this.getSelfCleanId(),
      fromName: this.selfName,
      payload: { x, y },
      timestamp: Date.now(),
    });
  }

  /**
   * Send keyboard key / text to partner
   */
  public sendKey(targetId: string, key: string) {
    this.sendToDevice(targetId, {
      type: 'KEY',
      fromId: this.getSelfCleanId(),
      fromName: this.selfName,
      payload: { key },
      timestamp: Date.now(),
    });
  }

  /**
   * Send Android navigation (Back, Home, Recents)
   */
  public sendNav(targetId: string, action: 'back' | 'home' | 'recents') {
    this.sendToDevice(targetId, {
      type: 'NAV',
      fromId: this.getSelfCleanId(),
      fromName: this.selfName,
      payload: { action },
      timestamp: Date.now(),
    });
  }

  /**
   * Send Disconnect
   */
  public sendDisconnect(targetId: string) {
    this.sendToDevice(targetId, {
      type: 'DISCONNECT',
      fromId: this.getSelfCleanId(),
      fromName: this.selfName,
      timestamp: Date.now(),
    });
  }

  /**
   * Cloud sync for recent devices persistence
   */
  public async saveRecentDevices(selfId: string, devices: Device[]): Promise<void> {
    const cleanId = (selfId || this.getSelfCleanId()).replace(/[^0-9]/g, '');
    const topic = `sm_remote_store_${cleanId}`;
    try {
      await fetch(`https://ntfy.sh/${topic}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updatedAt: Date.now(),
          recentDevices: devices,
        }),
      });
    } catch (e) {
      console.warn('[PeerService] Error saving recent devices:', e);
    }
  }

  public async loadRecentDevices(selfId: string): Promise<Device[]> {
    const cleanId = (selfId || this.getSelfCleanId()).replace(/[^0-9]/g, '');
    const topic = `sm_remote_store_${cleanId}`;
    try {
      const res = await fetch(`https://ntfy.sh/${topic}/json?poll=1`);
      if (!res.ok) return [];
      const text = await res.text();
      const lines = text.trim().split('\n');
      if (lines.length === 0) return [];

      // Get last message line
      const lastLine = lines[lines.length - 1];
      const parsed = JSON.parse(lastLine);
      if (parsed.message) {
        const payload = JSON.parse(parsed.message);
        if (Array.isArray(payload.recentDevices)) {
          return payload.recentDevices;
        }
      }
      return [];
    } catch (e) {
      return [];
    }
  }
}

export const peerService = new PeerService();
