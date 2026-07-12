/**
 * CourseBandMenu — Android/web: nothing (the JS long-press overlay covers
 * those platforms). iOS gets CourseBandMenu.ios.tsx: a thin native
 * context-menu layer over the card's header band only, so the card itself
 * stays pure React Native (no SwiftUI sizing races — no uneven gaps or
 * overlapping cards) and every paper row stays tappable.
 */
export function CourseBandMenu(_props: {
  code: string;
  title: string;
  meta: string;
  /** Card width, measured by the card's own onLayout. */
  width: number;
}) {
  return null;
}
