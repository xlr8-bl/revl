/**
 * Session store — mock auth + student profile.
 *
 * signIn flips local state; real providers plug in later:
 *  - google/apple via expo-auth-session / expo-apple-authentication
 *  - momo/orange via the provider PIN-prompt flow
 *    (see docs/AUTH_MOBILE_MONEY.md)
 *
 * The profile (university, faculty, department, level) is collected at
 * onboarding and scopes the course catalogue to what the student
 * actually studies.
 */
import { useSyncExternalStore } from 'react';

export type AuthMethod = 'google' | 'apple' | 'momo' | 'orange';

export type StudentProfile = {
  university: string;
  faculty: string;
  department: string;
  level: string;
};

type Session = {
  signedIn: boolean;
  method: AuthMethod | null;
  phone?: string;
  profile: StudentProfile | null;
};

let session: Session = { signedIn: false, method: null, profile: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function signIn(method: AuthMethod, phone?: string) {
  session = { ...session, signedIn: true, method, phone };
  emit();
}

export function setProfile(profile: StudentProfile) {
  session = { ...session, profile };
  emit();
}

export function signOut() {
  session = { signedIn: false, method: null, profile: null };
  emit();
}

export function useSession(): Session {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => session,
    () => session
  );
}
