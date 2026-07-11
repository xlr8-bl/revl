/**
 * Quiet connectivity checker — Spotify-style online/offline awareness
 * without burning data. Pings a zero-byte endpoint (Google's generate_204,
 * ~200 bytes of headers per check) on app start, whenever the app returns
 * to the foreground, and every 45s while active. Never checks in the
 * background. Failure or timeout flips the app to offline; the next good
 * check flips it back.
 */
import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

const PING_URL = 'https://clients3.google.com/generate_204';
const INTERVAL_MS = 45_000;
const TIMEOUT_MS = 6_000;

/** null = not yet determined (don't flash a banner on cold start). */
let online: boolean | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

let timer: ReturnType<typeof setInterval> | null = null;
let checking = false;

async function check() {
  if (checking) return;
  checking = true;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(PING_URL, { method: 'GET', signal: controller.signal, cache: 'no-store' as never });
    clearTimeout(t);
    setOnline(res.status === 204 || res.ok);
  } catch {
    setOnline(false);
  } finally {
    checking = false;
  }
}

function setOnline(next: boolean) {
  if (online === next) return;
  online = next;
  emit();
}

function start() {
  if (timer) return;
  check();
  timer = setInterval(check, INTERVAL_MS);
}
function stop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

// Foreground-only: pause the loop in the background, re-check on return.
AppState.addEventListener('change', (state) => {
  if (state === 'active') start();
  else stop();
});
start();

/**
 * Banner suppression — USSD prompts (MoMo sign-in / payment approval) cut
 * mobile data for a few seconds, which would flash a false "You're
 * offline". Screens that trigger USSD hold the banner down while waiting.
 */
let suppressCount = 0;
export function suppressOfflineBanner(on: boolean) {
  suppressCount = Math.max(0, suppressCount + (on ? 1 : -1));
  emit();
}
export function useBannerSuppressed(): boolean {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => suppressCount > 0,
    () => suppressCount > 0
  );
}

/** Current connectivity — null until the first check completes. */
export function useOnline(): boolean | null {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => online,
    () => online
  );
}

/** Non-hook read for imperative code paths. */
export function isOnline(): boolean | null {
  return online;
}
