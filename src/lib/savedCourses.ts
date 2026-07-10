/**
 * Saved courses — a tiny bookmark store (module state + useSyncExternalStore),
 * persisted to AsyncStorage. Powers the bookmark toggle on CourseCard and the
 * "Saved" filter on the Courses page.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

const KEY = 'revl.saved.v1';
let saved: string[] = [];
const listeners = new Set<() => void>();
const emit = () => {
  saved = [...saved];
  listeners.forEach((l) => l());
};

AsyncStorage.getItem(KEY)
  .then((raw) => {
    if (raw) saved = JSON.parse(raw);
    emit();
  })
  .catch(() => {});

export function useSavedCourses(): string[] {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => saved,
    () => saved
  );
}

export function isSaved(code: string): boolean {
  return saved.includes(code);
}

export function toggleSaved(code: string) {
  saved = saved.includes(code) ? saved.filter((c) => c !== code) : [...saved, code];
  AsyncStorage.setItem(KEY, JSON.stringify(saved)).catch(() => {});
  emit();
}
