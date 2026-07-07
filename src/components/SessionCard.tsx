/**
 * StudyQueueRow — one numbered step in tonight's plan. Rows live inside
 * a single hairline-bordered group card (see Home) with dividers:
 * amber step number, title + meta, chevron. A deliberate departure from
 * thumbnail-card feeds — this is a checklist, not a content feed.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SessionCardData } from '../data/home';
import { colors, fonts } from '../theme';

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
      {data.pill && (
        <View style={styles.pill}>
          <Ionicons name={data.pill.icon as never} size={11} color={colors.accent} />
          <Text style={styles.pillText}>{data.pill.value}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={17} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillText: { fontFamily: fonts.medium, fontSize: 11, color: colors.accent },
});
