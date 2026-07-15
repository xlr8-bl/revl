/**
 * Study DNA selectors — everything personal, derived from the one
 * RevealLog table by counting taps against tags. No ML, just tallies.
 */
import { useSyncExternalStore } from 'react';
import { papers } from '../data/papers';
import type { PrerequisiteEdge, Question, RevealLog, TopicStat } from '../types';
import { getAllLogs, subscribe } from './revealLog';

/** React hook: re-render whenever a reveal row lands. */
export function useRevealLogs(): RevealLog[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
let cache: RevealLog[] = [];
let dirty = true;
subscribe(() => (dirty = true));
function getSnapshot() {
  if (dirty) {
    cache = getAllLogs();
    dirty = false;
  }
  return cache;
}

/* ------------------------------------------------------------------ */
/* Topic stats — the base aggregation                                  */
/* ------------------------------------------------------------------ */

export function computeTopicStats(logs: RevealLog[]): TopicStat[] {
  const byTag = new Map<string, TopicStat>();
  for (const log of logs) {
    for (const tag of log.tags) {
      const s = byTag.get(tag) ?? { tag, seen: 0, notYet: 0, gotIt: 0, falseConfidence: 0, weakness: 0, lastSeen: 0 };
      s.seen += 1;
      if (log.resolution === 'not-yet') s.notYet += 1;
      else s.gotIt += 1;
      if (log.confidenceBefore === 'yes' && log.resolution === 'not-yet') s.falseConfidence += 1;
      s.lastSeen = Math.max(s.lastSeen, log.timestamp);
      byTag.set(tag, s);
    }
  }
  // weakness = not-yet share, nudged up by false confidence (the worst kind of gap)
  for (const s of byTag.values()) {
    s.weakness = Math.min(1, s.notYet / s.seen + s.falseConfidence * 0.1);
  }
  return [...byTag.values()];
}

/** Weak topics — tags sorted by not-yet count. Drives the constellation. */
export function weakTopics(logs: RevealLog[]): TopicStat[] {
  return computeTopicStats(logs).sort((a, b) => b.notYet - a.notYet || b.weakness - a.weakness);
}

/** False confidence — "topics you *think* you know but don't." */
export function falseConfidenceTopics(logs: RevealLog[]): TopicStat[] {
  return computeTopicStats(logs)
    .filter((s) => s.falseConfidence > 0)
    .sort((a, b) => b.falseConfidence - a.falseConfidence);
}

/* ------------------------------------------------------------------ */
/* Calibration — the two strands: what you FEEL you know vs what you    */
/* ACTUALLY know, per topic. The gap between them is the whole story:   */
/* a big positive gap is a blind spot (confident, but wrong), a         */
/* negative gap means you're better than you think. Both come straight  */
/* from the reveal flow (confidence before → resolution after).         */
/* ------------------------------------------------------------------ */

export type Calibration = {
  tag: string;
  /** 0–1: weighted confidence before revealing (yes=1, sort-of=0.5, no=0). */
  felt: number;
  /** 0–1: share actually resolved "got it". */
  actual: number;
  /** felt − actual. Positive = overconfident (blind spot). */
  gap: number;
  seen: number;
};

export function calibrationByTopic(logs: RevealLog[]): Calibration[] {
  const m = new Map<string, { felt: number; got: number; seen: number }>();
  for (const l of logs) {
    for (const tag of l.tags) {
      const e = m.get(tag) ?? { felt: 0, got: 0, seen: 0 };
      e.felt += l.confidenceBefore === 'yes' ? 1 : l.confidenceBefore === 'sort-of' ? 0.5 : 0;
      e.got += l.resolution === 'got-it' ? 1 : 0;
      e.seen += 1;
      m.set(tag, e);
    }
  }
  const out: Calibration[] = [];
  for (const [tag, e] of m) {
    const felt = e.felt / e.seen;
    const actual = e.got / e.seen;
    out.push({ tag, felt, actual, gap: felt - actual, seen: e.seen });
  }
  // Worst blind spots first (largest positive gap), ties by exposure.
  return out.sort((a, b) => b.gap - a.gap || b.seen - a.seen);
}

/* ------------------------------------------------------------------ */
/* Daily session — N questions from the weakest, least-recent tags     */
/* ------------------------------------------------------------------ */

const RECENT_WINDOW = 24 * 60 * 60 * 1000; // don't repeat questions seen today

export function buildDailySession(logs: RevealLog[], n = 5): Question[] {
  const stats = weakTopics(logs);
  const tagRank = new Map(stats.map((s, i) => [s.tag, stats.length - i]));
  const recentlySeen = new Set(
    logs.filter((l) => Date.now() - l.timestamp < RECENT_WINDOW).map((l) => l.questionId)
  );

  const all: Question[] = [];
  const walk = (qs: Question[]) => qs.forEach((q) => (all.push(q), walk(q.subQuestions)));
  papers.forEach((p) => walk(p.questions));

  return all
    .filter((q) => q.topics.length > 0 && !recentlySeen.has(q.id))
    .map((q) => ({ q, score: q.topics.reduce((acc, t) => acc + (tagRank.get(t) ?? 0), 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.q);
}

/* ------------------------------------------------------------------ */
/* Nemesis — the question with the most not-yets / loudest false hit   */
/* ------------------------------------------------------------------ */

export function findNemesis(logs: RevealLog[]): { questionId: string; courseCode: string; notYet: number; falseHits: number; beaten: boolean } | null {
  const byQ = new Map<string, { courseCode: string; notYet: number; falseHits: number; lastResolution: RevealLog['resolution'] }>();
  for (const log of logs) {
    const s = byQ.get(log.questionId) ?? { courseCode: log.courseCode, notYet: 0, falseHits: 0, lastResolution: log.resolution };
    if (log.resolution === 'not-yet') s.notYet += 1;
    if (log.confidenceBefore === 'yes' && log.resolution === 'not-yet') s.falseHits += 1;
    s.lastResolution = log.resolution;
    byQ.set(log.questionId, s);
  }
  let best: ReturnType<typeof findNemesis> = null;
  for (const [questionId, s] of byQ) {
    const score = s.notYet * 2 + s.falseHits * 3;
    if (s.notYet >= 2 && (!best || score > best.notYet * 2 + best.falseHits * 3)) {
      best = { questionId, courseCode: s.courseCode, notYet: s.notYet, falseHits: s.falseHits, beaten: s.lastResolution === 'got-it' };
    }
  }
  return best;
}

/* ------------------------------------------------------------------ */
/* Prerequisite edges — roll up the AI's prerequisite tags             */
/* "your information-gain weakness traces back to entropy"             */
/* ------------------------------------------------------------------ */

export function prerequisiteEdges(logs: RevealLog[]): PrerequisiteEdge[] {
  const counts = new Map<string, PrerequisiteEdge>();
  for (const log of logs) {
    if (log.resolution !== 'not-yet' || !log.prerequisiteTags) continue;
    for (const from of log.tags) {
      for (const to of log.prerequisiteTags) {
        if (from === to) continue;
        const key = `${from}→${to}`;
        const e = counts.get(key) ?? { from, to, count: 0 };
        e.count += 1;
        counts.set(key, e);
      }
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count);
}

/** Look up a question (and its paper) anywhere in the catalogue. */
export function findQuestion(questionId: string): { question: Question; paperId: string } | null {
  for (const p of papers) {
    const stack = [...p.questions];
    while (stack.length) {
      const q = stack.pop()!;
      if (q.id === questionId) return { question: q, paperId: p.id };
      stack.push(...q.subQuestions);
    }
  }
  return null;
}
