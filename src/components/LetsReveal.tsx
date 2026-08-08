/**
 * LetsReveal — the welcome hero.
 *
 * An ink dot eases left→right along the line and acts as a MASK: everything
 * it has passed is written, everything ahead of it is still blank paper. Each
 * letter lands with a strong haptic, so the sentence is felt being written as
 * much as it is read. The dot then eases back to the left, un-writing the line
 * behind it, and the next one starts.
 *
 * The dot drags a RULE behind it — the ruled line of an answer booklet, laid
 * down in Revl's orange as the nib passes and pulled back up as it retreats.
 * A bare dot travelling a line is somebody else's signature; this is the one
 * thing on the screen that could only belong to an exam app.
 *
 * Two things this file is built around:
 *
 *  - Letter positions are MEASURED, not assumed. In a proportional serif an
 *    evenly-spaced approximation drifts by the second word, and the effect
 *    depends entirely on the dot and the letter it uncovers being the same
 *    pixel.
 *
 *  - EVERY line is measured once, up front, and nothing remounts afterwards.
 *    Swapping the text per cycle meant a remount and a fresh layout pass
 *    between lines, which stranded the dot at the margin for about half a
 *    second — right where the eye was already resting on it. After the first
 *    layout this is pure animation on one shared value.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { LayoutChangeEvent, Platform, StyleSheet, View } from 'react-native';
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

const LINES = ["Let's begin.", "Let's revise.", "Let's ace it.", "Let's pass."];

const FONT = 40;
const LINE_H = 54;
const DOT = 30;
const PAD = 22; // breathing room above and below the line

/**
 * Where the nib lays its rule, measured from the top of this component, and
 * how far apart consecutive rules sit. Exported so the ruled paper behind the
 * hero can line up with the ink exactly — the illusion only works if the
 * orange rule falls precisely on a printed one.
 */
export const RULE_OFFSET = PAD / 2 + LINE_H - 7;
export const RULE_STEP = LINE_H;

/**
 * Rest position: fully past the left edge, so the wrap's clip hides the dot
 * between lines instead of parking a half-circle against the margin.
 */
const HOME = -DOT;

// Near-linear with soft ends: an even haptic cadence through the middle of the
// word, easing in off the margin and settling on the full stop. Anything more
// curved makes the first and last letters crawl.
const EASE_WRITE = Easing.bezier(0.4, 0.05, 0.45, 0.95);
// Coming back is a retreat, not a performance — quicker, and out of the way.
const EASE_ERASE = Easing.bezier(0.5, 0, 0.2, 1);

const HOLD_MS = 900; // the line sits finished and readable
const ERASE_MS = 440;
const GAP_MS = 60; // one beat of blank paper before the next line
const writeMs = (n: number) => 300 + n * 58;

type Measured = { x: number; w: number };

export function LetsReveal() {
  const lines = useMemo(() => LINES.map((t) => [...t]), []);

  // marks[line][char] = the x at which that character is uncovered.
  const marks = useSharedValue<number[][]>([]);
  const active = useSharedValue(-1);
  const dotX = useSharedValue(HOME);

  const [index, setIndex] = useState(-1); // -1 until every line is measured
  const measured = useRef<Measured[][]>(lines.map((l) => new Array(l.length)));
  const ends = useRef<number[]>([]);
  const ready = useRef(false);

  const advance = useCallback(() => setIndex((i) => (i + 1) % LINES.length), []);

  const onCharLayout = useCallback(
    (line: number, i: number, e: LayoutChangeEvent) => {
      const { x, width } = e.nativeEvent.layout;
      measured.current[line][i] = { x, w: width };
      if (ready.current) return;
      for (const row of measured.current) for (let k = 0; k < row.length; k++) if (!row[k]) return;
      ready.current = true;
      // Uncover a letter a third of the way into it, so the dot is still
      // sitting on the character as it appears rather than having left it.
      marks.value = measured.current.map((row) => row.map((c) => c.x + c.w * 0.34));
      ends.current = measured.current.map((row) => row[row.length - 1].x + row[row.length - 1].w);
      setIndex(0);
    },
    [marks]
  );

  // Drives one line, then hands off to the next. Nothing unmounts.
  useEffect(() => {
    if (index < 0) return;
    active.value = index;
    dotX.value = HOME;
    dotX.value = withDelay(
      GAP_MS,
      withSequence(
        withTiming(ends.current[index] + DOT / 2, {
          duration: writeMs(lines[index].length),
          easing: EASE_WRITE,
        }),
        withDelay(
          HOLD_MS,
          withTiming(HOME, { duration: ERASE_MS, easing: EASE_ERASE }, (done) => {
            if (done) runOnJS(advance)();
          })
        )
      )
    );
    return () => cancelAnimation(dotX);
  }, [index, active, dotX, lines, advance]);

  const buzz = useCallback(
    (line: number, i: number) => {
      if (Platform.OS === 'web') return;
      if (lines[line]?.[i] === ' ') return; // spaces are passed through, not written
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    },
    [lines]
  );

  // Count of uncovered characters on the active line. It only ever rises on
  // the write pass, so comparing against the previous count gives exactly one
  // haptic per letter and silence on the way back — every cycle, for as long
  // as the screen is up.
  useAnimatedReaction(
    () => {
      const row = marks.value[active.value];
      if (!row) return 0;
      let n = 0;
      for (let i = 0; i < row.length; i++) if (dotX.value >= row[i]) n++;
      return n;
    },
    (now, before) => {
      if (before === null || now <= before) return;
      for (let i = before; i < now; i++) runOnJS(buzz)(active.value, i);
    }
  );

  const dotStyle = useAnimatedStyle(() => ({ transform: [{ translateX: dotX.value - DOT / 2 }] }));
  // The rule is simply everything the nib has already crossed.
  const ruleStyle = useAnimatedStyle(() => ({ width: Math.max(0, dotX.value) }));

  return (
    <View style={styles.wrap}>
      {lines.map((chars, line) => (
        <View key={line} style={styles.row} pointerEvents="none">
          {chars.map((ch, i) => (
            <Char
              key={`${i}-${ch}`}
              ch={ch}
              line={line}
              i={i}
              dotX={dotX}
              marks={marks}
              active={active}
              onLayout={onCharLayout}
            />
          ))}
        </View>
      ))}
      {/* Hidden until the first line is ready, so neither the nib nor its rule
          sits at the margin waiting on a layout pass. */}
      {index >= 0 && (
        <>
          <Animated.View pointerEvents="none" style={[styles.rule, ruleStyle]} />
          <Animated.View pointerEvents="none" style={[styles.dot, dotStyle]} />
        </>
      )}
    </View>
  );
}

function Char({
  ch,
  line,
  i,
  dotX,
  marks,
  active,
  onLayout,
}: {
  ch: string;
  line: number;
  i: number;
  dotX: SharedValue<number>;
  marks: SharedValue<number[][]>;
  active: SharedValue<number>;
  onLayout: (line: number, i: number, e: LayoutChangeEvent) => void;
}) {
  // A hard cut, not a fade — the dot is a mask, and a mask does not blur its
  // edge. The letter is simply already there once the ink has gone past.
  const style = useAnimatedStyle(() => {
    if (active.value !== line) return { opacity: 0 };
    const mark = marks.value[line]?.[i];
    return { opacity: mark !== undefined && dotX.value >= mark ? 1 : 0 };
  });
  return (
    <Animated.Text onLayout={(e) => onLayout(line, i, e)} style={[styles.char, style]}>
      {ch === ' ' ? ' ' : ch}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  wrap: { height: LINE_H + PAD, justifyContent: 'center', overflow: 'hidden' },
  row: {
    position: 'absolute',
    left: 0,
    top: PAD / 2,
    flexDirection: 'row',
    alignItems: 'center',
    height: LINE_H,
  },
  char: {
    fontFamily: fonts.serif,
    fontSize: FONT,
    lineHeight: LINE_H,
    color: colors.text,
    letterSpacing: -0.4,
  },
  rule: {
    position: 'absolute',
    left: 0,
    top: RULE_OFFSET,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
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
