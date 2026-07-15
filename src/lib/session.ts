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

/**
 * What a social provider hands us at sign-in — modelled on exactly what
 * Supabase's `signInWithIdToken` surfaces so wiring the backend later is a
 * drop-in (see docs/AUTH.md). Google gives name + email + photo every time;
 * Apple gives the name ONLY on the first authorization and never a photo.
 */
export type ProviderIdentity = {
  provider: AuthMethod;
  /** Stable id — becomes Supabase `auth.users.id` (the provider `sub`). */
  providerUserId: string;
  email?: string;
  /** Apple "Hide My Email" relay address (@privaterelay.appleid.com). */
  emailIsPrivateRelay?: boolean;
  /** Google: always present. Apple: present ONLY on first auth, else undefined. */
  fullName?: string;
  /** Google `picture` URL. Apple never provides one. */
  avatarUrl?: string;
  isFirstAppleAuth?: boolean;
};

export type StudentProfile = {
  name: string;
  username: string; // @handle, lowercase
  avatarColor: string;
  /** Uploaded / provider profile photo. Absent → Avatar shows the default. */
  avatarUri?: string;
  school: SchoolId;
  facultyId: string;
  facultyName: string;
  departmentId: string;
  departmentName: string;
  level: string;
  /** Academic year this level was set, e.g. "2026/2027" — drives progression. */
  academicYear: string;
  enrolledCourseCodes: string[];
  /** Courses being retaken from a past semester/level (subset of enrolled). */
  carryoverCourseCodes?: string[];
  /** ISO date of the next exam sitting — DERIVED (lib/academic), auto-refreshed. */
  examDate: string;
  /** How they signed in, and the email we hold (from Google/Apple). */
  authProvider?: AuthMethod;
  email?: string;
  emailIsPrivateRelay?: boolean;
  /** Optional recovery contacts for Mobile Money accounts (no email/phone
   * from the wallet otherwise). Lets a lost account be recovered. */
  recoveryPhone?: string;
  recoveryEmail?: string;
};

type Session = {
  hydrated: boolean;
  signedIn: boolean;
  method: AuthMethod | null;
  phone?: string;
  /** The provider identity for this sign-in (google/apple); momo has none. */
  identity?: ProviderIdentity;
  profile: StudentProfile | null;
};

/**
 * Mock provider identity — mirrors the shape Supabase will return so the
 * onboarding prefill logic is written against the real contract. When
 * Supabase lands, replace this with the `user` + `user_metadata` mapping in
 * docs/AUTH.md; nothing downstream changes.
 */
function mockIdentity(method: AuthMethod): ProviderIdentity | undefined {
  if (method === 'google')
    return {
      provider: 'google',
      providerUserId: 'g_1029384756',
      email: 'ashley.mbah@gmail.com',
      emailIsPrivateRelay: false,
      fullName: 'Ashley Mbah',
      // Google returns a `picture` URL here; left undefined in the mock so
      // the demo shows the bundled default rather than a network image.
      avatarUrl: undefined,
    };
  if (method === 'apple')
    return {
      provider: 'apple',
      providerUserId: 'a_000462.7f3c',
      email: 'ashley@privaterelay.appleid.com',
      emailIsPrivateRelay: true,
      fullName: 'Ashley Mbah', // present ONLY because this models FIRST auth
      isFirstAppleAuth: true,
    };
  return undefined; // momo / orange carry no identity → onboarding asks
}

// Bumped v3 → v4: profile shape changed (academicYear, derived examDate,
// provider identity) — reset every install so the rebuilt onboarding runs.
const KEY = 'revl.session.v4';

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
  session = { ...session, signedIn: true, method, phone, identity: mockIdentity(method) };
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
  session = { ...session, signedIn: false, method: null, phone: undefined, identity: undefined };
  persist();
  emit();
}

/**
 * Delete the account — wipes the profile and all identity, returning the
 * app to the welcome screen. On the local build this clears the persisted
 * session entirely (the server call goes here in the backend phase).
 */
export function deleteAccount() {
  AsyncStorage.removeItem(KEY).catch(() => {});
  session = { hydrated: true, signedIn: false, method: null, phone: undefined, identity: undefined, profile: null };
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
