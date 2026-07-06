/**
 * Revl design system — extracted from the reference screenshots.
 *
 * The whole look is: pure black, very dark grey cards with big radii,
 * white/grey type set in SF Pro, a serif ONLY for hero display text,
 * and one restrained accent (electric indigo) used for the active-tab
 * underline and tiny highlights. Nothing else gets color except the
 * faculty tiles.
 */
import { Platform } from 'react-native';

export const colors = {
  /** Pure black app background (reference is #000, not near-black). */
  bg: '#000000',
  /** Card surface — the very dark grey of the reference cards. */
  card: '#1C1C1E',
  /** Slightly lighter surface for chips / nested surfaces on cards. */
  surface: '#2C2C2E',
  /** Hairline separators. */
  border: '#2A2A2C',

  text: '#FFFFFF',
  /** Medium grey for labels, meta rows, secondary copy. */
  textSecondary: '#8E8E93',
  /** Dimmer grey for tertiary hints. */
  textTertiary: '#636366',

  /** Revl accent — cool electric indigo. Active tab underline + small highlights only. */
  accent: '#5E6BFF',
  accentSoft: 'rgba(94, 107, 255, 0.16)',

  /** Notification badge red (matches the reference bell badge). */
  badge: '#FF3B30',

  /** Semantic bits used sparingly in the reader. */
  success: '#30D158',
  warning: '#FFD60A',
  danger: '#FF453A',

  /** Verified-answer badge green + AI tag grey. */
  verified: '#30D158',

  /** Floating tab bar translucency (sits on top of a BlurView). */
  tabBarTint: 'rgba(28, 28, 30, 0.72)',
  tabActivePill: 'rgba(118, 118, 128, 0.28)',

  /** Mobile-money brand colors (unlock flow). */
  mtn: '#FFCC08',
  orange: '#FF7900',
} as const;

/**
 * SF Pro Display is loaded from the bundled OTFs (see app/_layout.tsx).
 * The uploaded set has Regular / Medium / Bold uprights, so "semibold"
 * roles map to Medium or Bold, matching how tight the reference type is.
 */
export const fonts = {
  regular: 'SFProDisplay-Regular',
  medium: 'SFProDisplay-Medium',
  bold: 'SFProDisplay-Bold',
  /** Serif for hero display text only — New York on iOS, a serif elsewhere. */
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' })!,
} as const;

/** Reference-derived type scale. */
export const type = {
  /** Big screen titles ("Courses") */
  display: { fontFamily: fonts.bold, fontSize: 34, lineHeight: 40, color: colors.text },
  /** Section headers ("More for you") */
  h1: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 32, color: colors.text },
  /** Card titles ("The Eternal Rock") */
  cardTitle: { fontFamily: fonts.bold, fontSize: 19, lineHeight: 24, color: colors.text },
  /** Small grey label above card titles ("Guided Scripture") */
  label: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 18, color: colors.textSecondary },
  /** Body copy */
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.text },
  /** Meta rows (durations, counts) */
  meta: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 16, color: colors.textSecondary },
  /** Hero serif display (Question of the Day) */
  hero: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 40, color: colors.text },
} as const;

export const spacing = {
  /** Screen horizontal gutter (reference uses a generous ~16–20px). */
  gutter: 16,
  /** Card internal padding. */
  cardPad: 20,
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  /** Cards. The reference sits around 20–24. */
  card: 22,
  /** Thumbnails inside cards. */
  thumb: 14,
  /** Pills / chips are fully rounded. */
  pill: 999,
  tile: 14,
} as const;

/** Height reserved so scroll content clears the floating tab bar. */
export const TAB_BAR_CLEARANCE = 108;
