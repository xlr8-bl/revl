/**
 * Downloads — the dedicated home for everything saved to this phone
 * (Spotify's model: browsing streams, downloads pin for offline, ONE page
 * manages the pins). Visually it speaks the app's own language: big bold
 * left title, cream page, and course groups as the same tinted-band index
 * cards as the Courses tab. Removal shows an Undo toast instead of making
 * rows vanish, so re-downloading never requires a hunt.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { papers } from '../data/papers';
import { downloadPaper, paperSize, removePaperDownload, usePaperDownloads } from '../lib/courseDownloads';
import { useOnline } from '../lib/connectivity';
import { sentenceCase } from '../lib/format';
import type { Paper } from '../types';
import { activeScheme, colors, fonts, spacing, themedStyleSheet, useThemeVersion, withAlpha } from '../theme';

export default function DownloadsScreen() {
  useThemeVersion();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const states = usePaperDownloads();
  const online = useOnline();
  /** Last removed paper — powers the Undo toast. */
  const [removed, setRemoved] = useState<Paper | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [query, setQuery] = useState('');

  const allDownloaded = papers.filter((p) => states[p.id]?.status === 'done');
  const q = query.trim().toLowerCase();
  const downloaded = q
    ? allDownloaded.filter(
        (p) =>
          p.courseCode.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          String(p.year).includes(q)
      )
    : allDownloaded;
  const totalBytes = downloaded.reduce((s, p) => s + JSON.stringify(p).length, 0);
  const totalLabel =
    totalBytes < 1024 * 1024
      ? `${Math.max(1, Math.round(totalBytes / 1024))} KB`
      : `${(totalBytes / 1024 / 1024).toFixed(1)} MB`;

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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 90 }}>
        {/* Header. The app's voice: circle back, kicker, big bold title */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.kicker}>
            {online === false ? 'Offline · everything here still opens' : 'On this phone'}
          </Text>
          <Text style={styles.title}>Downloads</Text>
          <Text style={styles.meta}>
            {allDownloaded.length === 0
              ? 'Papers you download live here and open without internet.'
              : `${allDownloaded.length} paper${allDownloaded.length === 1 ? '' : 's'} · ${totalLabel} · works without internet`}
          </Text>

          {allDownloaded.length > 0 && (
            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color={colors.textTertiary} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Code, title or year. E.g. CEC420, 2023"
                placeholderTextColor={colors.textTertiary}
                style={styles.searchInput}
                autoCapitalize="characters"
                returnKeyType="search"
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
                </Pressable>
              )}
            </View>
          )}
        </View>

        {downloaded.length === 0 ? (
          q ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No downloads match “{query.trim()}”</Text>
              <Text style={styles.emptyBody}>Try a course code, title or year.</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <View style={styles.emptyBadge}>
                <Ionicons name="arrow-down-circle" size={30} color={colors.accent} />
              </View>
              <Text style={styles.emptyTitle}>Nothing downloaded yet</Text>
              <Text style={styles.emptyBody}>
                Tap the arrow on any paper in Courses and it lands here. Ready for the amphi, the bus, or a blackout.
              </Text>
              <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.9 }]}>
                <Text style={styles.emptyBtnText}>Browse courses</Text>
              </Pressable>
            </View>
          )
        ) : (
          [...byCourse.entries()].map(([code, list], gi) => {
            const courseBytes = list.reduce((s, p) => s + JSON.stringify(p).length, 0);
            const courseSize =
              courseBytes < 1024 * 1024
                ? `${Math.max(1, Math.round(courseBytes / 1024))} KB`
                : `${(courseBytes / 1024 / 1024).toFixed(1)} MB`;
            return (
              <Animated.View key={code} entering={FadeInDown.delay(gi * 50).duration(220)} style={styles.card}>
                {/* Tinted band. Same construction as the Courses index cards */}
                <View style={styles.band}>
                  <Text style={styles.bandCode}>{code}</Text>
                  <Text style={styles.bandSize}>{courseSize}</Text>
                </View>
                <View style={styles.body}>
                  <Text style={styles.courseTitle} numberOfLines={1}>
                    {sentenceCase(list[0].title)}
                  </Text>
                  <View style={styles.rule} />
                  {[...list]
                    .sort((a, b) => b.year - a.year)
                    .map((p, i) => (
                      <Pressable
                        key={p.id}
                        onPress={() => router.push(`/paper/${p.id}` as never)}
                        style={({ pressed }) => [styles.row, i > 0 && styles.rowDivider, pressed && { opacity: 0.7 }]}>
                        <Text style={styles.year}>{p.year}</Text>
                        <Text style={styles.rowMeta} numberOfLines={1}>
                          {p.questions.length > 0
                            ? `${p.questions.length} question${p.questions.length === 1 ? '' : 's'} · ${p.session}`
                            : p.session}
                        </Text>
                        <Text style={styles.size}>{paperSize(p)}</Text>
                        <Pressable onPress={() => remove(p)} hitSlop={10}>
                          <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
                        </Pressable>
                      </Pressable>
                    ))}
                </View>
              </Animated.View>
            );
          })
        )}
      </ScrollView>

      {/* Undo toast. Removal is never a dead end */}
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
    header: { paddingHorizontal: spacing.gutter, marginBottom: 6 },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    kicker: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 16 },
    title: { fontFamily: fonts.bold, fontSize: 38, color: colors.text, marginTop: 2 },
    meta: { fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary, marginTop: 6 },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderStrong,
      borderRadius: 12,
      paddingHorizontal: 14,
      marginTop: 14,
    },
    searchInput: { flex: 1, paddingVertical: 11, fontFamily: fonts.regular, fontSize: 14.5, color: colors.text },
    empty: { alignItems: 'center', gap: 10, marginTop: 64, paddingHorizontal: 34 },
    emptyBadge: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    emptyTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text, textAlign: 'center' },
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
      paddingHorizontal: 24,
      paddingVertical: 12,
      marginTop: 10,
    },
    emptyBtnText: { fontFamily: fonts.medium, fontSize: 14, color: colors.onAccent },
    // Course group — the same index-card construction as the Courses tab:
    // tinted accent band, hairline card, serene white body.
    card: {
      marginHorizontal: spacing.gutter,
      marginTop: 16,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderStrong,
      backgroundColor: colors.card,
      overflow: 'hidden',
    },
    band: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingVertical: 11,
      backgroundColor: withAlpha(colors.accent, activeScheme() === 'light' ? 0.1 : 0.14),
    },
    bandCode: { fontFamily: fonts.bold, fontSize: 14, letterSpacing: 1, color: colors.accent },
    bandSize: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary, fontVariant: ['tabular-nums'] },
    body: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 4 },
    courseTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
    rule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginTop: 12 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
    rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    year: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.text, fontVariant: ['tabular-nums'] },
    rowMeta: { flex: 1, fontFamily: fonts.regular, fontSize: 12.5, color: colors.textSecondary },
    size: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.textTertiary, fontVariant: ['tabular-nums'] },
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
