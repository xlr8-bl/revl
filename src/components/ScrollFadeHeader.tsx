/**
 * ScrollFadeHeader — the pinned-title + gradient-blend pattern: the page
 * title stays fixed at the top, and as you scroll, content dissolves
 * under it through a gradient that fades from the page background to
 * transparent. Theme-derived (built from the live bg), so it reads the
 * same in light and dark.
 *
 * Usage:
 *   const { scrollY, onScroll } = useScrollFade();
 *   <TopFade scrollY={scrollY} height={headerHeight + 80} />
 *   ...pinned header (absolute)...
 *   <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} ... />
 */
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { colors, useThemeVersion, withAlpha } from '../theme';

export function useScrollFade() {
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  return { scrollY, onScroll };
}

export function TopFade({ scrollY, height }: { scrollY: SharedValue<number>; height: number }) {
  useThemeVersion();
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 70], [0, 1], 'clamp'),
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', top: 0, left: 0, right: 0, height, zIndex: 5 }, style]}>
      <LinearGradient
        colors={[colors.bg, colors.bg, withAlpha(colors.bg, 0.7), withAlpha(colors.bg, 0)]}
        locations={[0, 0.5, 0.75, 1]}
        style={{ flex: 1 }}
      />
    </Animated.View>
  );
}
