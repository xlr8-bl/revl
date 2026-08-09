/**
 * LetsReveal — the welcome hero.
 *
 * An ink dot eases along the line and acts as a MASK: everything it has passed
 * is written, everything ahead of it is still blank. Each letter lands with a
 * haptic, so the sentence is felt being written as much as read. The dot then
 * sweeps back, un-writing the line behind it, and the next one starts.
 *
 * The lines are CENTRED, which is what makes the geometry interesting. Every
 * line begins and ends at a different x, so there is no fixed home for the dot
 * to return to. After clearing a line it glides on to the exact point where the
 * NEXT line will begin — so the nib is always already standing where the first
 * letter is about to appear, and a short line following a long one does not
 * make the dot jump on the next write.
 *
 * Both passes are felt, at different rhythms: writing is a Heavy impact per
 * letter over the slower sweep, erasing a Light one per letter over the quicker
 * return. Same sentence, two textures.
 *
 * Letter positions are MEASURED, and every line is measured once up front so
 * nothing remounts mid-cycle. Reduce Motion switches the whole thing off:
 * the first line is simply already written. Screen readers get the sentence as
 * one label rather than a stream of separate letters.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { AccessibilityInfo, AppState, LayoutChangeEvent, Platform, StyleSheet, View } from 'react-native';
import { useIsFocused } from 'expo-router';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { colors, fonts } from '../theme';

/** [before, accented, after] — the middle word carries the brand colour. */
const LINES: [string, string, string][] = [
  ["Let's ", 'begin', '.'],
  ["Let's ", 'revise', '.'],
  ["Let's ", 'ace', ' it.'],
  ["Let's ", 'pass', '.'],
];

const FONT = 44;
const LINE_H = 56;
const DOT = 34;
const PAD = 16;

const EASE_WRITE = Easing.bezier(0.4, 0.05, 0.45, 0.95);
const EASE_ERASE = Easing.bezier(0.5, 0, 0.2, 1);
// Repositioning is travel, not performance: get there and settle.
const EASE_MOVE = Easing.bezier(0.4, 0, 0.2, 1);

const HOLD_MS = 950; // the line sits finished and readable
const ERASE_MS = 430;
const GAP_MS = 90;
const writeMs = (n: number) => 300 + n * 58;
/** Repositioning time scales with how far there is to go. */
const moveMs = (px: number) => Math.min(420, 120 + Math.abs(px) * 1.4);

type Measured = { x: number; w: number };
type Span = { start: number; end: number };

export function LetsReveal() {
  // Flattened per line, with the index range that should be accented.
  const lines = useMemo(
    () =>
      LINES.map(([pre, hot, post]) => ({
        chars: [...(pre + hot + post)],
        hotFrom: pre.length,
        hotTo: pre.length + hot.length,
        text: pre + hot + post,
      })),
    []
  );

  const marks = useSharedValue<number[][]>([]);
  const active = useSharedValue(-1);
  const dotX = useSharedValue(0);
  /**
   * Held down while the nib is only travelling to the next line's start. That
   * leg can move RIGHTWARDS — a short line following a long one begins further
   * in — and without sealing the line it would re-reveal the letters it had
   * just taken away.
   */
  const sealed = useSharedValue(0);

  const [index, setIndex] = useState(-1); // -1 until every line is measured
  const measured = useRef<Measured[][]>(lines.map((l) => new Array(l.chars.length)));
  const spans = useRef<Span[]>([]);
  const ready = useRef(false);

  const advance = useCallback(() => setIndex((i) => (i + 1) % LINES.length), []);

  /**
   * The loop only runs while this screen is actually in front. Pushing on to
   * the Mobile Money screen leaves welcome mounted underneath, and without this
   * the nib kept writing — and kept firing Heavy haptics — behind a screen
   * nobody was looking at. Backgrounding the app stops it too.
   */
  const focused = useIsFocused();
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => setForeground(st === 'active'));
    return () => sub.remove();
  }, []);
  const awake = focused && foreground;

  // A sweep that repeats for as long as the screen is up is exactly the motion
  // Reduce Motion exists to stop.
  const [stillness, setStillness] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((on) => alive && setStillness(on))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setStillness);
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);

  const onCharLayout = useCallback(
    (line: number, i: number, e: LayoutChangeEvent) => {
      const { x, width } = e.nativeEvent.layout;
      measured.current[line][i] = { x, w: width };
      if (ready.current) return;
      for (const row of measured.current) for (let k = 0; k < row.length; k++) if (!row[k]) return;
      ready.current = true;
      // Uncover a letter a third of the way into it, so the dot is still on the
      // character as it appears rather than having already left it.
      marks.value = measured.current.map((row) => row.map((c) => c.x + c.w * 0.34));
      spans.current = measured.current.map((row) => ({
        start: row[0].x - DOT / 2,
        end: row[row.length - 1].x + row[row.length - 1].w + DOT / 2,
      }));
      setIndex(0);
    },
    [marks]
  );

  useEffect(() => {
    if (index < 0) return;
    const here = spans.current[index];
    const next = spans.current[(index + 1) % LINES.length];
    active.value = index;
    sealed.value = 0;

    if (stillness) {
      dotX.value = here.end;
      return;
    }
    if (!awake) {
      cancelAnimation(dotX);
      dotX.value = here.start;
      return;
    }

    // Park at this line's own start. In the normal flow the previous cycle
    // already walked the nib to exactly here, so this is a no-op; after a pause
    // it is what puts the line back to its beginning.
    dotX.value = here.start;

    const reposition = next.start - here.start;
    dotX.value = withDelay(
      GAP_MS,
      withSequence(
        withTiming(here.end, { duration: writeMs(lines[index].chars.length), easing: EASE_WRITE }),
        // Clear the line completely, back to ITS start — stopping early at the
        // next line's start would strand the leftmost letters on screen.
        withDelay(
          HOLD_MS,
          withTiming(here.start, { duration: ERASE_MS, easing: EASE_ERASE }, (done) => {
            if (done) sealed.value = 1;
          })
        ),
        // Then walk to where the next line begins. Visible, on blank space, and
        // the reason the next write never starts with a jump.
        withTiming(
          next.start,
          { duration: reposition === 0 ? 0 : moveMs(reposition), easing: EASE_MOVE },
          (done) => {
            if (done) runOnJS(advance)();
          }
        )
      )
    );
    return () => cancelAnimation(dotX);
  }, [index, active, dotX, sealed, lines, advance, stillness, awake]);

  const buzz = useCallback(
    (line: number, i: number, writing: boolean) => {
      if (Platform.OS === 'web' || stillness || !awake) return;
      if (lines[line]?.chars[i] === ' ') return; // spaces are passed through
      Haptics.impactAsync(
        writing ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light
      ).catch(() => {});
    },
    [lines, stillness, awake]
  );

  // Uncovered-character count on the active line. Rising means the nib is
  // writing, falling means it is taking the line back — both are felt, and the
  // shorter return gives the lighter taps their own cadence.
  useAnimatedReaction(
    () => {
      const row = marks.value[active.value];
      if (!row || sealed.value === 1) return -1;
      let n = 0;
      for (let i = 0; i < row.length; i++) if (dotX.value >= row[i]) n++;
      return n;
    },
    (now, before) => {
      if (before === null || now === before || now < 0 || before < 0) return;
      if (now > before) for (let i = before; i < now; i++) runOnJS(buzz)(active.value, i, true);
      else for (let i = before - 1; i >= now; i--) runOnJS(buzz)(active.value, i, false);
    }
  );

  const dotStyle = useAnimatedStyle(() => ({ transform: [{ translateX: dotX.value - DOT / 2 }] }));

  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityRole="header"
      accessibilityLabel={lines[0].text}>
      {lines.map((line, li) => (
        <View
          key={li}
          style={styles.row}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          {line.chars.map((ch, i) => (
            <Char
              key={`${i}-${ch}`}
              ch={ch}
              line={li}
              i={i}
              hot={i >= line.hotFrom && i < line.hotTo}
              dotX={dotX}
              marks={marks}
              active={active}
              sealed={sealed}
              onLayout={onCharLayout}
            />
          ))}
        </View>
      ))}
      {index >= 0 && !stillness && (
        <Animated.View pointerEvents="none" style={[styles.dot, dotStyle]} />
      )}
    </View>
  );
}

function Char({
  ch,
  line,
  i,
  hot,
  dotX,
  marks,
  active,
  sealed,
  onLayout,
}: {
  ch: string;
  line: number;
  i: number;
  hot: boolean;
  dotX: SharedValue<number>;
  marks: SharedValue<number[][]>;
  active: SharedValue<number>;
  sealed: SharedValue<number>;
  onLayout: (line: number, i: number, e: LayoutChangeEvent) => void;
}) {
  // A hard cut, not a fade — a mask does not blur its edge. The letter is
  // simply already there once the nib has gone past.
  const style = useAnimatedStyle(() => {
    if (active.value !== line || sealed.value === 1) return { opacity: 0 };
    const mark = marks.value[line]?.[i];
    return { opacity: mark !== undefined && dotX.value >= mark ? 1 : 0 };
  });
  return (
    <Animated.Text
      onLayout={(e) => onLayout(line, i, e)}
      style={[styles.char, hot && styles.charHot, style]}>
      {/* A bare space collapses to zero width under react-native-web, which
          both closes the gap between words and corrupts the measured mask
          positions. A non-breaking space renders identically on native. */}
      {ch === ' ' ? '\u00A0' : ch}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  // alignSelf is load-bearing: every row is absolutely positioned, so nothing
  // gives this box an intrinsic width. Inside a centring parent it collapses to
  // a fraction of the line and the overflow clip eats both ends of the text.
  wrap: {
    alignSelf: 'stretch',
    height: LINE_H + PAD,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: PAD / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: LINE_H,
  },
  char: {
    fontFamily: fonts.bold,
    fontSize: FONT,
    lineHeight: LINE_H,
    color: colors.text,
    letterSpacing: -1.2,
  },
  charHot: { color: colors.accent },
  dot: {
    position: 'absolute',
    left: 0,
    top: (LINE_H + PAD - DOT) / 2,
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: colors.text,
  },
});
