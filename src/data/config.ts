import type { AppConfig } from '../types';

/**
 * App config — Wrapped's time gate is driven from here.
 *
 * Wrapped is hidden all semester and only appears for
 * `wrappedWindowDays` days starting at `semesterEndDate`.
 *
 * To preview Wrapped during development, set `semesterEndDate`
 * to today (or yesterday).
 */
export const appConfig: AppConfig = {
  semesterEndDate: '2026-07-04', // ← set near "today" so Wrapped is visible for the demo
  wrappedWindowDays: 14,
  predictedPaperEnabled: true,
};
