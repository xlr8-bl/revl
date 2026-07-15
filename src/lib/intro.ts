/**
 * First-run intro gate — remembers whether the animated opening sequence
 * has played. Persisted separately from the session so it survives sign-out
 * (you only meet the intro once), and versioned so we can replay it for
 * everyone by bumping the key.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

const KEY = 'revl.intro.v1';

let seen = false;
let hydrated = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

AsyncStorage.getItem(KEY)
  .then((v) => {
    seen = v === '1';
    hydrated = true;
    emit();
  })
  .catch(() => {
    hydrated = true;
    emit();
  });

export function useIntroSeen(): boolean {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => seen,
    () => seen
  );
}

export function introHydrated(): boolean {
  return hydrated;
}

export function markIntroSeen() {
  seen = true;
  AsyncStorage.setItem(KEY, '1').catch(() => {});
  emit();
}
