/**
 * TapBurst — the Instagram double-tap heart pop, placed at the exact
 * point the finger landed. Give it the tap coordinates (relative to the
 * parent) plus a `trigger` counter to fire it. Renders in a full-bleed,
 * non-clipping overlay so the heart is never cut off at an edge.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export function TapBurst({
  trigger,
  x,
  y,
  size = 88,
  color = '#FFFFFF',
}: {
  trigger: number;
  x: number;
  y: number;
  size?: number;
  color?: string;
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!trigger) return;
    opacity.value = withSequence(
      withTiming(1, { duration: 70 }),
      withDelay(360, withTiming(0, { duration: 240 }))
    );
    scale.value = 0;
    scale.value = withSequence(
      withTiming(1.25, { duration: 170, easing: Easing.out(Easing.back(2.2)) }),
      withTiming(1, { duration: 110 }),
      withDelay(220, withTiming(0.7, { duration: 240, easing: Easing.in(Easing.quad) }))
    );
  }, [trigger, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'visible' }}>
      <Animated.View
        style={[
          { position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, alignItems: 'center', justifyContent: 'center' },
          style,
        ]}>
        {/* Soft shadow so the heart reads on any background, light or dark. */}
        <Ionicons
          name="heart"
          size={size}
          color={color}
          style={{ textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 2 } }}
        />
      </Animated.View>
    </View>
  );
}
