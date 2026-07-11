/**
 * Download affordances — the familiar arrow-into-circle download icon, a
 * real progress ring while units complete, and a filled check once the
 * content is on the phone.
 *
 * - <PaperDownloadBadge paper /> : per-paper row control with the file size
 *   printed next to the icon ("48 KB ⬇").
 * - <CourseDownloadButton code /> : course-band control that downloads every
 *   paper of the course.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import {
  downloadCourse,
  downloadPaper,
  paperSize,
  useDownloads,
  usePaperDownloads,
  type DownloadState,
} from '../lib/courseDownloads';
import type { Paper } from '../types';
import { colors, fonts, themedStyleSheet, useThemeVersion } from '../theme';

function Ring({ progress, size }: { progress: number; size: number }) {
  const r = size / 2 - 2;
  const c = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.border} strokeWidth={2} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={colors.accent}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${c}`}
        strokeDashoffset={c * (1 - progress)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

function DownloadGlyph({ dl, size }: { dl: DownloadState; size: number }) {
  // One fixed box for every state so the icon column never shifts as a
  // paper moves idle → downloading → done. Done = the filled "on device"
  // arrow, NOT a checkmark (checks mean success, not storage).
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {dl.status === 'done' ? (
        <Ionicons name="arrow-down-circle" size={size} color={colors.accent} />
      ) : dl.status === 'downloading' ? (
        <>
          <Ring progress={dl.progress} size={size} />
          <Ionicons name="arrow-down" size={size * 0.5} color={colors.accent} />
        </>
      ) : (
        <Ionicons name="arrow-down-circle-outline" size={size} color={colors.textSecondary} />
      )}
    </View>
  );
}

/**
 * Per-paper: the label says exactly where the paper stands — its size when
 * not downloaded, live percent while fetching, "Downloaded" once stored.
 * Taps are never destructive: idle downloads; done opens the Downloads
 * page, where removal lives (with Undo).
 */
export function PaperDownloadBadge({ paper }: { paper: Paper }) {
  useThemeVersion();
  const router = useRouter();
  const states = usePaperDownloads();
  const dl = states[paper.id] ?? { status: 'idle' as const, progress: 0 };
  const label =
    dl.status === 'done' ? 'Downloaded' : dl.status === 'downloading' ? `${Math.round(dl.progress * 100)}%` : paperSize(paper);
  return (
    <Pressable
      hitSlop={8}
      onPress={() =>
        dl.status === 'done' ? router.push('/downloads' as never) : dl.status === 'idle' && downloadPaper(paper.id)
      }
      style={styles.badge}>
      <Text style={[styles.size, dl.status === 'done' && { color: colors.accent }]}>{label}</Text>
      <DownloadGlyph dl={dl} size={20} />
    </Pressable>
  );
}

/** Course band: downloads every paper of the course; done opens Downloads. */
export function CourseDownloadButton({ code }: { code: string }) {
  useThemeVersion();
  const router = useRouter();
  const courses = useDownloads();
  const dl = courses[code] ?? { status: 'idle' as const, progress: 0 };
  return (
    <Pressable
      onPress={() =>
        dl.status === 'done' ? router.push('/downloads' as never) : dl.status === 'idle' && downloadCourse(code)
      }
      hitSlop={10}>
      <DownloadGlyph dl={dl} size={dl.status === 'done' ? 22 : 24} />
    </Pressable>
  );
}

const makeStyles = () => StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  // Fixed-width, right-aligned label so the download icons form a perfectly
  // straight column across rows ("7 KB" / "63%" / "Downloaded").
  size: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
    width: 68,
    textAlign: 'right',
  },
});
const styles = themedStyleSheet(makeStyles);
