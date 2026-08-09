/**
 * Google and Apple sign in, against the real provider contracts.
 *
 * Both use the NATIVE flow and hand Supabase an id_token
 * (`signInWithIdToken`), not a browser redirect. That is what makes the sheet
 * appear over the app instead of bouncing out to a web page, and on Apple it
 * is the only route that satisfies review on iOS.
 *
 * The two providers do NOT behave the same, and the differences are load
 * bearing (see docs/AUTH.md):
 *
 *   Google  sends sub, email, name and picture on EVERY sign in.
 *   Apple   sends the name ONLY on the very first authorisation for a given
 *           Apple ID, and never a photo. Miss it there and it is gone for
 *           good, so it is captured at the call site and written straight into
 *           the profile. The email may be a @privaterelay.appleid.com
 *           forwarder, which works but is a poor thing to show back to someone
 *           or to seed a username from.
 *
 * A nonce is generated per attempt, passed to the provider raw and to Supabase
 * hashed. That is what stops a token minted for another app being replayed at
 * ours, so `skip_nonce_check` stays false in config.toml.
 *
 * With no Supabase project attached the functions return null and the caller
 * falls back to the mock identity, so the app keeps working while credentials
 * are being set up.
 */
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { isConfigured, supabase } from './supabase';
import type { ProviderIdentity } from './session';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  google?: { iosClientId?: string; androidClientId?: string; webClientId?: string };
};

export const googleClientIds = {
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? extra.google?.iosClientId,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? extra.google?.androidClientId,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? extra.google?.webClientId,
};

export const googleReady = Boolean(
  isConfigured && (googleClientIds.iosClientId || googleClientIds.androidClientId || googleClientIds.webClientId)
);

/** Apple only offers native sign in on iOS 13 and above. */
export async function appleAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios' || !isConfigured) return false;
  return AppleAuthentication.isAvailableAsync().catch(() => false);
}

async function makeNonce() {
  const raw = Array.from(Crypto.getRandomBytes(16))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
  return { raw, hashed };
}

/**
 * Apple. `fullName` is present only on first authorisation, so the caller must
 * persist whatever comes back immediately rather than expecting to read it from
 * the session later.
 */
export async function signInWithApple(): Promise<ProviderIdentity | null> {
  if (!(await appleAvailable())) return null;
  const { raw, hashed } = await makeNonce();

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashed,
  });
  if (!credential.identityToken) return null;

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: raw,
  });
  if (error || !data.user) throw error ?? new Error('Apple sign in failed');

  const given = credential.fullName?.givenName ?? '';
  const family = credential.fullName?.familyName ?? '';
  const assembled = `${given} ${family}`.trim();
  const email = credential.email ?? data.user.email ?? undefined;

  return {
    provider: 'apple',
    providerUserId: data.user.id,
    email,
    emailIsPrivateRelay: Boolean(email?.endsWith('@privaterelay.appleid.com')),
    // Empty on every sign in after the first. Undefined means "ask", not "blank".
    fullName: assembled || undefined,
    isFirstAppleAuth: Boolean(assembled),
  };
}

/**
 * Google. Returns the hook pair rather than a bare function because
 * expo-auth-session drives the request through a component. `promptAsync`
 * resolves with the id_token, which goes straight to Supabase.
 */
export function useGoogleSignIn() {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(googleClientIds);

  const exchange = async (): Promise<ProviderIdentity | null> => {
    if (!googleReady) return null;
    const result = await promptAsync();
    if (result?.type !== 'success') return null;
    const token = result.params?.id_token;
    if (!token) return null;

    const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'google', token });
    if (error || !data.user) throw error ?? new Error('Google sign in failed');

    const meta = data.user.user_metadata ?? {};
    return {
      provider: 'google',
      providerUserId: data.user.id,
      email: data.user.email ?? undefined,
      emailIsPrivateRelay: false,
      fullName: (meta.full_name as string) ?? (meta.name as string) ?? undefined,
      avatarUrl: (meta.avatar_url as string) ?? (meta.picture as string) ?? undefined,
    };
  };

  return { request, response, exchange, ready: googleReady };
}

/**
 * Mounts the Google hook, and nothing else.
 *
 * The hook throws on sight if the client id for the CURRENT platform is
 * missing, and it checks a different key per platform: web wants webClientId,
 * iOS wants iosClientId. Feeding it placeholders papered over the crash on web
 * and still took the app down on a real iPhone. Hooks cannot be called
 * conditionally, so the only honest fix is a component boundary: this renders
 * nothing and is mounted only when credentials actually exist, so with no
 * project attached the hook never runs at all.
 */
export function GoogleAuthBridge({ bind }: { bind: GoogleExchangeRef }) {
  const { exchange } = useGoogleSignIn();
  // Assigned during render deliberately: it is only ever read from a press
  // handler, and an effect would need `exchange` as a dependency, which is a
  // fresh closure every render.
  bind.current = exchange;
  return null;
}

export type GoogleExchangeRef = {
  current: null | (() => Promise<ProviderIdentity | null>);
};

/** Ends the Supabase session. The local profile is cleared by lib/session. */
export async function signOutRemote() {
  if (!isConfigured) return;
  await supabase.auth.signOut().catch(() => {});
}
