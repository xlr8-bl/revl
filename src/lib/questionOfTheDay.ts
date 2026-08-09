/**
 * Question of the Day — the deterministic selector (no LLM needed to pick;
 * see docs/QUESTION_OF_THE_DAY.md for the full system, where an LLM only
 * *generates* fresh variants for later human review).
 *
 * Targeting is per-student from their ENROLLED COURSES, not the department —
 * that natively handles unofficial elective splits (networking vs software
 * students simply enroll different courses). Score = topic weakness (Study
 * DNA reveal logs) × how long since the topic was last seen × a date-seeded
 * shuffle so ties rotate daily. Picks persist per calendar day and don't
 * repeat within a week.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { papers } from '../data/papers';
import type { Paper, Question, RevealLog } from '../types';
import { weakTopics } from './selectors';

const KEY = 'revl.qotd.v1';

/** dateKey (YYYY-MM-DD) → picked question id. */
let history: Record<string, string> = {};
let hydrated = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

AsyncStorage.getItem(KEY)
  .then((raw) => {
    if (raw) history = JSON.parse(raw);
    hydrated = true;
    emit();
  })
  .catch(() => {
    hydrated = true;
  });

function dateKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Deterministic tiny hash — the daily shuffle for tie-breaking. */
function seededHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

export type DailyPick = {
  question: Question;
  paper: Paper;
  /** "CEC420 · Data Mining · 2023" */
  sourceLine: string;
  /** Honest copy: WHY this question was picked for you. */
  reason: string;
};

function flatQuestions(p: Paper): Question[] {
  const out: Question[] = [];
  const walk = (qs: Question[]) => qs.forEach((q) => (out.push(q), walk(q.subQuestions)));
  walk(p.questions);
  return out;
}

function computePick(enrolledCodes: string[], logs: RevealLog[]): DailyPick | null {
  const today = dateKey();

  // Candidate pool: papers of enrolled courses; whole catalogue as fallback.
  let pool = papers.filter((p) => enrolledCodes.includes(p.courseCode));
  if (pool.length === 0) pool = papers;

  const candidates: { q: Question; p: Paper }[] = [];
  for (const p of pool)
    for (const q of flatQuestions(p)) if (q.topics.length > 0 && q.marks > 0) candidates.push({ q, p });
  if (candidates.length === 0) return null;

  // Already picked today? Serve the same question all day.
  const todayId = history[today];
  if (todayId) {
    const hit = candidates.find((c) => c.q.id === todayId);
    if (hit) return withReason(hit, logs);
  }

  // Don't repeat anything picked in the last 7 days.
  const cutoff = Date.now() - 7 * 86400000;
  const recent = new Set(
    Object.entries(history)
      .filter(([k]) => new Date(k).getTime() >= cutoff)
      .map(([, id]) => id)
  );

  const stats = weakTopics(logs);
  const weakness = new Map(stats.map((s) => [s.tag, s.weakness]));
  const lastSeen = new Map(stats.map((s) => [s.tag, s.lastSeen]));

  let best: { q: Question; p: Paper } | null = null;
  let bestScore = -1;
  for (const c of candidates) {
    if (recent.has(c.q.id) && candidates.length > recent.size) continue;
    // Weakness of the question's weakest topic (0..1)…
    const weak = Math.max(...c.q.topics.map((t) => weakness.get(t) ?? 0));
    // …times spaced-repetition recency: topics not seen for days score higher.
    const seen = Math.max(...c.q.topics.map((t) => lastSeen.get(t) ?? 0));
    const staleDays = seen ? Math.min(14, (Date.now() - seen) / 86400000) : 7;
    // Date-seeded shuffle breaks ties and rotates the cold-start pick daily.
    const shuffle = seededHash(`${today}:${c.q.id}`);
    const score = weak * 10 + staleDays * 0.5 + shuffle;
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  if (!best) return null;

  history[today] = best.q.id;
  // Keep the history small — a month is plenty for the no-repeat window.
  const keys = Object.keys(history).sort();
  while (keys.length > 31) delete history[keys.shift()!];
  AsyncStorage.setItem(KEY, JSON.stringify(history)).catch(() => {});
  return withReason(best, logs);
}

function withReason(c: { q: Question; p: Paper }, logs: RevealLog[]): DailyPick {
  const stats = weakTopics(logs);
  const weakTag = stats.find((s) => s.weakness > 0.3 && c.q.topics.includes(s.tag));
  return {
    question: c.q,
    paper: c.p,
    sourceLine: `${c.p.courseCode} · ${c.p.title} · ${c.p.year}`,
    reason: weakTag
      ? `Picked for your weak topic: ${weakTag.tag}`
      : 'Picked from your courses. A fresh one every day',
  };
}

/**
 * The daily pick for this student. Recomputes when the reveal log or the
 * enrolled set changes; stable for the rest of the day once chosen.
 */
export function useQuestionOfTheDay(enrolledCodes: string[], logs: RevealLog[]): DailyPick | null {
  // Subscribe to hydration so the persisted pick wins over a fresh compute.
  useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => hydrated,
    () => hydrated
  );
  return computePick(enrolledCodes, logs);
}
