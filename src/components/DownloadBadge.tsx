/**
 * Download affordances — one quiet icon per row (Netflix-style): arrow to
 * download, real progress ring while units complete, filled accent arrow
 * once on the phone. Sizes appear at decision time (the remove dialog and
 * the Downloads page), never inline in rows.
 *
 * - <PaperDownloadBadge paper /> : per-paper row control.
 * - <CourseDownloadButton code /> : course-band collection toggle.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
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
import { colors, useThemeVersion } from '../theme';

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
 * Per-paper: a single quiet icon, Netflix-style — arrow to download, ring
 * while fetching, filled accent arrow once on the phone. No inline size or
 * label (Google's guidance: size appears at DECISION time, in the remove
 * dialog and on the Downloads page). Done-tap opens actions, never deletes
 * directly.
 */
export function PaperDownloadBadge({ paper }: { paper: Paper }) {
  useThemeVersion();
  const router = useRouter();
  const states = usePaperDownloads();
  const dl = states[paper.id] ?? { status: 'idle' as const, progress: 0 };

  const onDone = () => {
    if (Platform.OS === 'web') {
      router.push('/downloads' as never);
      return;
    }
    Alert.alert(`${paper.courseCode} ${paper.year}`, `Downloaded · ${paperSize(paper)} on this phone`, [
      { text: 'Remove download', style: 'destructive', onPress: () => removePaperDownload(paper.id) },
      { text: 'View downloads', onPress: () => router.push('/downloads' as never) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <Pressable
      hitSlop={10}
      onPress={() => (dl.status === 'done' ? onDone() : dl.status === 'idle' && downloadPaper(paper.id))}>
      <DownloadGlyph dl={dl} size={20} />
    </Pressable>
  );
}

/** Course band: the collection toggle — downloads every paper of the course. */
export function CourseDownloadButton({ code }: { code: string }) {
  useThemeVersion();
  const router = useRouter();
  const courses = useDownloads();
  const dl = courses[code] ?? { status: 'idle' as const, progress: 0 };

  const onDone = () => {
    if (Platform.OS === 'web') {
      router.push('/downloads' as never);
      return;
    }
    Alert.alert(code, 'All papers downloaded to this phone', [
      { text: 'Remove downloads', style: 'destructive', onPress: () => removeDownload(code) },
      { text: 'View downloads', onPress: () => router.push('/downloads' as never) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <Pressable
      onPress={() => (dl.status === 'done' ? onDone() : dl.status === 'idle' && downloadCourse(code))}
      hitSlop={10}>
      <DownloadGlyph dl={dl} size={dl.status === 'done' ? 22 : 24} />
    </Pressable>
  );
}
