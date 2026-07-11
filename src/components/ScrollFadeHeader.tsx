/**
 * ScrollFadeHeader — the pinned-title + gradient-blend pattern: the page
 * title stays fixed at the top, and as you scroll, content dissolves
 * under it through a gradient that fades from the page background to
 * transparent. Theme-derived (built from the live bg), so it reads the
 * same in light and dark.
 *
 * Usage:
 *   const { scrollY, onScroll } = useScrollFade();
 *   <TopFade scrollY={scrollY} solid={headerHeight} fade={56} />
 *   ...pinned header (absolute)...
 *   <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} ... />
 *
 * `solid` is the fully-opaque height — set it to the pinned header height so
 * the title (and any sticky subtitle) always sit on solid bg. `fade` is the
 * soft dissolve tail *below* that, where scrolling content melts away; keep
 * it short for a crisp blend, longer for a gentler one.
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

export function TopFade({
  scrollY,
  solid,
  fade = 80,
}: {
  scrollY: SharedValue<number>;
  /** Fully-opaque height — cover the pinned header so nothing bleeds through. */
  solid: number;
  /** Soft dissolve tail below the header (px). Shorter = crisper blend. */
  fade?: number;
}) {
  useThemeVersion();
  const height = solid + fade;
  const solidFrac = solid / height;
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 70], [0, 1], 'clamp'),
  }));
  // Opaque under the header, then a short soft dissolve for the tail.
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', top: 0, left: 0, right: 0, height, zIndex: 5 }, style]}>
      <LinearGradient
        colors={[colors.bg, colors.bg, withAlpha(colors.bg, 0.55), withAlpha(colors.bg, 0)]}
        locations={[0, solidFrac, solidFrac + (1 - solidFrac) * 0.5, 1]}
        style={{ flex: 1 }}
      />
    </Animated.View>
  );
}
