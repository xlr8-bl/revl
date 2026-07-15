/**
 * First-run intro gate — remembers whether the animated opening sequence
 * has played. Persisted separately from the session so it survives sign-out
 * (you only meet the intro once), and versioned so we can replay it for
 * everyone by bumping the key.
 *
 * Exposes a THREE-state value ('loading' | 'unseen' | 'seen') rather than a
 * bare boolean: the snapshot must change identity when hydration finishes,
 * or useSyncExternalStore won't re-render (false→false is a no-op, which
 * left the welcome screen stuck on a blank placeholder forever).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

const KEY = 'revl.intro.v1';

export type IntroState = 'loading' | 'unseen' | 'seen';

let state: IntroState = 'loading';
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

AsyncStorage.getItem(KEY)
  .then((v) => {
    state = v === '1' ? 'seen' : 'unseen';
    emit();
  })
  .catch(() => {
    state = 'unseen';
    emit();
  });

export function useIntroState(): IntroState {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => state,
    () => state
  );
}

export function markIntroSeen() {
  state = 'seen';
  AsyncStorage.setItem(KEY, '1').catch(() => {});
  emit();
}
