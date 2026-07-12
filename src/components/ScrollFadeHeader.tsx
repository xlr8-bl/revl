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
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { colors, useResolvedScheme, useThemeVersion, withAlpha } from '../theme';

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
  const scheme = useResolvedScheme();
  const height = solid + fade;
  const solidFrac = solid / height;
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 70], [0, 1], 'clamp'),
  }));
  // Progressive blur. Web: ONE BlurView with a CSS gradient mask — a true
  // variable blur, perfectly seamless (stacking bands there compounds the
  // saturate() filter into a colour cast). iOS: BlurView is uniform-only
  // and unmaskable, so a few gentle overlapping bands approximate the
  // gradient. Android's experimental blur is too heavy for either — pure
  // gradient dissolve.
  const bands = Platform.OS === 'ios' ? [1, 0.85, 0.7, 0.55, 0.4] : [];
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', top: 0, left: 0, right: 0, height, zIndex: 5 }, style]}>
      {Platform.OS === 'web' && (
        <BlurView
          intensity={22}
          tint={scheme === 'light' ? 'systemUltraThinMaterialLight' : 'systemUltraThinMaterialDark'}
          style={[
            StyleSheet.absoluteFill,
            {
              maskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
            } as never,
          ]}
        />
      )}
      {bands.map((frac, i) => (
        <BlurView
          key={i}
          intensity={8}
          tint={scheme === 'light' ? 'systemUltraThinMaterialLight' : 'systemUltraThinMaterialDark'}
          style={[StyleSheet.absoluteFill, { height: height * frac }]}
        />
      ))}
      {/* Brand tint rides on top of the blur — translucent even at the very
          top, so blurred content ghosts through from the first pixel (the
          blur is the surface; the tint only warms it). Android has no blur
          bands, so it keeps the opaque backing for legibility. */}
      <LinearGradient
        colors={
          bands.length > 0
            ? [withAlpha(colors.bg, 0.62), withAlpha(colors.bg, 0.55), withAlpha(colors.bg, 0.3), withAlpha(colors.bg, 0)]
            : [colors.bg, colors.bg, withAlpha(colors.bg, 0.55), withAlpha(colors.bg, 0)]
        }
        locations={[0, solidFrac * 0.9, solidFrac + (1 - solidFrac) * 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}
