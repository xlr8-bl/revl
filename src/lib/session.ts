/**
 * Session store, persisted to AsyncStorage.
 *
 * UX contract:
 *  - First ever sign-in → profile setup runs once.
 *  - Sign out → back to welcome, but the profile is REMEMBERED.
 *  - Sign back in → straight to the app, no repeated onboarding.
 *  - Profile can be redone from You → (future) "Edit course list".
 *
 * Real providers replace signIn's body; persistence moves to
 * expo-secure-store for tokens when auth is wired.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

export type AuthMethod = 'google' | 'apple' | 'momo' | 'orange';

export type StudentProfile = {
  university: string;
  faculty: string;
  department: string;
  level: string;
};

type Session = {
  /** False until AsyncStorage has been read; gate rendering on this. */
  hydrated: boolean;
  signedIn: boolean;
  method: AuthMethod | null;
  phone?: string;
  profile: StudentProfile | null;
};

const KEY = 'revl.session.v1';

let session: Session = { hydrated: false, signedIn: false, method: null, profile: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function persist() {
  const { hydrated, ...toSave } = session;
  AsyncStorage.setItem(KEY, JSON.stringify(toSave)).catch(() => {});
}

// Hydrate once at module load.
AsyncStorage.getItem(KEY)
  .then((raw) => {
    if (raw) session = { ...session, ...JSON.parse(raw) };
    session = { ...session, hydrated: true };
    emit();
  })
  .catch(() => {
    session = { ...session, hydrated: true };
    emit();
  });

export function signIn(method: AuthMethod, phone?: string) {
  // Profile survives sign-out, so a returning student skips setup.
  session = { ...session, signedIn: true, method, phone };
  persist();
  emit();
}

export function setProfile(profile: StudentProfile) {
  session = { ...session, profile };
  persist();
  emit();
}

export function signOut() {
  session = { ...session, signedIn: false, method: null, phone: undefined };
  persist();
  emit();
}

export function useSession(): Session {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => session,
    () => session
  );
}
