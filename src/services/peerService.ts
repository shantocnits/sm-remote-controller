import { Platform } from 'react-native';
import { Device } from '../types';
import { getCleanDeviceId, getDeviceId, getDeviceName, getDeviceIdentity } from '../utils/deviceUtils';
import { screenStreamService } from './screenStreamService';

export interface PeerMessage {
  type:
    | 'CONNECT_REQUEST'
    | 'CONNECT_ACCEPT'
    | 'CONNECT_REJECT'
    | 'CONNECT_CANCEL'
    | 'TOUCH'
    | 'KEY'
    | 'NAV'
    | 'DISCONNECT'
    | 'HEARTBEAT';
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
  private pollTimer: any = null;
  private processedMessages: Set<string> = new Set();
  private pendingConnectPromise: {
    targetId: string;
    resolve: (val: { success: boolean; partnerName?: string; partnerCode?: string; error?: string }) => void;
    timer: any;
  } | null = null;

  /**
   * Initialize dual-channel WebSocket & HTTP Polling listener for this device
   */
  public init(customSelfId?: string) {
    this.selfId = (customSelfId || getCleanDeviceId()).replace(/\s+/g, '');
    this.selfName = getDeviceName();

    this.connectWs();
    this.startHeartbeat();
    this.startHttpPolling();
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

  /**
   * Primary: Real-time WebSocket connection
   */
  private connectWs() {
    if (
      this.isConnectingWs ||
      (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING))
    ) {
      return;
    }

    this.isConnectingWs = true;
    const topic = `sm_remote_${this.getSelfCleanId()}`;
    const wsUrl = `wss://ntfy.sh/${topic}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnectingWs = false;
        console.log(`[PeerService] WebSocket connected to: ${topic}`);
      };

      this.ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          if (raw.event === 'message' && raw.message) {
            const data: PeerMessage = JSON.parse(raw.message);
            this.handleIncomingMessage(data, raw.id);
          }
        } catch (e) {
          // ignore non-json
        }
      };

      this.ws.onerror = () => {
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
    }, 2500);
  }

  private startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        this.connectWs();
      }
    }, 12000);
  }

  /**
   * Fallback: Fast HTTP polling every 1.5s to ensure zero missed messages on mobile networks
   */
  private startHttpPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(async () => {
      const topic = `sm_remote_${this.getSelfCleanId()}`;
      try {
        const res = await fetch(`https://ntfy.sh/${topic}/json?since=15s&poll=1`);
        if (!res.ok) return;
        const text = await res.text();
        if (!text || !text.trim()) return;

        const lines = text.trim().split('\n');
        for (const line of lines) {
          try {
            const item = JSON.parse(line);
            if (item.event === 'message' && item.message) {
              const data: PeerMessage = JSON.parse(item.message);
              this.handleIncomingMessage(data, item.id);
            }
          } catch {}
        }
      } catch {}
    }, 1500);
  }

  /**
   * Process incoming signaling message with deduplication
   */
  private handleIncomingMessage(msg: PeerMessage, rawMsgId?: string) {
    if (!msg || !msg.type || !msg.fromId) return;

    // Ignore self messages
    if (msg.fromId === this.getSelfCleanId()) return;

    // Deduplication key
    const dedupKey = rawMsgId || `${msg.fromId}_${msg.type}_${msg.timestamp}`;
    if (this.processedMessages.has(dedupKey)) {
      return;
    }
    this.processedMessages.add(dedupKey);

    // Keep set bounded
    if (this.processedMessages.size > 200) {
      const arr = Array.from(this.processedMessages);
      this.processedMessages = new Set(arr.slice(-100));
    }

    console.log('[PeerService] Incoming verified message:', msg.type, 'from:', msg.fromId, msg.fromName);

    // If caller is waiting for partner response
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
          error: msg.payload?.reason || 'Partner rejected the connection request.',
        });
      }
    }

    // Stream handler and event listeners
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
   * Request connection to partner device ID (Caller side)
   * Does NOT auto-connect; sends request and waits for Callee to Accept
   */
  public async requestConnect(
    targetCode: string
  ): Promise<{ success: boolean; partnerName?: string; partnerCode?: string; error?: string }> {
    const cleanTarget = targetCode.replace(/[^0-9]/g, '');
    const cleanSelf = this.getSelfCleanId();

    if (cleanTarget === cleanSelf) {
      return {
        success: false,
        error: 'Cannot connect to your own phone ID. Please enter the other phone’s Partner ID.',
      };
    }

    if (cleanTarget.length < 3) {
      return {
        success: false,
        error: 'Please enter a valid 6-digit Partner ID.',
      };
    }

    // Ensure our channel is active
    this.connectWs();

    return new Promise((resolve) => {
      // 25 second timeout for human partner to tap "Accept"
      const timer = setTimeout(() => {
        if (this.pendingConnectPromise && this.pendingConnectPromise.targetId === cleanTarget) {
          this.pendingConnectPromise = null;
          resolve({
            success: false,
            error: `Partner (ID: ${targetCode}) did not respond within 25 seconds. Please ensure SM Controller is opened on their phone.`,
          });
        }
      }, 25000);

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
   * Cancel connection request (Caller cancels while waiting)
   */
  public cancelConnect(targetCode: string) {
    const cleanTarget = targetCode.replace(/[^0-9]/g, '');
    if (this.pendingConnectPromise && this.pendingConnectPromise.targetId === cleanTarget) {
      clearTimeout(this.pendingConnectPromise.timer);
      this.pendingConnectPromise.resolve({
        success: false,
        error: 'Connection request cancelled.',
      });
      this.pendingConnectPromise = null;
    }

    this.sendToDevice(cleanTarget, {
      type: 'CONNECT_CANCEL',
      fromId: this.getSelfCleanId(),
      fromName: this.selfName,
      timestamp: Date.now(),
    });
  }

  /**
   * Accept incoming connection request (Callee side)
   */
  public async sendConnectAccept(targetId: string): Promise<boolean> {
    const identity = getDeviceIdentity();
    return this.sendToDevice(targetId, {
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

  /**
   * Reject incoming connection request (Callee side)
   */
  public async sendConnectReject(targetId: string, reason = 'Connection declined by partner.'): Promise<boolean> {
    return this.sendToDevice(targetId, {
      type: 'CONNECT_REJECT',
      fromId: this.getSelfCleanId(),
      fromName: this.selfName,
      payload: { reason },
      timestamp: Date.now(),
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
