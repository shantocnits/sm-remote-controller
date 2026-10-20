import { Vibration, Platform } from 'react-native';
import Paho from 'paho-mqtt';
import { Device } from '../types';
import { getCleanDeviceId, getDeviceId, getDeviceName, getDeviceIdentity } from '../utils/deviceUtils';
import { screenStreamService } from './screenStreamService';
import { storageService } from './storageService';

// Ensure localStorage polyfill for Paho in React Native environment
if (typeof (global as any).localStorage === 'undefined') {
  const memStore: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (k: string) => memStore[k] || null,
    setItem: (k: string, v: string) => {
      memStore[k] = v;
    },
    removeItem: (k: string) => {
      delete memStore[k];
    },
    clear: () => {
      Object.keys(memStore).forEach((k) => delete memStore[k]);
    },
  };
}

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

interface MqttBrokerConfig {
  host: string;
  port: number;
  path: string;
  ssl: boolean;
}

const MQTT_BROKERS: MqttBrokerConfig[] = [
  // Tier 1: EMQX Global Public Broker (Fastest in Asia & Global)
  { host: 'broker.emqx.io', port: 8084, path: '/mqtt', ssl: true },
  // Tier 2: HiveMQ Cloud Broker
  { host: 'broker.hivemq.com', port: 8884, path: '/mqtt', ssl: true },
  // Tier 3: Mosquitto Test Broker
  { host: 'test.mosquitto.org', port: 8081, path: '/mqtt', ssl: true },
];

class PeerService {
  private client: Paho.Client | null = null;
  private currentBrokerIndex: number = 0;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private selfId: string = '';
  private selfName: string = '';
  private listeners: Set<PeerEventListener> = new Set();
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private pendingQueue: Array<{ topic: string; message: string; qos: number }> = [];
  private processedMessages: Set<string> = new Set();

  private pendingConnectPromise: {
    targetId: string;
    resolve: (val: { success: boolean; partnerName?: string; partnerCode?: string; error?: string }) => void;
    timer: any;
  } | null = null;

  /**
   * Initialize Enterprise Multi-Broker MQTT Signaling
   */
  public init(customSelfId?: string) {
    this.selfId = (customSelfId || getCleanDeviceId()).replace(/[^0-9]/g, '');
    this.selfName = getDeviceName();

    this.connectMqtt();
    this.startHeartbeat();
  }

  public getSelfCleanId(): string {
    return this.selfId || getCleanDeviceId().replace(/[^0-9]/g, '');
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
   * Connect to MQTT broker cluster with automatic failover
   */
  private connectMqtt() {
    if (this.isConnected || this.isConnecting) return;

    this.isConnecting = true;
    const cleanSelf = this.getSelfCleanId();
    const broker = MQTT_BROKERS[this.currentBrokerIndex];
    const clientId = `sm_ctrl_${cleanSelf}_${Date.now().toString(36)}`;

    try {
      this.client = new Paho.Client(broker.host, broker.port, broker.path, clientId);

      this.client.onConnectionLost = (responseObject) => {
        this.isConnected = false;
        this.isConnecting = false;
        console.warn('[PeerService] Connection lost to', broker.host, responseObject.errorMessage);
        this.scheduleFailover();
      };

      this.client.onMessageArrived = (message) => {
        try {
          const payload = message.payloadString;
          const data: PeerMessage = JSON.parse(payload);
          this.handleIncomingMessage(data);
        } catch (err) {
          console.warn('[PeerService] Failed to parse incoming MQTT payload:', err);
        }
      };

      this.client.connect({
        useSSL: broker.ssl,
        timeout: 4,
        keepAliveInterval: 15,
        cleanSession: true,
        onSuccess: () => {
          this.isConnected = true;
          this.isConnecting = false;
          console.log(`[PeerService] Connected to enterprise broker: ${broker.host}`);

          // Subscribe to this phone's dedicated channel
          const myTopic = `sm/controller/${cleanSelf}`;
          this.client?.subscribe(myTopic, { qos: 1 });
          console.log(`[PeerService] Subscribed to topic: ${myTopic}`);

          // Flush any pending messages that were queued while offline
          this.flushPendingQueue();
        },
        onFailure: (err) => {
          this.isConnected = false;
          this.isConnecting = false;
          console.warn(`[PeerService] Failed connecting to ${broker.host}:`, err.errorMessage);
          this.scheduleFailover();
        },
      });
    } catch (err) {
      this.isConnected = false;
      this.isConnecting = false;
      this.scheduleFailover();
    }
  }

  /**
   * Switch to next broker in cluster upon failure
   */
  private scheduleFailover() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.currentBrokerIndex = (this.currentBrokerIndex + 1) % MQTT_BROKERS.length;
      console.log(`[PeerService] Failing over to broker [${this.currentBrokerIndex}]: ${MQTT_BROKERS[this.currentBrokerIndex].host}`);
      this.connectMqtt();
    }, 1500);
  }

  private startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (!this.isConnected && !this.isConnecting) {
        this.connectMqtt();
      }
    }, 12000);
  }

  private flushPendingQueue() {
    if (!this.client || !this.isConnected) return;
    while (this.pendingQueue.length > 0) {
      const item = this.pendingQueue.shift();
      if (item) {
        try {
          const msg = new Paho.Message(item.message);
          msg.destinationName = item.topic;
          msg.qos = item.qos as 0 | 1 | 2;
          this.client.send(msg);
        } catch (e) {}
      }
    }
  }

  /**
   * Handle incoming signaling messages
   */
  private handleIncomingMessage(msg: PeerMessage) {
    if (!msg || !msg.type || !msg.fromId) return;

    const cleanFromId = msg.fromId.replace(/[^0-9]/g, '');
    const cleanSelfId = this.getSelfCleanId();

    // Ignore self messages
    if (cleanFromId === cleanSelfId) return;

    // Deduplicate non-request messages
    if (msg.type !== 'CONNECT_REQUEST') {
      const dedupKey = `${cleanFromId}_${msg.type}_${msg.timestamp}`;
      if (this.processedMessages.has(dedupKey)) {
        return;
      }
      this.processedMessages.add(dedupKey);
      if (this.processedMessages.size > 200) {
        const arr = Array.from(this.processedMessages);
        this.processedMessages = new Set(arr.slice(-100));
      }
    }

    console.log('[PeerService] Incoming verified message:', msg.type, 'from:', cleanFromId, msg.fromName);

    // Haptic vibration on incoming connection request
    if (msg.type === 'CONNECT_REQUEST') {
      try {
        Vibration.vibrate([0, 300, 150, 300]);
      } catch (e) {}
    }

    // If caller is waiting for partner response
    if (this.pendingConnectPromise) {
      const cleanPendingTarget = this.pendingConnectPromise.targetId.replace(/[^0-9]/g, '');
      if (cleanPendingTarget === cleanFromId) {
        if (msg.type === 'CONNECT_ACCEPT') {
          clearTimeout(this.pendingConnectPromise.timer);
          const resolve = this.pendingConnectPromise.resolve;
          this.pendingConnectPromise = null;
          resolve({
            success: true,
            partnerName: msg.fromName || `Mobile (${cleanFromId})`,
            partnerCode: cleanFromId,
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
    }

    // Screen stream message dispatcher
    screenStreamService.handlePeerMessage(msg);

    // Notify UI event listeners
    this.emit({
      ...msg,
      fromId: cleanFromId,
    });
  }

  /**
   * Send message to remote device with guaranteed delivery
   */
  public async sendToDevice(targetId: string, message: PeerMessage): Promise<boolean> {
    const cleanTarget = targetId.replace(/[^0-9]/g, '');
    const topic = `sm/controller/${cleanTarget}`;
    const payload = JSON.stringify({
      ...message,
      fromId: this.getSelfCleanId(),
      fromName: this.selfName,
      timestamp: message.timestamp || Date.now(),
    });

    if (this.client && this.isConnected) {
      try {
        const pahoMsg = new Paho.Message(payload);
        pahoMsg.destinationName = topic;
        pahoMsg.qos = 1; // QoS 1 ensures guaranteed delivery across mobile networks
        this.client.send(pahoMsg);
        return true;
      } catch (err) {
        console.warn('[PeerService] Send error, queuing message:', err);
      }
    }

    // Queue if momentarily disconnected
    this.pendingQueue.push({ topic, message: payload, qos: 1 });
    if (!this.isConnected && !this.isConnecting) {
      this.connectMqtt();
    }
    return true;
  }

  /**
   * Request connection to partner device ID (Caller side)
   * Sends connection request and waits for Callee to tap Accept
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

    // Ensure MQTT connection is active
    if (!this.isConnected && !this.isConnecting) {
      this.connectMqtt();
    }

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

      // Send connection request + rapid burst to guarantee instantaneous delivery
      const reqMsg: PeerMessage = {
        type: 'CONNECT_REQUEST',
        fromId: cleanSelf,
        fromName: this.selfName,
        timestamp: Date.now(),
      };

      this.sendToDevice(cleanTarget, reqMsg);
      setTimeout(() => {
        if (this.pendingConnectPromise && this.pendingConnectPromise.targetId === cleanTarget) {
          this.sendToDevice(cleanTarget, reqMsg);
        }
      }, 350);
    });
  }

  /**
   * Cancel connection request (Caller cancels while waiting)
   */
  public cancelConnect(targetCode: string) {
    const cleanTarget = targetCode.replace(/[^0-9]/g, '');
    if (this.pendingConnectPromise && this.pendingConnectPromise.targetId === cleanTarget) {
      clearTimeout(this.pendingConnectPromise.timer);
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
   * Send Connection Acceptance (Callee tapped "Accept & Share Screen")
   */
  public async sendConnectAccept(targetId: string) {
    const cleanTarget = targetId.replace(/[^0-9]/g, '');
    const acceptMsg: PeerMessage = {
      type: 'CONNECT_ACCEPT',
      fromId: this.getSelfCleanId(),
      fromName: this.selfName,
      timestamp: Date.now(),
    };

    // Dual-burst delivery
    await this.sendToDevice(cleanTarget, acceptMsg);
    setTimeout(() => {
      this.sendToDevice(cleanTarget, acceptMsg);
    }, 350);
  }

  /**
   * Send Connection Rejection (Callee tapped "Decline")
   */
  public async sendConnectReject(targetId: string, reason = 'Connection declined by partner.') {
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
  public sendTouch(targetId: string, relX: number, relY: number) {
    this.sendToDevice(targetId, {
      type: 'TOUCH',
      fromId: this.getSelfCleanId(),
      fromName: this.selfName,
      payload: { relX, relY, x: relX, y: relY },
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
   * Recent devices persistence (Delegates to native SharedPreferences via storageService)
   */
  public async saveRecentDevices(selfId: string, devices: Device[]): Promise<void> {
    await storageService.saveDevices(devices);
  }

  public async loadRecentDevices(selfId: string): Promise<Device[]> {
    return storageService.getSavedDevices();
  }
}

export const peerService = new PeerService();
