/**
 * Session store, persisted to AsyncStorage.
 *
 * UX contract:
 *  - First ever sign-in → the onboarding wizard runs once
 *    (identity → school → placement → courses → personalize).
 *  - Sign out → welcome, but the profile is REMEMBERED.
 *  - Sign back in → straight to the app (Courses tab).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import type { SchoolId } from '../data/catalog/types';

export type AuthMethod = 'google' | 'apple' | 'momo' | 'orange';

export type StudentProfile = {
  name: string;
  username: string; // @handle, lowercase
  avatarColor: string;
  school: SchoolId;
  facultyId: string;
  facultyName: string;
  departmentId: string;
  departmentName: string;
  level: string;
  enrolledCourseCodes: string[];
  /** ISO date of the next exam sitting — drives the home countdown. */
  examDate: string;
  studyTime: 'morning' | 'evening' | 'night';
};

type Session = {
  hydrated: boolean;
  signedIn: boolean;
  method: AuthMethod | null;
  phone?: string;
  profile: StudentProfile | null;
};

const KEY = 'revl.session.v2';

let session: Session = { hydrated: false, signedIn: false, method: null, profile: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function persist() {
  const { hydrated, ...toSave } = session;
  AsyncStorage.setItem(KEY, JSON.stringify(toSave)).catch(() => {});
}

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
  session = { ...session, signedIn: true, method, phone };
  persist();
  emit();
}

export function setProfile(profile: StudentProfile) {
  session = { ...session, profile };
  persist();
  emit();
}

/** Patch the current profile (edit-profile / manage-courses screens). */
export function updateProfile(patch: Partial<StudentProfile>) {
  if (!session.profile) return;
  session = { ...session, profile: { ...session.profile, ...patch } };
  persist();
  emit();
}

/** Link or update the Mobile Money number used to unlock papers. */
export function linkMobileMoney(phone: string) {
  session = { ...session, phone };
  persist();
  emit();
}

export function signOut() {
  // Profile survives sign-out so returning students skip onboarding.
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

/** Mocked username availability — a reserved list until the backend exists. */
const TAKEN = new Set(['revl', 'admin', 'ashley', 'test', 'support']);
export function isUsernameAvailable(u: string): boolean {
  return u.length >= 3 && !TAKEN.has(u.toLowerCase());
}

export const AVATAR_COLORS = ['#F2A93B', '#9D97F5', '#4ADE80', '#7EA8FF', '#FF8FA3', '#5EEAD4'];
