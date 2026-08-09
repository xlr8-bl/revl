/**
 * Revl design system — "night study" identity, now with a true light
 * theme.
 *
 * How runtime theming works here without rewriting every StyleSheet:
 *   - `colors` is a Proxy over the *active* palette, so every
 *     `colors.x` reference (inline or inside a style factory) reads the
 *     current theme live.
 *   - `themedStyleSheet(() => StyleSheet.create({...}))` returns a Proxy
 *     that rebuilds its styles whenever the theme version changes.
 *   - A screen calls `useThemeVersion()` once so it re-renders on a
 *     theme switch; its whole subtree re-reads the live palette.
 *
 * Direction: cinematic near-black dark, warm amber accent, violet for AI
 * only, green for verified only. The light theme is the same system on
 * warm exam-paper white with dark ink.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { Appearance, Platform, StyleSheet } from 'react-native';

export type Palette = {
  bg: string;
  bgDeep: string;
  card: string;
  surface: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  ai: string;
  aiSoft: string;
  verified: string;
  verifiedSoft: string;
  success: string;
  warning: string;
  danger: string;
  badge: string;
  dockTint: string;
  mtn: string;
  orange: string;
  /** Atmosphere — the warm light rising behind a page (GlowHorizon). */
  glow: string;
  /** The lit edge of that light. Near-invisible in light, crisp in dark. */
  glowRim: string;
};

/** Dark — the original "night study" palette. */
const darkColors: Palette = {
  bg: '#060608',
  bgDeep: '#020203',
  card: '#111114',
  surface: '#1D1D23',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  text: '#F5F4F0',
  textSecondary: '#98979E',
  textTertiary: '#5D5C64',
  accent: '#F5933C',
  accentSoft: 'rgba(245,147,60,0.14)',
  onAccent: '#1C1204',
  ai: '#9D97F5',
  aiSoft: 'rgba(157,151,245,0.14)',
  verified: '#4ADE80',
  verifiedSoft: 'rgba(74,222,128,0.12)',
  success: '#4ADE80',
  warning: '#F5933C',
  danger: '#F87171',
  badge: '#F87171',
  dockTint: 'rgba(8,8,11,0.97)',
  mtn: '#FFCC08',
  orange: '#FF7900',
  glow: '#F5852A',
  glowRim: 'rgba(255,176,98,0.92)',
};

/**
 * Light — warm cream paper with a single vivid-orange accent (the
 * monochrome-orange identity): white cards sit on an airy off-white page
 * separated by hairlines, ink stays near-black, and the accent is a
 * bright, warm orange rather than deep burnt amber.
 */
const lightColors: Palette = {
  bg: '#F7F5F1',
  bgDeep: '#E9E5DC',
  card: '#FFFFFF',
  surface: '#ECE7DD',
  border: 'rgba(0,0,0,0.12)',
  borderStrong: 'rgba(0,0,0,0.19)',
  text: '#191510',
  textSecondary: '#585349',
  textTertiary: '#8B8578',
  accent: '#E0700C',
  accentSoft: 'rgba(224,112,12,0.12)',
  onAccent: '#FFFFFF',
  ai: '#544AC0',
  aiSoft: 'rgba(84,74,192,0.12)',
  verified: '#1B8A47',
  verifiedSoft: 'rgba(27,138,71,0.12)',
  success: '#1B8A47',
  warning: '#E0700C',
  danger: '#C0352B',
  badge: '#C0352B',
  dockTint: 'rgba(255,255,255,0.97)',
  mtn: '#FFCC08',
  orange: '#FF7900',
  // A pale wash of orange over cream reads as a stain, not as light. The page
  // is pulled a shade off the yellow so warm light has something to be warm
  // AGAINST, and the glow itself is saturated and tighter so it stays a
  // deliberate sunrise rather than a smudge.
  glow: '#FF8A2B',
  glowRim: 'rgba(226,124,36,0.3)',
};

/* ------------------------------------------------------------------ */
/* Theme store — module state + useSyncExternalStore                   */
/* ------------------------------------------------------------------ */

/** Raw palettes, for previews (theme-picker swatches). */
export const palettes = { light: lightColors, dark: darkColors };

export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_KEY = 'revl.theme.v1';
let mode: ThemeMode = 'system';
let systemScheme: 'light' | 'dark' = Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
let active: Palette = darkColors;
let version = 0;
const listeners = new Set<() => void>();

function resolve() {
  const scheme = mode === 'system' ? systemScheme : mode;
  active = scheme === 'light' ? lightColors : darkColors;
  version += 1;
  listeners.forEach((l) => l());
}
resolve(); // set the initial active palette from the system scheme

Appearance.addChangeListener(({ colorScheme }) => {
  // While we're forcing a scheme natively (mode !== 'system'), the change
  // events echo our own override — don't let that pollute the remembered
  // TRUE system scheme.
  if (mode !== 'system') return;
  systemScheme = colorScheme === 'light' ? 'light' : 'dark';
  resolve();
});

/**
 * Keep the NATIVE side (system tab bar, liquid glass, alerts) on the same
 * scheme as the in-app theme — otherwise forcing dark in-app leaves native
 * containers light, which flashes white during tab transitions.
 */
function syncNativeAppearance() {
  try {
    Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
  } catch {}
}

// Hydrate the saved preference.
AsyncStorage.getItem(THEME_KEY)
  .then((v) => {
    if (v === 'light' || v === 'dark' || v === 'system') {
      mode = v;
      syncNativeAppearance();
      resolve();
    }
  })
  .catch(() => {});

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function setThemeMode(next: ThemeMode) {
  mode = next;
  AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
  syncNativeAppearance();
  resolve();
}

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribe, () => mode, () => mode);
}

/** Subscribe a component to theme changes so it re-renders on a switch. */
export function useThemeVersion(): number {
  return useSyncExternalStore(subscribe, () => version, () => version);
}

/** The resolved scheme right now (for the navigation ThemeProvider). */
export function useResolvedScheme(): 'light' | 'dark' {
  useThemeVersion();
  return active === lightColors ? 'light' : 'dark';
}

/** Non-hook read of the current scheme (for pure helpers like course tints). */
export function activeScheme(): 'light' | 'dark' {
  return active === lightColors ? 'light' : 'dark';
}

/* ------------------------------------------------------------------ */
/* Live palette + reactive stylesheets                                 */
/* ------------------------------------------------------------------ */

/**
 * Composite `fg` over `bg` at the given alpha and return a SOLID hex.
 * Use instead of withAlpha when the surface must be opaque — e.g. cards
 * that iOS lifts for a context menu (a translucent card lets whatever sits
 * behind it show through the lifted preview).
 */
export function mixColor(fg: string, bg: string, alpha: number): string {
  const p = (hex: string, i: number) => parseInt(hex.replace('#', '').slice(i * 2, i * 2 + 2), 16);
  const mix = (i: number) => Math.round(p(fg, i) * alpha + p(bg, i) * (1 - alpha));
  return `#${[0, 1, 2].map((i) => mix(i).toString(16).padStart(2, '0')).join('')}`;
}

/** Convert a #RRGGBB color to rgba() with the given alpha. */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Live palette: every read reflects the current theme. */
export const colors = new Proxy({} as Palette, {
  get: (_t, key: string) => (active as Record<string, string>)[key],
  has: (_t, key: string) => key in active,
  ownKeys: () => Reflect.ownKeys(active),
  getOwnPropertyDescriptor: (_t, key: string) => Object.getOwnPropertyDescriptor(active, key),
}) as Palette;

type NamedStyles = Record<string, unknown>;

/**
 * A StyleSheet that rebuilds when the theme changes. Pass a factory that
 * calls StyleSheet.create; the returned object reads styles lazily and
 * recomputes on a new theme version.
 */
export function themedStyleSheet<T extends NamedStyles>(factory: () => T): T {
  let cached: T | null = null;
  let cachedVersion = -1;
  const ensure = () => {
    if (cachedVersion !== version) {
      cached = factory();
      cachedVersion = version;
    }
    return cached as T;
  };
  return new Proxy({} as T, {
    get: (_t, key: string) => (ensure() as Record<string, unknown>)[key],
    has: (_t, key: string) => key in (ensure() as object),
    ownKeys: () => Reflect.ownKeys(ensure() as object),
    getOwnPropertyDescriptor: (_t, key: string) =>
      Object.getOwnPropertyDescriptor(ensure() as object, key),
  }) as T;
}

/* ------------------------------------------------------------------ */
/* Static tokens (no theme-dependent color baked in)                   */
/* ------------------------------------------------------------------ */

export const fonts = {
  regular: 'SFProDisplay-Regular',
  medium: 'SFProDisplay-Medium',
  bold: 'SFProDisplay-Bold',
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' })!,
} as const;

/**
 * Type ramp — color is intentionally omitted so these are theme-safe;
 * consumers set color (usually via the live `colors`).
 */
export const type = {
  display: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 38 },
  h1: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 23 },
  kicker: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
  },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  meta: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 17 },
  question: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 36 },
} as const;

export const spacing = {
  gutter: 18,
  cardPad: 18,
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  card: 18,
  thumb: 12,
  pill: 999,
  tile: 14,
} as const;

/**
 * Height reserved so scroll content clears the floating dock. The dock's
 * real footprint is up to ~98px (34px home-indicator inset + ~64px bar), so
 * anything under 100 leaves the last row cut off behind the glass; 130 gives
 * the final card clear air below it.
 */
export const TAB_BAR_CLEARANCE = 130;
