import { appConfig } from '../data/config';

/**
 * Wrapped time gate.
 *
 * Wrapped is hidden all semester and only becomes visible for a
 * ~2-week window starting on semesterEndDate. Outside that window the
 * entry points (Home banner, You-tab row) simply do not render, and the
 * /wrapped route shows a locked state.
 */
export function isWrappedLive(now: Date = new Date()): boolean {
  const start = new Date(appConfig.semesterEndDate);
  const end = new Date(start.getTime() + appConfig.wrappedWindowDays * 24 * 60 * 60 * 1000);
  return now >= start && now <= end;
}

/** Days until the window opens (for the locked state copy). */
export function daysUntilWrapped(now: Date = new Date()): number {
  const start = new Date(appConfig.semesterEndDate);
  return Math.max(0, Math.ceil((start.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
}
