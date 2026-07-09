/**
 * TapBurst — the Instagram double-tap pop. Whatever glyph you pass
 * (heart, raised hand) punches in at the center of the parent, overshoots,
 * settles, and fades. Bump `trigger` to fire it. Purely decorative:
 * pointerEvents off, so it never eats a tap.
 */
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

export function TapBurst({ trigger, children }: { trigger: number; children: React.ReactNode }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!trigger) return;
    opacity.value = withSequence(
      withTiming(1, { duration: 70 }),
      withDelay(380, withTiming(0, { duration: 240 }))
    );
    scale.value = 0;
    scale.value = withSequence(
      withTiming(1.25, { duration: 170, easing: Easing.out(Easing.back(2.2)) }),
      withTiming(1, { duration: 110 }),
      withDelay(240, withTiming(0.5, { duration: 240, easing: Easing.in(Easing.quad) }))
    );
  }, [trigger, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Animated.View style={style}>{children}</Animated.View>
    </View>
  );
}
