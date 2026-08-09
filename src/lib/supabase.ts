/**
 * Supabase client.
 *
 * Keys come from `expo.extra.supabase` in app.json, or from EXPO_PUBLIC_ env
 * vars, so a build can be pointed at a different project without a code change.
 * Both are safe to ship: row level security is what protects the data, and
 * every table in the schema has it enabled. The service_role key must never
 * appear in the bundle, since it bypasses RLS entirely.
 *
 * `isConfigured` exists so the app still runs with no project attached. Sign in
 * falls back to the mock identity in that case (see lib/auth), which is what
 * keeps the demo working while real credentials are being set up.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  supabase?: { url?: string; publishableKey?: string };
};

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.supabase?.url ?? '';
export const SUPABASE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? extra.supabase?.publishableKey ?? '';

export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

/**
 * expo-router pre-renders web routes in Node, where there is no window and no
 * AsyncStorage. Touching storage there throws during the render pass and takes
 * the whole bundler down, so persistence is only wired up once there is a real
 * client environment to persist into.
 */
const onDevice = typeof window !== 'undefined';

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_KEY || 'placeholder',
  {
    auth: {
      storage: onDevice ? AsyncStorage : undefined,
      // The session must survive the app being killed, and refresh itself while
      // it is open, or a student is signed out mid revision.
      persistSession: onDevice,
      autoRefreshToken: onDevice,
      // No URL to parse on native; expo-auth-session hands us the token.
      detectSessionInUrl: false,
    },
  }
);
