/**
 * Course access counts — how often you open each course's papers, persisted
 * to AsyncStorage. Drives the featured carousel so your most-used courses
 * float to the front and are one tap away when you open the app.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

const KEY = 'revl.access.v1';
let counts: Record<string, number> = {};
const listeners = new Set<() => void>();
const emit = () => {
  counts = { ...counts };
  listeners.forEach((l) => l());
};

AsyncStorage.getItem(KEY)
  .then((raw) => {
    if (raw) counts = JSON.parse(raw);
    emit();
  })
  .catch(() => {});

export function useAccessCounts(): Record<string, number> {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => counts,
    () => counts
  );
}

/** Log that a course was opened (call when a paper is opened/unlocked). */
export function recordAccess(code: string) {
  counts[code] = (counts[code] ?? 0) + 1;
  AsyncStorage.setItem(KEY, JSON.stringify(counts)).catch(() => {});
  emit();
}
