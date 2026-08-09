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
  // The blur STOPS just under the header text (2px past its bottom) —
  // never bleeding into content. Only a short colour tail follows.
  const blurEnd = Math.max(0, solid - 2);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 70], [0, 1], 'clamp'),
  }));
  const tint = scheme === 'light' ? ('systemUltraThinMaterialLight' as const) : ('systemUltraThinMaterialDark' as const);
  // iOS bands, INVERTED opacity: the longest band is the faintest, so its
  // terminal edge is nearly invisible — no hard cut; strength accumulates
  // toward the top where all bands overlap. (BlurView has no mask API on
  // native, so this is the softest edge it can produce.)
  const bands =
    Platform.OS === 'ios'
      ? [
          { h: blurEnd, o: 0.28 },
          { h: blurEnd * 0.92, o: 0.5 },
          { h: blurEnd * 0.84, o: 0.72 },
          { h: blurEnd * 0.76, o: 0.88 },
          { h: blurEnd * 0.68, o: 1 },
        ]
      : [];
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', top: 0, left: 0, right: 0, height, zIndex: 5 }, style]}>
      {Platform.OS === 'web' && (
        <BlurView
          intensity={30}
          tint={tint}
          style={[
            StyleSheet.absoluteFill,
            {
              height: blurEnd,
              maskImage: 'linear-gradient(to bottom, black 72%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 72%, transparent 100%)',
            } as never,
          ]}
        />
      )}
      {bands.map((band, i) => (
        <BlurView
          key={i}
          intensity={9}
          tint={tint}
          style={[StyleSheet.absoluteFill, { height: band.h, opacity: band.o }]}
        />
      ))}
      {/* Brand tint rides on top of the blur. Translucent even at the very
          top, so blurred content ghosts through from the first pixel. It
          stays present where the faint band edges end and dissolves over the
          short tail, swallowing any residual cut. Android (no blur) keeps
          the opaque backing for legibility. */}
      <LinearGradient
        colors={
          Platform.OS === 'android'
            ? [colors.bg, colors.bg, withAlpha(colors.bg, 0.55), withAlpha(colors.bg, 0)]
            : [withAlpha(colors.bg, 0.62), withAlpha(colors.bg, 0.52), withAlpha(colors.bg, 0.4), withAlpha(colors.bg, 0)]
        }
        locations={[0, 0.55, Math.min(blurEnd / height, 0.94), 1]}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}
