/**
 * Session store — mock auth that the real providers plug into.
 *
 * signIn('google' | 'apple' | 'momo' | 'orange') currently just flips
 * local state. Wiring plan:
 *  - google/apple → expo-auth-session / expo-apple-authentication
 *    (or Supabase/Firebase Auth), then exchange for a Revl session.
 *  - momo/orange → phone + OTP via SMS, with wallet-name verification
 *    through the MoMo/OM APIs (see docs/AUTH_MOBILE_MONEY.md).
 * Persist the token in expo-secure-store when real auth lands.
 */
import { useSyncExternalStore } from 'react';

export type AuthMethod = 'google' | 'apple' | 'momo' | 'orange';

type Session = {
  signedIn: boolean;
  method: AuthMethod | null;
  /** Verified mobile-money number when method is momo/orange. */
  phone?: string;
};

let session: Session = { signedIn: false, method: null };
const listeners = new Set<() => void>();

export function signIn(method: AuthMethod, phone?: string) {
  session = { signedIn: true, method, phone };
  listeners.forEach((l) => l());
}

export function signOut() {
  session = { signedIn: false, method: null };
  listeners.forEach((l) => l());
}

export function useSession(): Session {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => session,
    () => session
  );
}
