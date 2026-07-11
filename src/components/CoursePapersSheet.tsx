/**
 * CoursePapersSheet — tapping a featured course opens this: the full list
 * of available papers for that course as tappable year rows. Opening a
 * paper records access (feeding the "most-used" featured order).
 */
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { papers, unlockedPaperIds } from '../data/papers';
import { recordAccess } from '../lib/courseAccess';
import { sentenceCase } from '../lib/format';
import { colors, fonts, themedStyleSheet, useThemeVersion } from '../theme';
import { BottomSheet } from './BottomSheet';
import { PaperDownloadBadge } from './DownloadBadge';

export function CoursePapersSheet({
  code,
  title,
  visible,
  onClose,
}: {
  code: string;
  title: string;
  visible: boolean;
  onClose: () => void;
}) {
  useThemeVersion();
  const router = useRouter();
  const list = papers.filter((p) => p.courseCode === code).sort((a, b) => b.year - a.year);

  const open = (id: string, unlocked: boolean) => {
    recordAccess(code);
    onClose();
    router.push((unlocked ? `/paper/${id}` : `/unlock/${id}`) as never);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.code}>{code}</Text>
      <Text style={styles.title}>{sentenceCase(title)}</Text>
      <Text style={styles.count}>
        {list.length} paper{list.length === 1 ? '' : 's'} available
      </Text>

      {/* Papers render inline so the sheet hugs the list — a course only has a
          handful of years, so there's no dead space and nothing to scroll. If
          a set ever runs long, the sheet caps and this scrolls within it. */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEnabled={list.length > 7}
        style={list.length > 7 ? { maxHeight: 380 } : undefined}>
        {list.map((p, i) => {
          const unlocked = unlockedPaperIds.has(p.id);
          return (
            <Pressable
              key={p.id}
              onPress={() => open(p.id, unlocked)}
              style={({ pressed }) => [styles.row, i > 0 && styles.rowBorder, pressed && { opacity: 0.6 }]}>
              <Text style={styles.year}>{p.year}</Text>
              {/* Count first — the session name is what truncates, never the
                  number of questions. */}
              <Text style={styles.meta} numberOfLines={1}>
                {p.questions.length > 0
                  ? `${p.questions.length} question${p.questions.length === 1 ? '' : 's'} · ${p.session}`
                  : p.session}
              </Text>
              <PaperDownloadBadge paper={p} />
              <Text style={[styles.action, !unlocked && { color: colors.textSecondary }]}>
                {unlocked ? 'Open ›' : 'Unlock ›'}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </BottomSheet>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    code: { fontFamily: fonts.bold, fontSize: 13, letterSpacing: 1, color: colors.accent },
    title: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, color: colors.text, marginTop: 4 },
    count: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: 8 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
    rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    year: { fontFamily: fonts.bold, fontSize: 15, color: colors.text, fontVariant: ['tabular-nums'] },
    meta: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
    action: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.accent, width: 60, textAlign: 'right' },
  });
const styles = themedStyleSheet(makeStyles);
