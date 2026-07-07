/**
 * Revl design system — "night study" identity.
 *
 * Direction (built with the ui-ux-pro-max design-intelligence skill,
 * cinematic-dark style + dark/warm-accent palette):
 *
 * - Cinematic near-black, not flat pure black: a whisper of blue keeps
 *   depth on OLED without looking like every other dark app.
 * - Ink cards: dark surfaces defined by HAIRLINE BORDERS, not floating
 *   grey blobs — the exam-paper artifact look.
 * - One warm accent: AMBER (highlighter on paper, brass desk lamp).
 *   Used for primary actions, active nav, and marks.
 * - VIOLET is reserved exclusively for AI moments (briefing, explain),
 *   GREEN exclusively for verified/success. Color = meaning.
 * - Serif appears only in one place: the question text itself — the
 *   "voice of the paper". Everything else is SF Pro.
 */
import { Platform } from 'react-native';

export const colors = {
  /** App background — near-black with a cool cast (cinematic dark). */
  bg: '#060608',
  /** Deepest layer (gradient bottoms, wells). */
  bgDeep: '#020203',
  /** Ink card surface. */
  card: '#111114',
  /** Raised surface on cards (chips, inputs, nested wells). */
  surface: '#1D1D23',
  /** Hairline borders — THE structural element of this design. */
  border: 'rgba(255,255,255,0.08)',
  /** Slightly stronger hairline for emphasized cards. */
  borderStrong: 'rgba(255,255,255,0.14)',

  /** Slightly warm paper-white for primary text. */
  text: '#F5F4F0',
  textSecondary: '#98979E',
  textTertiary: '#5D5C64',

  /** Amber — the Revl accent. Primary actions, active nav, marks. */
  accent: '#F2A93B',
  accentSoft: 'rgba(242,169,59,0.14)',
  /** Text/icon color placed ON amber fills. */
  onAccent: '#1C1204',

  /** Violet — AI voice only (briefing, explain, ask). */
  ai: '#9D97F5',
  aiSoft: 'rgba(157,151,245,0.14)',

  /** Green — verified answers + success only. */
  verified: '#4ADE80',
  verifiedSoft: 'rgba(74,222,128,0.12)',

  /** Semantic feedback. */
  success: '#4ADE80',
  warning: '#F2A93B',
  danger: '#F87171',
  badge: '#F87171',

  /** Bottom dock translucency (sits over BlurView). */
  dockTint: 'rgba(10,10,13,0.82)',

  /** Mobile-money brand colors (unlock flow). */
  mtn: '#FFCC08',
  orange: '#FF7900',
} as const;

/**
 * SF Pro Display from the bundled OTFs (loaded in app/_layout.tsx).
 * Serif = the paper's voice; used for question text only.
 */
export const fonts = {
  regular: 'SFProDisplay-Regular',
  medium: 'SFProDisplay-Medium',
  bold: 'SFProDisplay-Bold',
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' })!,
} as const;

export const type = {
  /** Big screen titles ("Courses") */
  display: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 38, color: colors.text },
  /** Section headers */
  h1: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, color: colors.text },
  /** Card titles */
  cardTitle: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 23, color: colors.text },
  /**
   * Kicker — small caps, letterspaced. Revl's editorial label style
   * (replaces the reference app's plain grey labels).
   */
  kicker: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
  },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 17, color: colors.textSecondary },
  /** The paper's voice — question text. */
  question: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 36, color: colors.text },
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
  /** Cards — tighter than typical dark apps; crisp, editorial. */
  card: 18,
  thumb: 12,
  pill: 999,
  tile: 14,
} as const;

/** Height reserved so scroll content clears the bottom dock. */
export const TAB_BAR_CLEARANCE = 96;
