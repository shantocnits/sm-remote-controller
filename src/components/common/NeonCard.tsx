import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, StyleProp, ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';

interface NeonCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  pulsing?: boolean;
}

export const NeonCard: React.FC<NeonCardProps> = ({
  children,
  style,
  pulsing = true,
}) => {
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pulsing) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(borderAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(borderAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [borderAnim, pulsing]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(45, 212, 191, 0.15)', 'rgba(45, 212, 191, 0.45)'],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        { borderColor },
        style,
      ]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
