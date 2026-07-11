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
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import {
  downloadCourse,
  downloadPaper,
  paperSize,
  removeDownload,
  removePaperDownload,
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
  // paper moves idle → downloading → done.
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {dl.status === 'done' ? (
        <Ionicons name="checkmark-circle" size={size} color={colors.accent} />
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

/** Per-paper: file size + download state, tap to fetch (or remove when done). */
export function PaperDownloadBadge({ paper }: { paper: Paper }) {
  useThemeVersion();
  const states = usePaperDownloads();
  const dl = states[paper.id] ?? { status: 'idle' as const, progress: 0 };
  return (
    <Pressable
      hitSlop={8}
      onPress={() => (dl.status === 'done' ? removePaperDownload(paper.id) : dl.status === 'idle' && downloadPaper(paper.id))}
      style={styles.badge}>
      <Text style={styles.size}>{paperSize(paper)}</Text>
      <DownloadGlyph dl={dl} size={20} />
    </Pressable>
  );
}

/** Course band: downloads every paper of the course. */
export function CourseDownloadButton({ code }: { code: string }) {
  useThemeVersion();
  const courses = useDownloads();
  const dl = courses[code] ?? { status: 'idle' as const, progress: 0 };
  if (dl.status === 'done') {
    return (
      <Pressable onPress={() => removeDownload(code)} hitSlop={10}>
        <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
      </Pressable>
    );
  }
  return (
    <Pressable onPress={() => dl.status === 'idle' && downloadCourse(code)} hitSlop={10}>
      <DownloadGlyph dl={dl} size={24} />
    </Pressable>
  );
}

const makeStyles = () => StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  // Fixed-width, right-aligned size label so the download icons form a
  // perfectly straight column across rows ("7 KB" vs "142 KB").
  size: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
    width: 44,
    textAlign: 'right',
  },
});
const styles = themedStyleSheet(makeStyles);
