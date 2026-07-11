/**
 * Downloads — the dedicated home for everything saved to this phone
 * (Spotify's model: browsing streams, downloads pin for offline, and ONE
 * page manages the pins). Papers are grouped by course with per-paper
 * sizes and a storage total; removing shows an Undo toast instead of
 * making rows vanish, so re-downloading never requires a hunt.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { papers } from '../data/papers';
import {
  downloadPaper,
  paperSize,
  removePaperDownload,
  usePaperDownloads,
} from '../lib/courseDownloads';
import { sentenceCase } from '../lib/format';
import { useOnline } from '../lib/connectivity';
import type { Paper } from '../types';
import { colors, fonts, spacing, themedStyleSheet, useThemeVersion } from '../theme';

export default function DownloadsScreen() {
  useThemeVersion();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const states = usePaperDownloads();
  const online = useOnline();
  /** Last removed paper id — powers the Undo toast. */
  const [removed, setRemoved] = useState<Paper | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const downloaded = papers.filter((p) => states[p.id]?.status === 'done');
  const totalBytes = downloaded.reduce((s, p) => s + JSON.stringify(p).length, 0);
  const totalLabel =
    totalBytes < 1024 * 1024 ? `${Math.max(1, Math.round(totalBytes / 1024))} KB` : `${(totalBytes / 1024 / 1024).toFixed(1)} MB`;

  // Group by course, newest year first inside each.
  const byCourse = new Map<string, Paper[]>();
  downloaded.forEach((p) => byCourse.set(p.courseCode, [...(byCourse.get(p.courseCode) ?? []), p]));

  const remove = (p: Paper) => {
    removePaperDownload(p.id);
    setRemoved(p);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setRemoved(null), 5000);
  };
  const undo = () => {
    if (!removed) return;
    downloadPaper(removed.id);
    setRemoved(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Downloads</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.gutter, paddingBottom: insets.bottom + 90 }}>
        {/* Storage summary */}
        <View style={styles.summary}>
          <View style={styles.summaryIcon}>
            <Ionicons name="arrow-down-circle" size={22} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>
              {downloaded.length === 0
                ? 'Nothing on this phone yet'
                : `${downloaded.length} paper${downloaded.length === 1 ? '' : 's'} on this phone`}
            </Text>
            <Text style={styles.summaryMeta}>
              {downloaded.length === 0 ? 'Downloads work without internet' : `${totalLabel} · works without internet`}
            </Text>
          </View>
          <View style={[styles.netDot, { backgroundColor: online === false ? colors.textTertiary : colors.verified }]} />
        </View>

        {downloaded.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="cloud-download-outline" size={34} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>Download papers to study offline</Text>
            <Text style={styles.emptyBody}>
              Tap the arrow on any paper in Courses and it will be here — openable with no connection at all.
            </Text>
            <Pressable onPress={() => router.back()} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>Browse courses</Text>
            </Pressable>
          </View>
        ) : (
          [...byCourse.entries()].map(([code, list], gi) => (
            <Animated.View key={code} entering={FadeInDown.delay(gi * 50).duration(220)} style={styles.group}>
              <Text style={styles.groupCode}>{code}</Text>
              <Text style={styles.groupTitle}>{sentenceCase(list[0].title)}</Text>
              <View style={styles.groupCard}>
                {[...list]
                  .sort((a, b) => b.year - a.year)
                  .map((p, i) => (
                    <View key={p.id} style={[styles.row, i > 0 && styles.rowDivider]}>
                      <Text style={styles.year}>{p.year}</Text>
                      <Text style={styles.meta} numberOfLines={1}>
                        {p.questions.length > 0
                          ? `${p.questions.length} question${p.questions.length === 1 ? '' : 's'} · ${p.session}`
                          : p.session}
                      </Text>
                      <Text style={styles.size}>{paperSize(p)}</Text>
                      <Pressable onPress={() => router.push(`/paper/${p.id}` as never)} hitSlop={8}>
                        <Text style={styles.open}>Open ›</Text>
                      </Pressable>
                      <Pressable onPress={() => remove(p)} hitSlop={10} style={styles.trash}>
                        <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
                      </Pressable>
                    </View>
                  ))}
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Undo toast — removal is never a dead end */}
      {removed && (
        <Animated.View
          entering={FadeInUp.duration(200)}
          exiting={FadeOutDown.duration(200)}
          style={[styles.toast, { bottom: insets.bottom + 24 }]}>
          <Text style={styles.toastText} numberOfLines={1}>
            Removed {removed.courseCode} {removed.year}
          </Text>
          <Pressable onPress={undo} hitSlop={10}>
            <Text style={styles.toastUndo}>Undo</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      paddingBottom: 8,
    },
    backBtn: { width: 40, alignItems: 'center' },
    topTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
    summary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: 14,
      marginTop: 8,
    },
    summaryIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryTitle: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
    summaryMeta: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
    netDot: { width: 8, height: 8, borderRadius: 4 },
    empty: { alignItems: 'center', gap: 10, marginTop: 70, paddingHorizontal: 30 },
    emptyTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.text, textAlign: 'center' },
    emptyBody: {
      fontFamily: fonts.regular,
      fontSize: 13.5,
      lineHeight: 20,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    emptyBtn: {
      backgroundColor: colors.accent,
      borderRadius: 999,
      paddingHorizontal: 22,
      paddingVertical: 11,
      marginTop: 8,
    },
    emptyBtnText: { fontFamily: fonts.medium, fontSize: 14, color: colors.onAccent },
    group: { marginTop: 24 },
    groupCode: { fontFamily: fonts.bold, fontSize: 12.5, letterSpacing: 1, color: colors.accent },
    groupTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text, marginTop: 2, marginBottom: 10 },
    groupCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderStrong,
      paddingHorizontal: 16,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13 },
    rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    year: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.text, fontVariant: ['tabular-nums'] },
    meta: { flex: 1, fontFamily: fonts.regular, fontSize: 12.5, color: colors.textSecondary },
    size: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.textTertiary, fontVariant: ['tabular-nums'] },
    open: { fontFamily: fonts.medium, fontSize: 13, color: colors.accent },
    trash: { paddingLeft: 2 },
    toast: {
      position: 'absolute',
      left: spacing.gutter + 10,
      right: spacing.gutter + 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderStrong,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 13,
    },
    toastText: { flex: 1, fontFamily: fonts.regular, fontSize: 13.5, color: colors.text },
    toastUndo: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.accent },
  });
const styles = themedStyleSheet(makeStyles);
