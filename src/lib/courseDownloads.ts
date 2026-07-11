/**
 * Course downloads — keeps a course's papers available offline. A download
 * persists each paper's structured JSON and prefetches its diagram images
 * into the image cache; progress is the fraction of those units completed,
 * so the ring around the download button reflects real work, not a fake
 * spinner. The downloaded set survives restarts (AsyncStorage).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { Image } from 'react-native';
import { papers } from '../data/papers';

const KEY = 'revl.downloads.v1';

export type DownloadState = { status: 'idle' | 'downloading' | 'done'; progress: number };

let states: Record<string, DownloadState> = {};
const listeners = new Set<() => void>();
const emit = () => {
  states = { ...states };
  listeners.forEach((l) => l());
};

AsyncStorage.getItem(KEY)
  .then((raw) => {
    if (!raw) return;
    for (const code of JSON.parse(raw) as string[]) states[code] = { status: 'done', progress: 1 };
    emit();
  })
  .catch(() => {});

const persistDoneSet = () => {
  const done = Object.keys(states).filter((c) => states[c].status === 'done');
  AsyncStorage.setItem(KEY, JSON.stringify(done)).catch(() => {});
};

export function useDownloads(): Record<string, DownloadState> {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => states,
    () => states
  );
}

/** Download a course's papers for offline: persist JSON + prefetch diagrams. */
export async function downloadCourse(code: string) {
  if (states[code]?.status === 'downloading') return;
  const coursePapers = papers.filter((p) => p.courseCode === code);
  // One unit per paper (its JSON) + one per diagram image.
  const units: (() => Promise<void>)[] = [];
  for (const p of coursePapers) {
    units.push(async () => {
      await AsyncStorage.setItem(`revl.offline.paper.${p.id}`, JSON.stringify(p));
    });
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
  }

  states[code] = { status: 'downloading', progress: 0 };
  emit();
  for (let i = 0; i < units.length; i++) {
    try {
      await units[i]();
    } catch {}
    states[code] = { status: 'downloading', progress: (i + 1) / units.length };
    emit();
    // Brief beat between units so the ring is readable even on tiny courses.
    await new Promise((r) => setTimeout(r, 90));
  }
  states[code] = { status: 'done', progress: 1 };
  persistDoneSet();
  emit();
}

/** Remove a downloaded course (clears its offline paper copies). */
export function removeDownload(code: string) {
  const ids = papers.filter((p) => p.courseCode === code).map((p) => `revl.offline.paper.${p.id}`);
  AsyncStorage.multiRemove(ids).catch(() => {});
  delete states[code];
  persistDoneSet();
  emit();
}
