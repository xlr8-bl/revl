/**
 * BookletPaper — the page the whole welcome screen is written on.
 *
 * A university answer booklet: faint horizontal ruling, and the red vertical
 * margin down the left that every booklet a Cameroonian student has been
 * handed carries. Answers written past it do not get marked.
 *
 * The ruling's phase comes from LetsReveal (RULE_OFFSET / RULE_STEP) via
 * `offset`, so the nib's orange stroke lands exactly on a printed rule. A pixel
 * out and the two read as unrelated lines instead of one being inked.
 *
 * The margin runs the full height because a page's does. The ruling stops at
 * `rulesTo` — the sign-in block sits below it, on the unruled foot of the page,
 * which is what keeps the buttons from looking like they are floating on
 * stationery.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { RULE_OFFSET, RULE_STEP } from './LetsReveal';
import { colors, spacing } from '../theme';

/** How far the margin sits in from the page edge. */
const MARGIN_X = spacing.gutter - 8;

export function BookletPaper({
  height,
  rulesFrom,
  rulesTo,
  offset = 0,
}: {
  height: number;
  rulesFrom: number;
  rulesTo: number;
  offset?: number;
}) {
  if (height <= 0) return null;

  // Rules march outwards from the writing line in BOTH directions, so the page
  // is ruled above the hero as well — a booklet does not start at the sentence
  // you happen to be writing. They stop short of the head, leaving the
  // wordmark on clean paper with the first rule beneath it as a header break.
  const anchor = offset + RULE_OFFSET;
  const above = Math.max(0, Math.ceil((anchor - rulesFrom) / RULE_STEP));
  const below = Math.max(0, Math.ceil((rulesTo - anchor) / RULE_STEP));
  const tops: number[] = [];
  for (let i = -above; i <= below; i++) {
    const y = anchor + i * RULE_STEP;
    if (y >= rulesFrom && y <= rulesTo) tops.push(y);
  }

  return (
    <View pointerEvents="none" style={styles.paper}>
      {tops.map((top) => (
        <View key={top} style={[styles.rule, { top }]} />
      ))}
      <View style={[styles.margin, { height }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  paper: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  rule: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.text,
    opacity: 0.085,
  },
  margin: {
    position: 'absolute',
    top: 0,
    left: MARGIN_X,
    width: 1.5,
    backgroundColor: '#C4402B',
    opacity: 0.4,
  },
});
