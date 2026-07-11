/**
 * CourseCardMenu — the WhatsApp-style press-and-hold overlay: the rest of
 * the screen blurs away (expo-blur), a preview of the held card pops
 * forward, and a compact action menu appears beneath it — View papers,
 * Download all, Share (React Native's built-in share sheet). Tap anywhere
 * outside to dismiss.
 */
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, ZoomIn } from 'react-native-reanimated';
import { papers } from '../data/papers';
import { downloadCourse, usePaperDownloads } from '../lib/courseDownloads';
import { sentenceCase } from '../lib/format';
import {
  activeScheme,
  colors,
  fonts,
  spacing,
  themedStyleSheet,
  useResolvedScheme,
  useThemeVersion,
  withAlpha,
} from '../theme';

export function CourseCardMenu({
  code,
  title,
  meta,
  onClose,
  onViewPapers,
}: {
  code: string;
  title: string;
  /** e.g. "3 papers · 2021–2023" */
  meta: string;
  onClose: () => void;
  onViewPapers: () => void;
}) {
  useThemeVersion();
  const scheme = useResolvedScheme();
  const router = useRouter();
  const paperStates = usePaperDownloads();
  const coursePapers = papers.filter((p) => p.courseCode === code);
  const doneCount = coursePapers.filter((p) => paperStates[p.id]?.status === 'done').length;
  const inFlight = coursePapers.some((p) => paperStates[p.id]?.status === 'downloading');

  const share = async () => {
    onClose();
    try {
      await Share.share({
        message: `${code} · ${sentenceCase(title)} — past papers with verified answers on Revl. ${meta}.`,
      });
    } catch {}
  };

  const downloadRow =
    doneCount === coursePapers.length && coursePapers.length > 0
      ? { icon: 'arrow-down-circle' as const, label: 'Downloaded — view', tint: colors.accent, onPress: () => { onClose(); router.push('/downloads' as never); } }
      : inFlight
        ? { icon: 'arrow-down-circle-outline' as const, label: 'Downloading…', tint: colors.textSecondary, onPress: () => {} }
        : doneCount > 0
          ? { icon: 'arrow-down-circle-outline' as const, label: `Download remaining (${coursePapers.length - doneCount} of ${coursePapers.length})`, tint: colors.text, onPress: () => downloadCourse(code) }
          : { icon: 'arrow-down-circle-outline' as const, label: 'Download all papers', tint: colors.text, onPress: () => downloadCourse(code) };

  const rows = [
    { icon: 'document-text-outline' as const, label: 'View papers', tint: colors.text, onPress: () => { onClose(); onViewPapers(); } },
    downloadRow,
    { icon: 'share-outline' as const, label: 'Share course', tint: colors.text, onPress: share },
  ];

  return (
    <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(140)} style={styles.overlay}>
      {/* Blur everything behind; a wash keeps it legible on Android/web too */}
      <BlurView
        intensity={scheme === 'light' ? 35 : 30}
        tint={scheme === 'light' ? 'light' : 'dark'}
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: withAlpha(colors.bg, Platform.OS === 'web' ? 0.72 : 0.35) }]} />
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <View style={styles.center} pointerEvents="box-none">
        {/* The held card, popped forward */}
        <Animated.View entering={ZoomIn.springify().damping(18).stiffness(240)} style={styles.preview}>
          <Text style={styles.previewCode}>{code}</Text>
          <Text style={styles.previewTitle} numberOfLines={2}>
            {sentenceCase(title)}
          </Text>
          <View style={styles.previewRule} />
          <Text style={styles.previewMeta}>{meta}</Text>
        </Animated.View>

        {/* Action menu */}
        <Animated.View entering={FadeInDown.delay(60).duration(200)} style={styles.menu}>
          {rows.map((r, i) => (
            <Pressable
              key={r.label}
              onPress={r.onPress}
              style={({ pressed }) => [styles.menuRow, i > 0 && styles.menuDivider, pressed && { opacity: 0.6 }]}>
              <Text style={[styles.menuLabel, { color: r.tint }]}>{r.label}</Text>
              <Ionicons name={r.icon} size={19} color={r.tint} />
            </Pressable>
          ))}
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 80 },
    center: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.gutter + 14 },
    preview: {
      borderRadius: 20,
      padding: 20,
      backgroundColor: withAlpha(colors.accent, activeScheme() === 'light' ? 0.12 : 0.16),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: withAlpha(colors.accent, 0.35),
    },
    previewCode: { fontFamily: fonts.bold, fontSize: 14, letterSpacing: 1, color: colors.accent },
    previewTitle: { fontFamily: fonts.bold, fontSize: 25, lineHeight: 30, color: colors.text, marginTop: 8 },
    previewRule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginTop: 14 },
    previewMeta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 10 },
    menu: {
      marginTop: 12,
      alignSelf: 'stretch',
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderStrong,
      overflow: 'hidden',
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingVertical: 15,
    },
    menuDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    menuLabel: { fontFamily: fonts.medium, fontSize: 15.5 },
  });
const styles = themedStyleSheet(makeStyles);
