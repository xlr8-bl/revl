/**
 * Academic calendar — the single source of truth for "where is the student
 * in the year". University of Buea runs two semesters: First ≈ September to
 * January (exams February), Second ≈ February to July (exams June), with a
 * resit window around September. All of onboarding, the exam countdown and
 * level progression derive from these helpers instead of asking the student
 * to hand-enter dates that then contradict each other.
 */

export type Semester = 'S1' | 'S2';

/** The active semester for a date. Sep–Jan → First; Feb–Aug → Second. */
export function currentSemester(d: Date = new Date()): Semester {
  const m = d.getMonth(); // 0 = January
  return m >= 8 || m === 0 ? 'S1' : 'S2';
}

/** Academic-year label, rolling over in September: e.g. "2026/2027". */
export function academicYear(d: Date = new Date()): string {
  const y = d.getFullYear();
  return d.getMonth() >= 8 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
}

/** True when a stored academic year is older than today's — time to advance. */
export function isNewAcademicYear(stored: string | undefined, d: Date = new Date()): boolean {
  return !!stored && stored !== academicYear(d);
}

export type ExamSitting = { key: 'sem1' | 'sem2'; label: string; iso: string };

/**
 * The exam sitting the student is revising toward, derived from the active
 * semester: First-semester exams sit in February, Second-semester in June —
 * each resolved to the NEXT such date from `d` so the countdown is always
 * forward-looking.
 */
export function nextExamSitting(d: Date = new Date(), semester: Semester = currentSemester(d)): ExamSitting {
  const y = d.getFullYear();
  const feb = (yy: number) => new Date(yy, 1, 15); // 15 Feb
  const jun = (yy: number) => new Date(yy, 5, 14); // 14 Jun
  if (semester === 'S1') {
    const target = d <= feb(y) ? feb(y) : feb(y + 1);
    return { key: 'sem1', label: 'First semester exams · February', iso: target.toISOString() };
  }
  const target = d <= jun(y) ? jun(y) : jun(y + 1);
  return { key: 'sem2', label: 'Second semester exams · June', iso: target.toISOString() };
}

/** Human label for a semester. */
export function semesterName(s: Semester): string {
  return s === 'S1' ? 'First semester' : 'Second semester';
}

const LEVELS = ['L200', 'L300', 'L400', 'L500', 'L600'];

/** The level a student advances to next academic year (null at the top / HND). */
export function nextLevel(level: string): string | null {
  const i = LEVELS.indexOf(level);
  return i >= 0 && i < LEVELS.length - 1 ? LEVELS[i + 1] : null;
}
