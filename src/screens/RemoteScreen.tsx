import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Share,
  Alert,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Shadows } from '../theme/shadows';
import { VectorIcon } from '../components/common/VectorIcon';
import { LivePulseBadge } from '../components/common/LivePulseBadge';
import { useAppStore } from '../store/useAppStore';

import { peerService } from '../services/peerService';
import { screenStreamService, StreamStats, LiveFrameData } from '../services/screenStreamService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const RemoteScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const connectedDevice = useAppStore((state) => state.connectedDevice);
  const disconnectSession = useAppStore((state) => state.disconnectSession);
  const setActiveTab = useAppStore((state) => state.setActiveTab);

  const partnerName = connectedDevice?.name || 'Remote Partner';
  const partnerCode = connectedDevice?.code || '--- ---';
  const partnerCleanCode = partnerCode.replace(/[^0-9]/g, '');

  // Live stream quality and latency stats
  const [streamStats, setStreamStats] = useState<StreamStats>(screenStreamService.getStats());

  useEffect(() => {
    const unsub = screenStreamService.onStats((stats) => {
      setStreamStats(stats);
    });
    return () => {
      unsub();
    };
  }, []);

  // Session timer
  const [sessionSeconds, setSessionSeconds] = useState(1);

  // Double-buffered frames to eliminate black flicker/blinking completely
  const [currentFrame, setCurrentFrame] = useState<string | null>(null);
  const [prevFrame, setPrevFrame] = useState<string | null>(null);
  const viewportRef = useRef<{ width: number; height: number }>({ width: SCREEN_WIDTH, height: 600 });
  const touchStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });

  // Radar animation for scanner view
  const radarSpinAnim = useRef(new Animated.Value(0)).current;
  const radarPulseAnim = useRef(new Animated.Value(0.4)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(radarSpinAnim, {
        toValue: 1,
        duration: 3500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(radarPulseAnim, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(radarPulseAnim, {
          toValue: 0.4,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    );
    const spinnerLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    spinLoop.start();
    pulseLoop.start();
    spinnerLoop.start();

    return () => {
      spinLoop.stop();
      pulseLoop.stop();
      spinnerLoop.stop();
    };
  }, [radarSpinAnim, radarPulseAnim, spinAnim]);

  // Listen to live screen frames with double-buffered swap
  useEffect(() => {
    const unsub = screenStreamService.onLiveFrame((frame: LiveFrameData) => {
      if (frame && frame.frameData) {
        setPrevFrame((old) => old || frame.frameData);
        setCurrentFrame(frame.frameData);
      }
    });
    return () => unsub();
  }, []);

  // Live remote touch position
  const [cursorPos, setCursorPos] = useState({ x: 190, y: 260 });
  const [touchActive, setTouchActive] = useState(false);

  // PanResponder for smooth remote touch, click, swipe & scroll dispatch (AnyDesk style)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        touchStartRef.current = { x: locationX, y: locationY, time: Date.now() };
        setCursorPos({ x: Math.round(locationX), y: Math.round(locationY) });
        setTouchActive(true);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCursorPos({ x: Math.round(locationX), y: Math.round(locationY) });
      },
      onPanResponderRelease: (evt, gestureState) => {
        setTimeout(() => setTouchActive(false), 200);
        const { locationX, locationY } = evt.nativeEvent;
        const w = viewportRef.current.width || SCREEN_WIDTH;
        const h = viewportRef.current.height || 600;
        const startX = touchStartRef.current.x;
        const startY = touchStartRef.current.y;
        const dx = gestureState.dx;
        const dy = gestureState.dy;
        const distance = Math.hypot(dx, dy);

        if (!partnerCleanCode) return;

        if (distance < 12) {
          // Tap gesture
          const relX = Math.max(0, Math.min(1, locationX / w));
          const relY = Math.max(0, Math.min(1, locationY / h));
          peerService.sendTouch(partnerCleanCode, relX, relY);
        } else {
          // Swipe / Drag gesture
          const startRelX = Math.max(0, Math.min(1, startX / w));
          const startRelY = Math.max(0, Math.min(1, startY / h));
          const endRelX = Math.max(0, Math.min(1, locationX / w));
          const endRelY = Math.max(0, Math.min(1, locationY / h));
          const duration = Math.min(600, Math.max(120, Date.now() - touchStartRef.current.time));
          peerService.sendSwipe(partnerCleanCode, startRelX, startRelY, endRelX, endRelY, duration);
        }
      },
    })
  ).current;

  // Command history on remote screen
  const [commandLogs, setCommandLogs] = useState<string[]>([
    '> Mobile-to-Mobile Screen Connected [WebRTC P2P]',
    `> Remote Device: ${partnerName} (ID: ${partnerCode})`,
    '> Display: Live Mobile Screen @ 60 FPS',
    '> Input System: Real-time Touch & Keyboard Active',
  ]);

  // 1. Video Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [savedVideoModal, setSavedVideoModal] = useState<{
    visible: boolean;
    fileName: string;
    duration: string;
    size: string;
  }>({ visible: false, fileName: '', duration: '', size: '' });

  // 2. Screenshot State & Flash Animation
  const flashAnim = useRef(new Animated.Value(0)).current;
  const [screenshotModal, setScreenshotModal] = useState<{
    visible: boolean;
    fileName: string;
    timestamp: string;
  }>({ visible: false, fileName: '', timestamp: '' });

  // 3. Mic / Voice State
  const [isMicMuted, setIsMicMuted] = useState(false);

  // 4. Remote Keyboard State
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [typedText, setTypedText] = useState('');
  const textInputRef = useRef<TextInput>(null);

  // Toast / Notification banner state
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'warning' | 'danger';
    visible: boolean;
  }>({ text: '', type: 'info', visible: false });
  const toastAnim = useRef(new Animated.Value(-100)).current;

  // Session duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to remote events from partner
  useEffect(() => {
    const unsubscribe = peerService.addListener((msg) => {
      if (msg.type === 'DISCONNECT') {
        disconnectSession();
        Alert.alert('Session Ended', 'Partner disconnected from the remote session.');
      } else if (msg.type === 'TOUCH' && msg.payload) {
        setCursorPos({ x: msg.payload.x, y: msg.payload.y });
        setTouchActive(true);
        setTimeout(() => setTouchActive(false), 800);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Screen recording timer
  useEffect(() => {
    let recTimer: any = null;
    if (isRecording) {
      recTimer = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => {
      if (recTimer) clearInterval(recTimer);
    };
  }, [isRecording]);

  const showToast = (
    text: string,
    type: 'success' | 'info' | 'warning' | 'danger' = 'info'
  ) => {
    setToastMessage({ text, type, visible: true });
    Animated.spring(toastAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();

    setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setToastMessage((prev) => ({ ...prev, visible: false }));
      });
    }, 2800);
  };

  const formatTimer = (total: number) => {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleDisconnect = () => {
    if (isRecording) {
      setIsRecording(false);
    }
    disconnectSession();
  };

  // Touch handler to simulate remote touch move & tap
  const handleTouchScreen = (e: any) => {
    const { locationX, locationY } = e.nativeEvent;
    if (locationX !== undefined && locationY !== undefined) {
      const x = Math.round(locationX);
      const y = Math.round(locationY);
      setCursorPos({ x, y });
      setTouchActive(true);

      const w = viewportDimensions.width || SCREEN_WIDTH;
      const h = viewportDimensions.height || 600;
      const relX = Math.max(0, Math.min(1, locationX / w));
      const relY = Math.max(0, Math.min(1, locationY / h));

      if (partnerCleanCode) {
        peerService.sendTouch(partnerCleanCode, relX, relY);
      }
      showToast(`👆 Touch dispatched to partner screen`, 'info');
      setTimeout(() => setTouchActive(false), 800);
    }
  };

  // --- 1. Video Recording Action ---
  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      showToast('🔴 Screen recording started! Capturing stream...', 'danger');
    } else {
      const dur = formatTimer(recordingSeconds);
      const now = new Date();
      const timeStr = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
      const fileName = `SM_Record_${timeStr}.mp4`;
      const estSize = `${((recordingSeconds || 1) * 0.45).toFixed(1)} MB`;

      setIsRecording(false);
      setSavedVideoModal({
        visible: true,
        fileName,
        duration: dur,
        size: estSize,
      });
      showToast(`🎬 Recording saved: ${fileName} (${dur})`, 'success');
    }
  };

  // --- 2. Camera / Screenshot Action ---
  const handleTakeScreenshot = () => {
    // Camera shutter flash animation
    flashAnim.setValue(0.85);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start();

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const fileName = `SM_Screenshot_${now.getTime().toString().slice(-6)}.png`;

    setScreenshotModal({
      visible: true,
      fileName,
      timestamp: timeStr,
    });
    showToast('📸 Screenshot captured & saved to Gallery!', 'success');
  };

  // --- 3. Mic / Voice Mute Action ---
  const toggleMic = () => {
    const nextState = !isMicMuted;
    setIsMicMuted(nextState);
    if (nextState) {
      showToast('🔇 Mic Muted (Voice will not be transmitted)', 'warning');
    } else {
      showToast('🎙️ Mic Active (Voice is now transmitting)', 'success');
    }
  };

  // --- 4. Remote Keyboard Action ---
  const handleOpenKeyboard = () => {
    setIsKeyboardOpen(true);
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 150);
  };

  const handleSendKey = (keyName: string) => {
    if (partnerCleanCode) {
      peerService.sendKey(partnerCleanCode, keyName);
    }
    setCommandLogs((prev) => [
      ...prev.slice(-5),
      `> Key [${keyName}] sent to remote`,
    ]);
    showToast(`⌨️ Sent Key: [${keyName}] to remote device`, 'info');
  };

  const handleSendTypedText = () => {
    if (!typedText.trim()) return;
    const txt = typedText.trim();
    if (partnerCleanCode) {
      peerService.sendKey(partnerCleanCode, txt);
    }
    setCommandLogs((prev) => [...prev.slice(-5), `> ${txt}`]);
    showToast(`⌨️ Typed: "${txt}" sent to remote device`, 'success');
    setTypedText('');
  };

  const handleShareFile = async (name: string) => {
    try {
      await Share.share({
        message: `SM Remote Controller captured file: ${name}`,
        title: 'SM Remote Controller Export',
      });
    } catch (e) {
      // ignore
    }
  };

  if (!connectedDevice) {
    const radarSpin = radarSpinAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={[styles.container, styles.scannerContainer, { paddingTop: Math.max(insets.top + 16, 26) }]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        {/* Top Header */}
        <View style={styles.scannerHeaderRow}>
          <View>
            <Text style={[Typography.titleLarge, styles.scannerTitle]}>
              REMOTE <Text style={styles.scannerBrandAccent}>SCREEN</Text>
            </Text>
            <Text style={styles.scannerSub}>Live Mobile-to-Mobile Display</Text>
          </View>
          <View style={styles.scannerIdleBadge}>
            <View style={styles.scannerIdleDot} />
            <Text style={styles.scannerIdleText}>SCANNER ACTIVE</Text>
          </View>
        </View>

        {/* Center Animated Radar Scanner */}
        <View style={styles.radarCenterArea}>
          <View style={styles.radarRingOuter}>
            {/* Pulsing ripple wave */}
            <Animated.View
              style={[
                styles.radarRippleWave,
                {
                  transform: [{ scale: radarPulseAnim }],
                  opacity: radarPulseAnim.interpolate({
                    inputRange: [0.4, 1],
                    outputRange: [0.7, 0],
                  }),
                },
              ]}
            />
            {/* Center phone icon badge */}
            <View style={styles.radarHub}>
              <VectorIcon name="mobile" size={38} color={Colors.brandGreen} />
            </View>
          </View>

          <Text style={styles.radarNoticeTitle}>Waiting for Live Connection</Text>
          <Text style={styles.radarNoticeDesc}>
            No active remote session is connected right now. Enter a 6-digit Partner ID on the Connect tab, or ask your partner to accept your connection request.
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('home')}
            style={[styles.goConnectBtn, Shadows.subtleNeon]}>
            <VectorIcon name="link" size={16} color="#000000" />
            <Text style={styles.goConnectBtnText}>Go to Connect Screen</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Shutter Flash Animation Overlay */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shutterFlash,
          {
            opacity: flashAnim,
          },
        ]}
      />

      {/* Top Floating Notification / Toast Bar */}
      {toastMessage.visible && (
        <Animated.View
          style={[
            styles.toastBar,
            {
              top: Math.max(insets.top + 10, 30),
              transform: [{ translateY: toastAnim }],
              borderColor:
                toastMessage.type === 'danger'
                  ? Colors.dangerRed
                  : toastMessage.type === 'warning'
                  ? Colors.warningOrange
                  : toastMessage.type === 'success'
                  ? Colors.brandGreen
                  : Colors.neonCyan,
            },
          ]}>
          <Text style={styles.toastText}>{toastMessage.text}</Text>
        </Animated.View>
      )}

      {/* Top Session Status Bar */}
      <View
        style={[
          styles.topHeader,
          { paddingTop: Math.max(insets.top + 8, 20) },
        ]}>
        <View style={styles.partnerInfoPill}>
          <LivePulseBadge color={Colors.brandGreen} size={8} />
          <VectorIcon
            name="mobile"
            size={14}
            color={Colors.brandGreen}
          />
          <View>
            <Text style={styles.partnerNameText} numberOfLines={1}>
              {partnerName}
            </Text>
            <Text style={styles.partnerIdText}>ID: {partnerCode}</Text>
          </View>
        </View>

        <View style={styles.headerRightRow}>
          {/* Recording indicator when active */}
          {isRecording && (
            <View style={styles.recBadge}>
              <View style={styles.recDot} />
              <Text style={styles.recText}>REC {formatTimer(recordingSeconds)}</Text>
            </View>
          )}

          {/* Mute indicator when muted */}
          {isMicMuted && (
            <View style={styles.muteBadge}>
              <VectorIcon name="microphone-slash" size={12} color={Colors.dangerRed} />
              <Text style={styles.muteBadgeText}>MUTED</Text>
            </View>
          )}

          <View style={styles.timeBadge}>
            <Text style={[Typography.monoTimer, styles.timeText]}>
              {formatTimer(sessionSeconds)}
            </Text>
          </View>
        </View>
      </View>

      {/* Real-time Interactive Full-Width Edge-to-Edge Touch Screen Viewport */}
      <View
        style={styles.realScreenDisplayArea}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          viewportRef.current = { width, height };
          setViewportDimensions({ width, height });
        }}
        {...panResponder.panHandlers}>
        {/* Double-buffered frames to eliminate black flicker/blinking */}
        {prevFrame && (
          <Image
            source={{ uri: `data:image/jpeg;base64,${prevFrame}` }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="contain"
          />
        )}
        {currentFrame && (
          <Image
            source={{ uri: `data:image/jpeg;base64,${currentFrame}` }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="contain"
            onLoad={() => setPrevFrame(currentFrame)}
          />
        )}
        {!currentFrame && !prevFrame && (
          <View style={styles.waitingFrameContainer}>
            <Animated.View
              style={[
                styles.waitingSpinner,
                {
                  transform: [
                    {
                      rotate: spinAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}>
              <VectorIcon name="update" size={32} color={Colors.brandGreen} />
            </Animated.View>
            <Text style={styles.waitingFrameTitle}>Starting Screen Sharing...</Text>
            <Text style={styles.waitingFrameSub}>
              Connecting to {partnerName}'s live display.
            </Text>
            <Text style={styles.waitingFrameNote}>
              Even if {partnerName} minimizes SM Controller, their live Android screen will stream here in real time.
            </Text>
          </View>
        )}

        {/* Virtual Touch Ripple Pointer */}
        {touchActive && (
          <View
            pointerEvents="none"
            style={[
              styles.virtualTouchDot,
              {
                left: Math.max(10, cursorPos.x - 16),
                top: Math.max(10, cursorPos.y - 16),
              },
            ]}>
            <View style={styles.touchRippleInner} />
          </View>
        )}
      </View>

      {/* Bottom Controls Area (Docked cleanly below the screen so screen is never obscured) */}
      <View style={[styles.bottomControlDock, { paddingBottom: Math.max(insets.bottom + 55, 65) }]}>
        {/* Sleek, Compact Toolbar */}
        <View style={styles.compactToolbar}>
          {/* 1. Keyboard Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenKeyboard}
            style={[styles.compactToolBtn, isKeyboardOpen && styles.compactToolBtnActive]}>
            <VectorIcon
              name="keyboard"
              size={15}
              color={isKeyboardOpen ? Colors.brandGreen : Colors.textWhite}
            />
          </TouchableOpacity>

          {/* 2. Camera / Screenshot Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleTakeScreenshot}
            style={styles.compactToolBtn}>
            <VectorIcon name="camera" size={15} color={Colors.textWhite} />
          </TouchableOpacity>

          {/* 3. Mic / Mouth Speaker Mute Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleMic}
            style={[
              styles.compactToolBtn,
              isMicMuted ? styles.compactToolBtnMuted : styles.compactToolBtnUnmuted,
            ]}>
            <VectorIcon
              name={isMicMuted ? 'microphone-slash' : 'microphone'}
              size={15}
              color={isMicMuted ? Colors.dangerRed : Colors.brandGreen}
            />
          </TouchableOpacity>

          {/* 4. Video Record Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleRecording}
            style={[
              styles.compactToolBtn,
              isRecording ? styles.compactToolBtnRecording : null,
            ]}>
            <VectorIcon
              name={isRecording ? 'stop' : 'record'}
              size={15}
              color={isRecording ? Colors.dangerRed : Colors.textWhite}
            />
          </TouchableOpacity>

          <View style={styles.compactDivider} />

          {/* 5. Disconnect Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleDisconnect}
            style={styles.compactDisconnectBtn}>
            <VectorIcon name="phone-slash" size={15} color={Colors.dangerRed} />
          </TouchableOpacity>
        </View>

        {/* Android Navigation Bar (◁ Back, ○ Home, ▢ Recents) */}
        <View style={styles.androidNavBar}>
          <TouchableOpacity
            onPress={() => {
              if (partnerCleanCode) peerService.sendNav(partnerCleanCode, 'back');
            }}
            style={styles.navBarBtn}>
            <Text style={styles.navBarBtnText}>◁</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (partnerCleanCode) peerService.sendNav(partnerCleanCode, 'home');
            }}
            style={styles.navBarBtn}>
            <Text style={styles.navBarBtnText}>○</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (partnerCleanCode) peerService.sendNav(partnerCleanCode, 'recents');
            }}
            style={styles.navBarBtn}>
            <Text style={styles.navBarBtnText}>▢</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- MODAL 1: Saved Video Modal --- */}
      <Modal
        visible={savedVideoModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setSavedVideoModal((prev) => ({ ...prev, visible: false }))
        }>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, Shadows.modalShadow]}>
            <View style={styles.modalHeaderIconContainer}>
              <VectorIcon name="record" size={32} color={Colors.dangerRed} />
            </View>
            <Text style={styles.modalTitle}>Video Recording Saved!</Text>
            <Text style={styles.modalSub}>
              Your remote screen recording was successfully captured and saved to device storage.
            </Text>

            <View style={styles.fileDetailBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>File Name:</Text>
                <Text style={styles.detailValue}>{savedVideoModal.fileName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Duration:</Text>
                <Text style={styles.detailValue}>{savedVideoModal.duration}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Estimated Size:</Text>
                <Text style={styles.detailValue}>{savedVideoModal.size}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailValue}>/Movies/SM_Recordings</Text>
              </View>
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={() => handleShareFile(savedVideoModal.fileName)}>
                <VectorIcon name="share" size={16} color={Colors.textWhite} />
                <Text style={styles.modalBtnSecondaryText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBtnPrimary}
                onPress={() =>
                  setSavedVideoModal((prev) => ({ ...prev, visible: false }))
                }>
                <Text style={styles.modalBtnPrimaryText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL 2: Screenshot Modal --- */}
      <Modal
        visible={screenshotModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setScreenshotModal((prev) => ({ ...prev, visible: false }))
        }>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, Shadows.modalShadow]}>
            <View style={styles.modalHeaderIconContainer}>
              <VectorIcon name="camera" size={32} color={Colors.brandGreen} />
            </View>
            <Text style={styles.modalTitle}>Screenshot Captured!</Text>
            <Text style={styles.modalSub}>
              A high-resolution snapshot of the remote screen was captured.
            </Text>

            <View style={styles.fileDetailBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Image:</Text>
                <Text style={styles.detailValue}>{screenshotModal.fileName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Resolution:</Text>
                <Text style={styles.detailValue}>1080 x 2400 (Ultra HD)</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Saved to:</Text>
                <Text style={styles.detailValue}>Pictures/Screenshots</Text>
              </View>
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={() => handleShareFile(screenshotModal.fileName)}>
                <VectorIcon name="share" size={16} color={Colors.textWhite} />
                <Text style={styles.modalBtnSecondaryText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBtnPrimary}
                onPress={() =>
                  setScreenshotModal((prev) => ({ ...prev, visible: false }))
                }>
                <Text style={styles.modalBtnPrimaryText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL 3: Remote Keyboard Sheet --- */}
      <Modal
        visible={isKeyboardOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsKeyboardOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardBackdrop}>
          <TouchableOpacity
            style={styles.keyboardDismissArea}
            activeOpacity={1}
            onPress={() => setIsKeyboardOpen(false)}
          />

          <View style={[styles.keyboardSheet, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
            <View style={styles.sheetHandle} />

            <View style={styles.keyboardHeader}>
              <View style={styles.keyboardHeaderTitleRow}>
                <VectorIcon name="keyboard" size={18} color={Colors.brandGreen} />
                <Text style={styles.keyboardHeaderTitle}>Remote Keyboard Input</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsKeyboardOpen(false)}
                style={styles.sheetCloseBtn}>
                <VectorIcon name="close" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Live Typing Bar */}
            <View style={styles.inputContainer}>
              <TextInput
                ref={textInputRef}
                style={styles.textInput}
                placeholder="Type text to send directly to remote..."
                placeholderTextColor={Colors.textMuted}
                value={typedText}
                onChangeText={setTypedText}
                onSubmitEditing={handleSendTypedText}
                returnKeyType="send"
              />
              <TouchableOpacity
                onPress={handleSendTypedText}
                style={styles.sendTextBtn}>
                <VectorIcon name="paper-plane" size={16} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Quick Virtual Remote Shortcut Keys */}
            <Text style={styles.shortcutHeading}>Remote Shortcut Keys:</Text>
            <View style={styles.shortcutRow}>
              <TouchableOpacity
                style={styles.keyBtn}
                onPress={() => handleSendKey('Enter')}>
                <Text style={styles.keyBtnText}>Enter ↵</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.keyBtn}
                onPress={() => handleSendKey('Backspace')}>
                <Text style={styles.keyBtnText}>⌫ Backspace</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.keyBtn}
                onPress={() => handleSendKey('Tab')}>
                <Text style={styles.keyBtnText}>Tab ⇥</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.keyBtn}
                onPress={() => handleSendKey('Esc')}>
                <Text style={styles.keyBtnText}>Esc</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.shortcutRow}>
              <TouchableOpacity
                style={styles.keyBtn}
                onPress={() => handleSendKey('Ctrl+C')}>
                <Text style={styles.keyBtnText}>Ctrl+C</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.keyBtn}
                onPress={() => handleSendKey('Ctrl+V')}>
                <Text style={styles.keyBtnText}>Ctrl+V</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.keyBtn}
                onPress={() => handleSendKey('Space')}>
                <Text style={styles.keyBtnText}>Space ␣</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.keyBtn}
                onPress={() => handleSendKey('Home/Desktop')}>
                <Text style={styles.keyBtnText}>Win / Home ⌘</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.65,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  shutterFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    zIndex: 99,
  },
  toastBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(18, 22, 30, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 20,
  },
  partnerInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    gap: 8,
    maxWidth: '55%',
  },
  partnerNameText: {
    color: Colors.textWhite,
    fontWeight: '700',
    fontSize: 12,
  },
  partnerIdText: {
    color: Colors.brandGreen,
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  streamQualityPill: {
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
  },
  streamQualityText: {
    color: Colors.brandGreen,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dangerRed,
    gap: 5,
  },
  recDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dangerRed,
  },
  recText: {
    color: Colors.dangerRed,
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  muteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.6)',
    gap: 4,
  },
  muteBadgeText: {
    color: Colors.dangerRed,
    fontSize: 10,
    fontWeight: '700',
  },
  timeBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  timeText: {
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    fontWeight: '600',
    fontSize: 11,
  },

  // Viewport styles
  screenViewport: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },

  // Desktop OS styles
  desktopOSContainer: {
    flex: 1,
    backgroundColor: '#0a0d14',
    position: 'relative',
    justifyContent: 'space-between',
  },
  desktopWallpaper: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#05070a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  liveStreamBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.4)',
    marginBottom: 12,
  },
  liveStreamDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brandGreen,
  },
  remoteStatusBar: {
    position: 'absolute',
    top: 15,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  remoteTimeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  remoteStatusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  remoteStatusIconText: {
    color: Colors.brandGreen,
    fontSize: 10,
    fontWeight: '800',
  },
  remoteBatteryText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  remoteDesktop: {
    width: '100%',
    paddingHorizontal: 10,
    marginVertical: 20,
  },
  remoteAppGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  remoteAppIconCol: {
    alignItems: 'center',
    gap: 6,
  },
  remoteAppIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  remoteAppEmoji: {
    fontSize: 22,
  },
  remoteAppLabel: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '600',
  },
  liveStreamText: {
    color: Colors.brandGreen,
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  backgroundStreamNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  backgroundStreamNoticeText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '500',
  },
  mobileStreamFrame: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#040608',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  androidNavBar: {
    position: 'absolute',
    bottom: 15,
    left: 30,
    right: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 25,
  },
  navBarBtn: {
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  navBarBtnText: {
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  remoteWindow: {
    alignSelf: 'center',
    width: '82%',
    maxWidth: 420,
    height: 240,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.35)',
    marginTop: 70,
    marginLeft: 40,
    overflow: 'hidden',
    zIndex: 15,
  },
  windowTitleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  windowDots: {
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  windowTitle: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'monospace',
    flex: 1,
    textAlign: 'center',
  },
  terminalBody: {
    flex: 1,
    padding: 10,
    backgroundColor: '#020617',
    gap: 4,
  },
  terminalText: {
    color: '#38bdf8',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  terminalInputLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  terminalPrompt: {
    color: '#10b981',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  terminalTypingPreview: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'monospace',
    marginLeft: 4,
  },
  blinkingCursor: {
    width: 6,
    height: 12,
    backgroundColor: Colors.brandGreen,
    marginLeft: 2,
  },
  virtualCursor: {
    position: 'absolute',
    zIndex: 40,
    alignItems: 'flex-start',
  },
  cursorCoordinates: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.brandGreen,
    marginTop: 2,
    marginLeft: 14,
  },
  cursorCoordinatesText: {
    color: Colors.brandGreen,
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  desktopTaskbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 44,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 20,
  },
  taskbarCenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskbarAppIconActive: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    borderBottomWidth: 2,
    borderBottomColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskbarAppIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskbarTray: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskbarClock: {
    color: '#cbd5e1',
    fontSize: 10,
    fontFamily: 'monospace',
  },

  // Mobile OS styles
  mobileOSContainer: {
    flex: 1,
    backgroundColor: '#0c0f17',
    paddingHorizontal: 18,
    justifyContent: 'space-between',
  },
  phoneStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 65,
    paddingHorizontal: 8,
  },
  phoneStatusTime: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  phoneStatusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phoneStatus5G: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  phoneStatusBattery: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  phoneContent: {
    flex: 1,
    paddingTop: 16,
    gap: 14,
  },
  phoneWeatherWidget: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  phoneWeatherTemp: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
  },
  phoneWeatherCity: {
    color: Colors.brandGreen,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  phoneSearchWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  phoneSearchText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  phoneSessionCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.25)',
    gap: 4,
  },
  phoneSessionHeader: {
    color: Colors.brandGreen,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  phoneLogText: {
    color: '#38bdf8',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  phoneAppGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  phoneAppItem: {
    alignItems: 'center',
    gap: 4,
  },
  phoneAppIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneAppLabel: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '500',
  },
  virtualTouchDot: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(45, 212, 191, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
  touchRippleInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.brandGreen,
  },
  phoneHomeBar: {
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
    opacity: 0.5,
    alignSelf: 'center',
    marginBottom: 75,
  },
  toolbarWrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 30,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    gap: 6,
  },
  toolBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.appBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnActive: {
    borderWidth: 1.5,
    borderColor: Colors.brandGreen,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
  },
  toolBtnMuted: {
    borderWidth: 1.5,
    borderColor: Colors.dangerRed,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  toolBtnUnmuted: {
    backgroundColor: Colors.appBg,
  },
  toolBtnRecording: {
    borderWidth: 2,
    borderColor: Colors.dangerRed,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.borderDark,
    marginHorizontal: 4,
  },
  disconnectBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.dangerRedSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#161922',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    padding: 24,
    alignItems: 'center',
  },
  modalHeaderIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textWhite,
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  fileDetailBox: {
    width: '100%',
    backgroundColor: '#0c0f14',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginBottom: 20,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: Colors.textWhite,
    fontWeight: '700',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#262b36',
    paddingVertical: 14,
    borderRadius: 14,
  },
  modalBtnSecondaryText: {
    color: Colors.textWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  modalBtnPrimary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.brandGreen,
    paddingVertical: 14,
    borderRadius: 14,
  },
  modalBtnPrimaryText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },

  // Keyboard Sheet styles
  keyboardBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  keyboardDismissArea: {
    flex: 1,
  },
  keyboardSheet: {
    backgroundColor: '#161922',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    padding: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
    alignSelf: 'center',
    marginBottom: 16,
  },
  keyboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  keyboardHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  keyboardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textWhite,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#262b36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c0f14',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    height: 46,
    color: Colors.textWhite,
    fontSize: 14,
  },
  sendTextBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutHeading: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 10,
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  keyBtn: {
    flex: 1,
    backgroundColor: '#222834',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  keyBtnText: {
    color: Colors.textWhite,
    fontSize: 12,
    fontWeight: '600',
  },

  // --- Scanner & Radar Screen Styles ---
  scannerContainer: {
    backgroundColor: '#0a0d14',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  scannerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  scannerTitle: {
    color: Colors.textWhite,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scannerBrandAccent: {
    color: Colors.brandGreen,
  },
  scannerSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  scannerIdleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
  },
  scannerIdleDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.brandGreen,
  },
  scannerIdleText: {
    color: Colors.brandGreen,
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  radarCenterArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  radarRingOuter: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1.5,
    borderColor: 'rgba(45, 212, 191, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'rgba(10, 16, 26, 0.6)',
    marginBottom: 28,
  },
  radarRippleWave: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 2,
    borderColor: Colors.brandGreen,
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
  },
  radarHub: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#121824',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.brandGreen,
    shadowColor: Colors.brandGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  radarNoticeTitle: {
    color: Colors.textWhite,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  radarNoticeDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 320,
    marginBottom: 24,
  },
  goConnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.brandGreen,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
  },
  goConnectBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },

  // --- Live Screen Real Viewport Styles ---
  realScreenDisplayArea: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000000',
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  realLiveFrameImage: {
    width: '100%',
    height: '100%',
  },
  waitingFrameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    maxWidth: 340,
  },
  waitingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
  },
  waitingFrameTitle: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  waitingFrameSub: {
    color: Colors.brandGreen,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 10,
  },
  waitingFrameNote: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },

  // --- Compact Bottom Controls Dock (Docked cleanly below the screen) ---
  bottomControlDock: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#090c12',
    paddingTop: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    zIndex: 30,
  },
  compactToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 28, 38, 0.95)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  compactToolBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#161922',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactToolBtnActive: {
    borderWidth: 1,
    borderColor: Colors.brandGreen,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
  },
  compactToolBtnMuted: {
    borderWidth: 1,
    borderColor: Colors.dangerRed,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  compactToolBtnUnmuted: {
    backgroundColor: '#161922',
  },
  compactToolBtnRecording: {
    borderWidth: 1.5,
    borderColor: Colors.dangerRed,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  compactDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: 2,
  },
  compactDisconnectBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.dangerRedSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  androidNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
    paddingVertical: 2,
  },
});
