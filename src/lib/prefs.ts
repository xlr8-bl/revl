/**
 * App preferences — small persisted booleans (notifications, reduced
 * motion, offline downloads). Same module-store + useSyncExternalStore
 * pattern as the rest of the app, persisted to AsyncStorage so choices
 * survive restarts.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

export type Prefs = {
  notifications: boolean;
  reduceMotion: boolean;
  offlineDownloads: boolean;
};

const KEY = 'revl.prefs.v1';
let prefs: Prefs = { notifications: true, reduceMotion: false, offlineDownloads: true };
const listeners = new Set<() => void>();
const emit = () => {
  prefs = { ...prefs };
  listeners.forEach((l) => l());
};

AsyncStorage.getItem(KEY)
  .then((raw) => {
    if (raw) prefs = { ...prefs, ...JSON.parse(raw) };
    emit();
  })
  .catch(() => {});

export function usePrefs(): Prefs {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => prefs,
    () => prefs
  );
}

export function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
  prefs[key] = value;
  AsyncStorage.setItem(KEY, JSON.stringify(prefs)).catch(() => {});
  emit();
}
