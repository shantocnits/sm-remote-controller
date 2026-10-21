import { NativeModules, DeviceEventEmitter, Platform } from 'react-native';
import { peerService } from './peerService';
import { getCleanDeviceId, getDeviceIdentity } from '../utils/deviceUtils';

const { ScreenCaptureModule } = NativeModules;

export interface LiveFrameData {
  frameData: string; // base64 JPEG
  width: number;
  height: number;
  timestamp: number;
}

export interface StreamStats {
  fps: number;
  pingMs: number;
  receivedFrames: number;
  isStreaming: boolean;
  statusText: string;
}

type LiveFrameListener = (frame: LiveFrameData) => void;
type StatsListener = (stats: StreamStats) => void;

class ScreenStreamService {
  private isBroadcasting: boolean = false;
  private isReceiving: boolean = false;
  private currentPartnerId: string | null = null;
  private frameCount: number = 0;
  private currentFps: number = 60;
  private fpsCounter: number = 0;
  private lastFpsCalcTime: number = Date.now();
  private currentPingMs: number = 24;
  private latestFrameData: LiveFrameData | null = null;

  private frameListeners: Set<LiveFrameListener> = new Set();
  private statsListeners: Set<StatsListener> = new Set();
  private nativeFrameSub: any = null;

  constructor() {
    this.setupNativeFrameListener();
  }

  /**
   * Listen to frames captured by Android MediaProjection Foreground Service
   */
  private setupNativeFrameListener() {
    if (Platform.OS !== 'android') return;

    this.nativeFrameSub = DeviceEventEmitter.addListener('onScreenFrame', (event: any) => {
      if (!this.isBroadcasting || !this.currentPartnerId) return;

      if (event && event.frame) {
        this.frameCount++;

        // Send frame packet to viewer device via MQTT QoS 0 for fast streaming
        peerService.sendToDevice(this.currentPartnerId, {
          type: 'HEARTBEAT',
          fromId: getCleanDeviceId(),
          fromName: getDeviceIdentity().deviceName,
          payload: {
            streamEvent: 'LIVE_FRAME',
            frameData: event.frame,
            width: event.width || 540,
            height: event.height || 960,
            timestamp: Date.now(),
          },
          timestamp: Date.now(),
        });
      }
    });
  }

  /**
   * Subscribe to incoming live screen frames (Viewer side)
   */
  public onLiveFrame(listener: LiveFrameListener): () => void {
    this.frameListeners.add(listener);
    if (this.latestFrameData) {
      listener(this.latestFrameData);
    }
    return () => {
      this.frameListeners.delete(listener);
    };
  }

  /**
   * Subscribe to stream quality and stats
   */
  public onStats(listener: StatsListener): () => void {
    this.statsListeners.add(listener);
    return () => {
      this.statsListeners.delete(listener);
    };
  }

  private notifyStats(statusText: string) {
    const stats: StreamStats = {
      fps: this.currentFps,
      pingMs: this.currentPingMs,
      receivedFrames: this.frameCount,
      isStreaming: this.isReceiving || this.isBroadcasting,
      statusText,
    };
    this.statsListeners.forEach((l) => {
      try {
        l(stats);
      } catch (e) {}
    });
  }

  /**
   * Start broadcasting this device's screen (Callee side)
   */
  public async startBroadcasting(partnerCleanId: string) {
    if (this.isBroadcasting) return;

    this.isBroadcasting = true;
    this.currentPartnerId = partnerCleanId;
    this.frameCount = 0;

    console.log(`[ScreenStreamService] Requesting Android MediaProjection capture for ${partnerCleanId}`);

    // Request native Android MediaProjection screen capture
    if (ScreenCaptureModule && typeof ScreenCaptureModule.requestAndStartCapture === 'function') {
      try {
        await ScreenCaptureModule.requestAndStartCapture();
        console.log('[ScreenStreamService] Android MediaProjection started successfully');
      } catch (err) {
        console.warn('[ScreenStreamService] Screen capture permission denied or failed:', err);
      }
    }

    this.notifyStats('Screen Sharing Active • Live');
  }

  /**
   * Stop broadcasting
   */
  public async stopBroadcasting() {
    this.isBroadcasting = false;

    if (ScreenCaptureModule && typeof ScreenCaptureModule.stopCapture === 'function') {
      try {
        await ScreenCaptureModule.stopCapture();
      } catch (e) {}
    }

    if (this.currentPartnerId) {
      peerService.sendToDevice(this.currentPartnerId, {
        type: 'HEARTBEAT',
        fromId: getCleanDeviceId(),
        fromName: getDeviceIdentity().deviceName,
        payload: { streamEvent: 'STREAM_STOPPED' },
        timestamp: Date.now(),
      });
    }

    this.currentPartnerId = null;
    this.notifyStats('Screen Sharing Stopped');
  }

  /**
   * Start receiving stream from remote device (Viewer side)
   */
  public startReceiving(partnerCleanId: string) {
    this.isReceiving = true;
    this.currentPartnerId = partnerCleanId;
    this.frameCount = 0;
    this.lastFpsCalcTime = Date.now();
    this.fpsCounter = 0;
    this.latestFrameData = null;

    this.notifyStats('Connecting to live mobile stream...');
  }

  /**
   * Stop receiving
   */
  public stopReceiving() {
    this.isReceiving = false;
    this.currentPartnerId = null;
    this.latestFrameData = null;
    this.notifyStats('Disconnected');
  }

  /**
   * Handle incoming peer message containing live screen frames or control events
   */
  public handlePeerMessage(msg: any) {
    if (!msg) return;

    // 1. Live screen frames from remote device
    if (msg.type === 'HEARTBEAT' && msg.payload) {
      const { streamEvent, frameData, width, height, timestamp } = msg.payload;

      if (streamEvent === 'LIVE_FRAME' && frameData) {
        this.frameCount++;
        this.fpsCounter++;

        const now = Date.now();
        const elapsed = now - this.lastFpsCalcTime;
        if (elapsed >= 1000) {
          this.currentFps = Math.max(15, Math.round((this.fpsCounter * 1000) / elapsed));
          this.fpsCounter = 0;
          this.lastFpsCalcTime = now;
        }

        if (timestamp) {
          const ping = now - timestamp;
          if (ping > 0 && ping < 500) {
            this.currentPingMs = ping;
          }
        }

        const frameObj: LiveFrameData = {
          frameData,
          width: width || 540,
          height: height || 960,
          timestamp: timestamp || now,
        };
        this.latestFrameData = frameObj;

        this.frameListeners.forEach((listener) => {
          try {
            listener(frameObj);
          } catch (e) {}
        });

        this.notifyStats('Live Connected • 60 FPS • Real Mobile Screen');
      } else if (streamEvent === 'STREAM_STOPPED') {
        this.isReceiving = false;
        this.latestFrameData = null;
        this.notifyStats('Partner Stopped Screen Sharing');
      }
    }

    // 2. Incoming touch dispatch from remote controller phone (Host side)
    if (msg.type === 'TOUCH' && msg.payload) {
      const { relX, relY } = msg.payload;
      if (typeof relX === 'number' && typeof relY === 'number') {
        if (ScreenCaptureModule && typeof ScreenCaptureModule.dispatchTouch === 'function') {
          ScreenCaptureModule.dispatchTouch(relX, relY).catch(() => {});
        }
      }
    }

    // 2.1 Incoming swipe dispatch from remote controller phone (Host side)
    if (msg.type === 'SWIPE' && msg.payload) {
      const { startRelX, startRelY, endRelX, endRelY, duration } = msg.payload;
      if (
        typeof startRelX === 'number' &&
        typeof startRelY === 'number' &&
        typeof endRelX === 'number' &&
        typeof endRelY === 'number'
      ) {
        if (ScreenCaptureModule && typeof ScreenCaptureModule.dispatchSwipe === 'function') {
          ScreenCaptureModule.dispatchSwipe(
            startRelX,
            startRelY,
            endRelX,
            endRelY,
            duration || 250
          ).catch(() => {});
        }
      }
    }

    // 3. Incoming navigation dispatch (Host side)
    if (msg.type === 'NAV' && msg.payload) {
      const { action } = msg.payload;
      if (action) {
        if (ScreenCaptureModule && typeof ScreenCaptureModule.dispatchNav === 'function') {
          ScreenCaptureModule.dispatchNav(action).catch(() => {});
        }
      }
    }
  }

  public getStats(): StreamStats {
    return {
      fps: this.currentFps,
      pingMs: this.currentPingMs,
      receivedFrames: this.frameCount,
      isStreaming: this.isReceiving || this.isBroadcasting,
      statusText: this.isReceiving
        ? 'Live Connected • Real Screen'
        : this.isBroadcasting
        ? 'Screen Sharing Active'
        : 'Idle',
    };
  }

  public getLatestFrame(): LiveFrameData | null {
    return this.latestFrameData;
  }
}

export const screenStreamService = new ScreenStreamService();
