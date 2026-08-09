/**
 * Downloads — papers saved for offline, tracked PER PAPER. Downloading a
 * paper persists its structured JSON and prefetches its diagram images;
 * progress is the fraction of those units completed, so rings reflect real
 * work. A course-level download just runs its papers in sequence, and a
 * course counts as downloaded when every one of its papers is. The done
 * set survives restarts (AsyncStorage).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { Image } from 'react-native';
import { papers } from '../data/papers';
import type { Paper } from '../types';
import { pushNotification } from './notificationsStore';

const KEY = 'revl.downloads.v2';
const LEGACY_KEY = 'revl.downloads.v1'; // course codes from the first version

export type DownloadState = { status: 'idle' | 'downloading' | 'done'; progress: number };
const IDLE: DownloadState = { status: 'idle', progress: 0 };

let paperStates: Record<string, DownloadState> = {};
const listeners = new Set<() => void>();
const emit = () => {
  paperStates = { ...paperStates };
  courseCache = null;
  listeners.forEach((l) => l());
};

// Hydrate: v2 stores paper ids; v1 stored course codes — expand those.
Promise.all([AsyncStorage.getItem(KEY), AsyncStorage.getItem(LEGACY_KEY)])
  .then(([v2, v1]) => {
    const ids = new Set<string>(v2 ? (JSON.parse(v2) as string[]) : []);
    if (v1) {
      for (const code of JSON.parse(v1) as string[])
        papers.filter((p) => p.courseCode === code).forEach((p) => ids.add(p.id));
      AsyncStorage.removeItem(LEGACY_KEY).catch(() => {});
    }
    ids.forEach((id) => (paperStates[id] = { status: 'done', progress: 1 }));
    if (ids.size) persist();
    emit();
  })
  .catch(() => {});

const persist = () => {
  const done = Object.keys(paperStates).filter((id) => paperStates[id].status === 'done');
  AsyncStorage.setItem(KEY, JSON.stringify(done)).catch(() => {});
};

const subscribe = (l: () => void) => (listeners.add(l), () => listeners.delete(l));

/** Per-paper download states, keyed by paper id. */
export function usePaperDownloads(): Record<string, DownloadState> {
  return useSyncExternalStore(subscribe, () => paperStates, () => paperStates);
}

/** Course-level view derived from the papers: done when ALL papers are. */
let courseCache: Record<string, DownloadState> | null = null;
function deriveCourses(): Record<string, DownloadState> {
  if (courseCache) return courseCache;
  const byCourse: Record<string, DownloadState[]> = {};
  for (const p of papers) (byCourse[p.courseCode] ??= []).push(paperStates[p.id] ?? IDLE);
  const out: Record<string, DownloadState> = {};
  for (const [code, list] of Object.entries(byCourse)) {
    const progress = list.reduce((s, d) => s + d.progress, 0) / list.length;
    // Partial-but-not-in-flight is IDLE (tappable to complete the rest) —
    // 'downloading' is reserved for actual in-flight work, otherwise a
    // half-downloaded course would show a frozen ring and block taps.
    const status = list.every((d) => d.status === 'done')
      ? 'done'
      : list.some((d) => d.status === 'downloading')
        ? 'downloading'
        : 'idle';
    out[code] = { status, progress };
  }
  courseCache = out;
  return out;
}
export function useDownloads(): Record<string, DownloadState> {
  return useSyncExternalStore(subscribe, deriveCourses, deriveCourses);
}

/** Approximate on-device size of a paper (its structured JSON). */
export function paperSize(p: Paper): string {
  const bytes = JSON.stringify(p).length;
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Download one paper: persist its JSON + prefetch its diagram images. */
export async function downloadPaper(id: string) {
  if (paperStates[id]?.status === 'downloading' || paperStates[id]?.status === 'done') return;
  const p = papers.find((pp) => pp.id === id);
  if (!p) return;
  const units: (() => Promise<void>)[] = [
    async () => {
      await AsyncStorage.setItem(`revl.offline.paper.${p.id}`, JSON.stringify(p));
    },
  ];
  const allDiagrams = p.questions.flatMap((q) => [
    ...(q.diagrams ?? []),
    ...(q.subQuestions ?? []).flatMap((s) => s.diagrams ?? []),
  ]);
  for (const d of allDiagrams) {
    if (d.imageUrl?.startsWith('http')) {
      units.push(async () => {
        await Image.prefetch(d.imageUrl).catch(() => {});
      });
    }
  }

  paperStates[id] = { status: 'downloading', progress: 0 };
  emit();
  for (let i = 0; i < units.length; i++) {
    try {
      await units[i]();
    } catch {}
    paperStates[id] = { status: 'downloading', progress: (i + 1) / units.length };
    emit();
    // Brief beat between units so the ring is readable even on tiny papers.
    await new Promise((r) => setTimeout(r, 110));
  }
  paperStates[id] = { status: 'done', progress: 1 };
  persist();
  emit();
  pushNotification(
    {
      kind: 'download',
      lead: `${p.courseCode} ${p.year}`,
      body: 'saved to your phone. It opens offline now.',
    },
    `download:${p.id}`
  );
}

/** Download every paper of a course, in sequence. */
export async function downloadCourse(code: string) {
  for (const p of papers.filter((pp) => pp.courseCode === code)) await downloadPaper(p.id);
}

export function removePaperDownload(id: string) {
  AsyncStorage.removeItem(`revl.offline.paper.${id}`).catch(() => {});
  delete paperStates[id];
  persist();
  emit();
}

export function removeDownload(code: string) {
  papers.filter((p) => p.courseCode === code).forEach((p) => removePaperDownload(p.id));
}
