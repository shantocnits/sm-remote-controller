import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Shadows } from '../../theme/shadows';
import { VectorIcon } from '../common/VectorIcon';
import { LivePulseBadge } from '../common/LivePulseBadge';
import { useAppStore } from '../../store/useAppStore';
import { formatSecondsToTimer } from '../../utils/timerUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PIP_WIDTH = 110;
const PIP_HEIGHT = 160;

export const PipVideoCall: React.FC = () => {
  const {
    videoCallStatus,
    videoSeconds,
    tickVideoTimer,
    expandVideoCall,
    endVideoCall,
  } = useAppStore();

  const pan = useRef(
    new Animated.ValueXY({
      x: SCREEN_WIDTH - PIP_WIDTH - 20,
      y: 80,
    })
  ).current;

  // Real-time call timer while minimized
  useEffect(() => {
    if (videoCallStatus !== 'minimized') return;
    const interval = setInterval(() => {
      tickVideoTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [videoCallStatus, tickVideoTimer]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  if (videoCallStatus !== 'minimized') return null;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.pipContainer,
        Shadows.pipShadow,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}>
      {/* Background Simulation Feed */}
      <View style={styles.feedWrapper}>
        <VectorIcon name="mobile" size={32} color="rgba(45, 212, 191, 0.4)" />
      </View>

      {/* Top Header: Timer + Live Pulse */}
      <View style={styles.topRow}>
        <View style={styles.timerBadge}>
          <Text style={[Typography.monoTimer, styles.timerText]}>
            {formatSecondsToTimer(videoSeconds)}
          </Text>
        </View>
        <LivePulseBadge color={Colors.brandGreen} size={6} />
      </View>

      {/* Bottom Actions: Expand & End Call */}
      <View style={styles.bottomRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={expandVideoCall}
          style={styles.expandBtn}>
          <VectorIcon name="expand" size={14} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={endVideoCall}
          style={styles.endBtn}>
          <VectorIcon name="phone-slash" size={12} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pipContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: PIP_WIDTH,
    height: PIP_HEIGHT,
    borderRadius: 18,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: Colors.brandGreen,
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 8,
    zIndex: 9999,
    elevation: 20,
  },
  feedWrapper: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#12161f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  timerBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timerText: {
    color: Colors.textWhite,
    fontSize: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
    paddingBottom: 2,
  },
  expandBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(44, 44, 46, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.dangerRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
