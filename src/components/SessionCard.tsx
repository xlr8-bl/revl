/**
 * StudyQueueRow — one numbered step in tonight's plan. Rows live inside
 * a single hairline-bordered group card (see Home) with dividers:
 * amber step number, title + meta, chevron. A deliberate departure from
 * thumbnail-card feeds — this is a checklist, not a content feed.
 */
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SessionCardData } from '../data/home';
import { colors, fonts, themedStyleSheet } from '../theme';

export function SessionCard({ data, index, last }: { data: SessionCardData; index: number; last?: boolean }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(data.route as never)}
      style={({ pressed }) => [styles.row, !last && styles.rowDivider, pressed && { opacity: 0.75 }]}>
      <Text style={styles.number}>{String(index + 1).padStart(2, '0')}</Text>
      <View style={styles.body}>
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.meta}>{data.meta}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const makeStyles = () => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 16 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  number: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.accent,
    width: 24,
    fontVariant: ['tabular-nums'],
  },
  body: { flex: 1 },
  title: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 3 },
  chevron: { fontFamily: fonts.regular, fontSize: 20, color: colors.textTertiary, marginTop: -2 },
});
const styles = themedStyleSheet(makeStyles);
