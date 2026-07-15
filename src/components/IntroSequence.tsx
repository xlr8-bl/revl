/**
 * IntroSequence — the first thing a new student ever sees. A single
 * glowing amber dot breathes at the centre; then the promise reveals one
 * line at a time, each landing with a soft haptic tick, building to a
 * "Let's…" line and a Get started button. Inspired by the ChatGPT app's
 * opening (a quiet dot + haptic-synced text reveal), rebuilt in Revl's
 * voice. Tap anywhere to reveal the rest immediately.
 */
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RevlLogo } from './RevlLogo';
import { colors, fonts, spacing, themedStyleSheet, useThemeVersion, withAlpha } from '../theme';

const LINES = [
  'Every past paper from your faculty.',
  'Every question — worked, verified, explained.',
  'A plan built around the exact courses you take.',
  "Let's get you exam-ready.",
];

const FIRST_DELAY = 700;
const STEP = 1500;

const tick = (heavy = false) => {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(heavy ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(
    () => {}
  );
};

export function IntroSequence({ onDone }: { onDone: () => void }) {
  useThemeVersion();
  const insets = useSafeAreaInsets();
  // How many lines are revealed. Starts at 0; climbs to LINES.length, then
  // `done` unlocks the button.
  const [shown, setShown] = useState(0);
  const [done, setDone] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // The dot's breathing glow — a single looping shared value.
  const breathe = useSharedValue(0);
  useEffect(() => {
    breathe.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [breathe]);
  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breathe.value * 0.18 }],
    opacity: 0.5 + breathe.value * 0.5,
  }));
  const coreStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + breathe.value * 0.06 }] }));

  // Reveal the lines on a timed cadence; each new line ticks the haptics.
  useEffect(() => {
    LINES.forEach((_, i) => {
      const t = setTimeout(() => {
        setShown(i + 1);
        tick(i === LINES.length - 1);
        if (i === LINES.length - 1) {
          const t2 = setTimeout(() => setDone(true), 650);
          timers.current.push(t2);
        }
      }, FIRST_DELAY + i * STEP);
      timers.current.push(t);
    });
    return () => timers.current.forEach(clearTimeout);
  }, []);

  // Tapping the screen fast-forwards: show everything and unlock the button.
  const revealAll = () => {
    if (done) return;
    timers.current.forEach(clearTimeout);
    setShown(LINES.length);
    setDone(true);
    tick(true);
  };

  const finish = () => {
    tick(true);
    onDone();
  };

  return (
    <Pressable style={styles.root} onPress={revealAll}>
      <View style={[styles.inner, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
        {/* The dot */}
        <View style={styles.dotWrap}>
          <Animated.View style={[styles.glowOuter, glowStyle]} />
          <View style={styles.glowMid} />
          <Animated.View style={[styles.core, coreStyle]} />
        </View>

        {/* Revealed lines */}
        <View style={styles.lines}>
          {LINES.slice(0, shown).map((line, i) => (
            <Animated.Text
              key={i}
              entering={FadeInDown.duration(520).easing(Easing.out(Easing.cubic))}
              style={[styles.line, i === LINES.length - 1 && styles.lineFinal]}>
              {line}
            </Animated.Text>
          ))}
        </View>

        {/* Footer: brand + CTA once done */}
        <View style={styles.footer}>
          {done ? (
            <Animated.View entering={FadeIn.duration(500)} style={{ width: '100%', alignItems: 'center' }}>
              <View style={styles.brandRow}>
                <RevlLogo size={22} />
                <Text style={styles.wordmark}>revl</Text>
              </View>
              <Pressable
                onPress={finish}
                style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}>
                <Text style={styles.ctaText}>Get started</Text>
              </Pressable>
            </Animated.View>
          ) : (
            <Text style={styles.skipHint}>tap to continue</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    inner: { flex: 1, paddingHorizontal: spacing.gutter + 10, alignItems: 'center', justifyContent: 'center' },
    dotWrap: { width: 170, height: 170, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    glowOuter: {
      position: 'absolute',
      width: 170,
      height: 170,
      borderRadius: 85,
      backgroundColor: withAlpha(colors.accent, 0.1),
    },
    glowMid: {
      position: 'absolute',
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: withAlpha(colors.accent, 0.16),
    },
    core: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.accent,
      shadowColor: colors.accent,
      shadowOpacity: 0.8,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 0 },
    },
    lines: { minHeight: 190, alignItems: 'center', justifyContent: 'flex-start', gap: 14, paddingTop: 8 },
    line: {
      fontFamily: fonts.medium,
      fontSize: 20,
      lineHeight: 27,
      color: colors.textSecondary,
      textAlign: 'center',
      maxWidth: 320,
    },
    lineFinal: { fontFamily: fonts.bold, fontSize: 23, lineHeight: 30, color: colors.text },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', paddingBottom: 8 },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 18 },
    wordmark: { fontFamily: fonts.bold, fontSize: 22, color: colors.text, letterSpacing: -0.5 },
    cta: {
      backgroundColor: colors.accent,
      borderRadius: 999,
      paddingVertical: 16,
      alignItems: 'center',
      width: '100%',
    },
    ctaText: { fontFamily: fonts.bold, fontSize: 16, color: colors.onAccent },
    skipHint: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textTertiary, letterSpacing: 0.3 },
  });
const styles = themedStyleSheet(makeStyles);
