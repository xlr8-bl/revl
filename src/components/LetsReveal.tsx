/**
 * LetsReveal — the welcome hero.
 *
 * An ink dot eases left→right along the line and acts as a MASK: everything
 * it has passed is written, everything ahead of it is still blank paper. Each
 * letter lands with a strong haptic, so the sentence is felt being written as
 * much as it is read. The dot then eases back to the left, un-writing the line
 * behind it, and the next one starts.
 *
 * Letter positions are MEASURED rather than assumed. In a proportional serif
 * an evenly-spaced approximation drifts by the second word, and the whole
 * effect depends on the dot and the letter it uncovers being the same pixel.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { LayoutChangeEvent, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
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

const LINES = ["Let's begin.", "Let's revise.", "Let's ace it.", "Let's pass."];

const FONT = 34;
const LINE_H = 46;
const DOT = 26;

// Near-linear with soft ends: an even haptic cadence through the middle of the
// word, easing in off the margin and settling on the full stop. Anything more
// curved makes the first and last letters crawl.
const EASE_WRITE = Easing.bezier(0.4, 0.05, 0.45, 0.95);
// Coming back is a retreat, not a performance — quicker, and out of the way.
const EASE_ERASE = Easing.bezier(0.5, 0, 0.2, 1);

const HOLD_MS = 900; // the line sits finished and readable
// The tail of the return trip is the dot crossing ground it has already
// cleared, so it is kept short — any longer and the hero is just a drifting
// dot for half a second between lines.
const ERASE_MS = 440;
const GAP_MS = 120;
const writeMs = (n: number) => 300 + n * 58;

// Haptics run for the opening lines and then go quiet — the welcome screen can
// sit on-screen for a while and a buzz every second stops being a delight.
const HAPTIC_LINES = 2;

export function LetsReveal() {
  const [cycle, setCycle] = useState(0);
  const next = useCallback(() => setCycle((c) => c + 1), []);
  return (
    <View style={styles.wrap}>
      <Line key={cycle} text={LINES[cycle % LINES.length]} haptics={cycle < HAPTIC_LINES} onDone={next} />
    </View>
  );
}

function Line({ text, haptics, onDone }: { text: string; haptics: boolean; onDone: () => void }) {
  const chars = useMemo(() => [...text], [text]);

  // x of the dot's centre, in row coordinates.
  const dotX = useSharedValue(-DOT);
  // The x each character is considered "uncovered" at.
  const marks = useSharedValue<number[]>([]);

  const measured = useRef<{ x: number; w: number }[]>([]);
  const started = useRef(false);

  const buzz = useCallback(
    (i: number) => {
      if (!haptics || Platform.OS === 'web') return;
      if (chars[i] === ' ') return; // spaces are passed through, not written
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    },
    [chars, haptics]
  );

  const start = useCallback(() => {
    const m = measured.current;
    const end = m[m.length - 1].x + m[m.length - 1].w;
    // Uncover a letter a third of the way into it, so the dot is still sitting
    // on the character as it appears rather than having already left it.
    marks.value = m.map((c) => c.x + c.w * 0.34);
    dotX.value = -DOT / 2;
    dotX.value = withSequence(
      withTiming(end + DOT / 2, { duration: writeMs(chars.length), easing: EASE_WRITE }),
      withDelay(
        HOLD_MS,
        withTiming(-DOT / 2, { duration: ERASE_MS, easing: EASE_ERASE }, (done) => {
          if (done) runOnJS(onDone)();
        })
      )
    );
  }, [chars.length, dotX, marks, onDone]);

  const onCharLayout = useCallback(
    (i: number, e: LayoutChangeEvent) => {
      const { x, width } = e.nativeEvent.layout;
      measured.current[i] = { x, w: width };
      if (started.current) return;
      for (let k = 0; k < chars.length; k++) if (!measured.current[k]) return;
      started.current = true;
      // One frame of settle so the row's final layout is what we animate over.
      requestAnimationFrame(() => setTimeout(start, GAP_MS));
    },
    [chars.length, start]
  );

  // Count of uncovered characters. It only ever rises on the write pass, so
  // comparing against the previous count gives us exactly one haptic per
  // letter and silence on the way back.
  useAnimatedReaction(
    () => {
      const m = marks.value;
      let n = 0;
      for (let i = 0; i < m.length; i++) if (dotX.value >= m[i]) n++;
      return n;
    },
    (now, before) => {
      if (before === null || now <= before) return;
      for (let i = before; i < now; i++) runOnJS(buzz)(i);
    }
  );

  const dotStyle = useAnimatedStyle(() => ({ transform: [{ translateX: dotX.value - DOT / 2 }] }));

  return (
    <View style={styles.row}>
      {chars.map((ch, i) => (
        <Char key={`${i}-${ch}`} ch={ch} i={i} dotX={dotX} marks={marks} onLayout={onCharLayout} />
      ))}
      <Animated.View pointerEvents="none" style={[styles.dot, dotStyle]} />
    </View>
  );
}

function Char({
  ch,
  i,
  dotX,
  marks,
  onLayout,
}: {
  ch: string;
  i: number;
  dotX: SharedValue<number>;
  marks: SharedValue<number[]>;
  onLayout: (i: number, e: LayoutChangeEvent) => void;
}) {
  // A hard cut, not a fade — the dot is a mask, and a mask does not blur its
  // edge. The letter is simply already there once the ink has gone past.
  const style = useAnimatedStyle(() => {
    const mark = marks.value[i];
    return { opacity: mark !== undefined && dotX.value >= mark ? 1 : 0 };
  });
  return (
    <Animated.Text onLayout={(e) => onLayout(i, e)} style={[styles.char, style]}>
      {ch === ' ' ? ' ' : ch}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  wrap: { height: LINE_H + 22, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', height: LINE_H },
  char: {
    fontFamily: fonts.serif,
    fontSize: FONT,
    lineHeight: LINE_H,
    color: colors.text,
    letterSpacing: -0.2,
  },
  dot: {
    position: 'absolute',
    left: 0,
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: colors.text,
  },
});
