/**
 * BookletPaper — the faint ruling of a university answer booklet, sitting
 * behind the welcome hero.
 *
 * Two jobs. It gives the top of the screen something to be instead of blank
 * space, and it turns the nib's orange rule into a deliberate act: the page
 * arrives already ruled, and writing INKS the top rule rather than inventing a
 * line out of nowhere. The spacing is handed down from LetsReveal so the ink
 * falls exactly on a printed rule — a pixel out and the whole thing reads as
 * two unrelated lines.
 *
 * The red vertical margin is the giveaway detail: every booklet a Cameroonian
 * student has ever been handed has one down the left, and answers written past
 * it do not get marked.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { RULE_OFFSET, RULE_STEP } from './LetsReveal';
import { colors, spacing } from '../theme';

/** How far the margin rule sits left of the text, into the page gutter. */
const MARGIN_INSET = 14;

/**
 * `offset` is how far down the parent the writing line itself starts — the
 * hero's top padding. Without it the printed rules sit a padding's worth above
 * the ink and the two read as separate lines.
 */
export function BookletPaper({ height, offset = 0 }: { height: number; offset?: number }) {
  if (height <= 0) return null;
  const first = offset + RULE_OFFSET;
  const count = Math.max(0, Math.ceil((height - first) / RULE_STEP) + 1);

  return (
    <View pointerEvents="none" style={styles.paper}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.rule, { top: first + i * RULE_STEP }]} />
      ))}
      <View style={styles.margin} />
    </View>
  );
}

const styles = StyleSheet.create({
  // The hero is full-bleed (its gutter is applied as padding), so the ruling
  // simply fills it and runs off both edges the way a page does.
  paper: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  rule: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.text,
    opacity: 0.09,
  },
  margin: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: spacing.gutter + 6 - MARGIN_INSET,
    width: 1.5,
    backgroundColor: '#C4402B',
    opacity: 0.45,
  },
});
