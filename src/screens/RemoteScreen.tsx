import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Shadows } from '../theme/shadows';
import { VectorIcon } from '../components/common/VectorIcon';
import { LivePulseBadge } from '../components/common/LivePulseBadge';
import { useAppStore } from '../store/useAppStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const RemoteScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { setActiveTab } = useAppStore();

  // Session timer
  const [sessionSeconds, setSessionSeconds] = useState(262);

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
    setActiveTab('home');
  };

  // --- 1. Video Recording Action ---
  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      showToast('🔴 Screen recording started! Capturing desktop/phone feed...', 'danger');
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
    showToast(`⌨️ Sent Key: [${keyName}] to remote device`, 'info');
  };

  const handleSendTypedText = () => {
    if (!typedText.trim()) return;
    showToast(`⌨️ Typed: "${typedText}" sent to remote device`, 'success');
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Full-Screen Stream Background Image matching index.html */}
      <Image
        source={{
          uri: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop',
        }}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Dark overlay */}
      <View style={styles.darkOverlay} />

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
        <View style={styles.liveBadge}>
          <LivePulseBadge color={Colors.dangerRed} size={8} />
          <Text style={[Typography.caption, styles.liveText]}>Live Session</Text>
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

      {/* Center Device Stream Information Info */}
      <View style={styles.centerInfo}>
        <View style={styles.feedCard}>
          <VectorIcon name="desktop" size={48} color={Colors.brandGreen} />
          <Text style={[Typography.bodyMedium, styles.feedText]}>
            Connected to Galaxy S23 Ultra
          </Text>
          <Text style={[Typography.caption, styles.subFeedText]}>
            Streaming at 60 FPS • 1080p Ultra HD
          </Text>

          {isRecording && (
            <View style={styles.recordingPill}>
              <View style={styles.recDot} />
              <Text style={styles.recordingPillText}>
                Recording Screen... {formatTimer(recordingSeconds)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Floating Action Toolbar */}
      <View
        style={[
          styles.toolbarWrapper,
          { bottom: Math.max(insets.bottom + 85, 95) },
        ]}>
        <View style={[styles.toolbar, Shadows.cardShadow]}>
          {/* 1. Keyboard Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenKeyboard}
            style={[styles.toolBtn, isKeyboardOpen && styles.toolBtnActive]}>
            <VectorIcon
              name="keyboard"
              size={18}
              color={isKeyboardOpen ? Colors.brandGreen : Colors.textWhite}
            />
          </TouchableOpacity>

          {/* 2. Camera / Screenshot Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleTakeScreenshot}
            style={styles.toolBtn}>
            <VectorIcon name="camera" size={18} color={Colors.textWhite} />
          </TouchableOpacity>

          {/* 3. Mic / Mouth Speaker Mute Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleMic}
            style={[
              styles.toolBtn,
              isMicMuted ? styles.toolBtnMuted : styles.toolBtnUnmuted,
            ]}>
            <VectorIcon
              name={isMicMuted ? 'microphone-slash' : 'microphone'}
              size={18}
              color={isMicMuted ? Colors.dangerRed : Colors.brandGreen}
            />
          </TouchableOpacity>

          {/* 4. Video Record Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleRecording}
            style={[
              styles.toolBtn,
              isRecording ? styles.toolBtnRecording : null,
            ]}>
            <VectorIcon
              name={isRecording ? 'stop' : 'record'}
              size={18}
              color={isRecording ? Colors.dangerRed : Colors.textWhite}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Disconnect Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleDisconnect}
            style={styles.disconnectBtn}>
            <VectorIcon name="phone-slash" size={16} color={Colors.dangerRed} />
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
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    gap: 8,
  },
  liveText: {
    color: Colors.textWhite,
    fontWeight: '700',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dangerRed,
    gap: 6,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dangerRed,
  },
  recText: {
    color: Colors.dangerRed,
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  muteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 5,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  timeText: {
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  centerInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  feedCard: {
    backgroundColor: 'rgba(12, 15, 20, 0.75)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    paddingVertical: 24,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedText: {
    color: Colors.textWhite,
    marginTop: 14,
    fontWeight: '700',
    fontSize: 15,
  },
  subFeedText: {
    color: Colors.brandGreen,
    marginTop: 4,
    fontSize: 12,
  },
  recordingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dangerRed,
    marginTop: 12,
    gap: 6,
  },
  recordingPillText: {
    color: '#ff8080',
    fontSize: 12,
    fontWeight: '700',
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
});
