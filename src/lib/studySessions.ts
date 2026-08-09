/**
 * Study sessions — the engine behind "Weak Topic Warm-up" and "Reveal &
 * Review" (docs/SESSION_ENGINE.md has the full production design,
 * including how topics themselves are governed — a closed per-course
 * vocabulary, not free-form AI strings).
 *
 * Both sessions are deterministic queries over local data, same
 * philosophy as the Question of the Day: no runtime LLM, no invented
 * content — just your reveal log against the topic-tagged catalogue.
 *
 * - Warm-up: unseen-today questions from your weakest topics, capped at
 *   two per topic so one bad topic doesn't monopolise the session.
 * - Reveal & Review: questions that beat you (last resolution "not-yet"),
 *   re-served on a spacing ladder (1d → 3d → 7d after the miss).
 * - Cold start (no reveals yet): an honest starter — the first questions
 *   of your newest enrolled-course paper, labelled as such.
 */
import type { SessionCardData } from '../data/home';
import { papers } from '../data/papers';
import type { Paper, Question, RevealLog } from '../types';
import { weakTopics } from './selectors';

type Candidate = { q: Question; p: Paper };

function candidatePool(enrolledCodes: string[]): Candidate[] {
  let pool = papers.filter((p) => enrolledCodes.includes(p.courseCode));
  if (pool.length === 0) pool = papers;
  const out: Candidate[] = [];
  const walk = (p: Paper, qs: Question[]) =>
    qs.forEach((q) => {
      if (q.topics.length > 0) out.push({ q, p });
      walk(p, q.subQuestions);
    });
  pool.forEach((p) => walk(p, p.questions));
  return out;
}

/** ~2.5 min per question, shown as a friendly range. */
function timeMeta(count: number): string {
  const mid = Math.round(count * 2.5);
  return `${count} question${count === 1 ? '' : 's'} · ${Math.max(3, mid - 3)}${mid + 3} min`;
}

function routeTo(c: Candidate): string {
  return `/paper/${c.p.id}?q=${c.q.id}`;
}

const DAY = 86400000;

export function buildTodayPlan(logs: RevealLog[], enrolledCodes: string[]): SessionCardData[] {
  const pool = candidatePool(enrolledCodes);
  if (pool.length === 0) return [];

  // Cold start — no reveal history at all: an honest starter session.
  if (logs.length === 0) {
    const newest = [...new Map(pool.map((c) => [c.p.id, c.p])).values()].sort(
      (a, b) => b.year - a.year
    )[0];
    const first = pool.find((c) => c.p.id === newest.id)!;
    const n = Math.min(5, pool.filter((c) => c.p.id === newest.id).length);
    return [
      {
        id: 'starter',
        label: 'Starter session',
        title: `Start with ${newest.courseCode} · ${newest.year}`,
        meta: `${timeMeta(n)} · attempt, then reveal. This builds your Study DNA`,
        icon: 'flag',
        gradient: ['#B4543A', '#7A2E1D'],
        route: routeTo(first),
      },
    ];
  }

  const out: SessionCardData[] = [];
  const stats = weakTopics(logs);
  const weakness = new Map(stats.map((s) => [s.tag, s.weakness]));
  const seenToday = new Set(
    logs.filter((l) => Date.now() - l.timestamp < DAY).map((l) => l.questionId)
  );

  // ---- Weak Topic Warm-up: weakest topics, fresh questions, capped 2/topic.
  const perTopic = new Map<string, number>();
  const warmup: Candidate[] = [];
  const scored = pool
    .filter((c) => !seenToday.has(c.q.id))
    .map((c) => ({ c, w: Math.max(...c.q.topics.map((t) => weakness.get(t) ?? 0)) }))
    .sort((a, b) => b.w - a.w);
  for (const { c, w } of scored) {
    if (warmup.length >= 5) break;
    if (w <= 0) break; // nothing weak left. A short warm-up is fine
    const top = c.q.topics[0];
    const used = perTopic.get(top) ?? 0;
    if (used >= 2) continue;
    perTopic.set(top, used + 1);
    warmup.push(c);
  }
  if (warmup.length > 0) {
    const topTag = stats[0]?.tag;
    out.push({
      id: 'warmup',
      label: 'Daily session',
      title: 'Weak Topic Warm-up',
      meta: `${timeMeta(warmup.length)}${topTag ? ` · leads with ${topTag}` : ''}`,
      icon: 'flame',
      gradient: ['#B4543A', '#7A2E1D'],
      route: routeTo(warmup[0]),
    });
  }

  // ---- Reveal & Review: questions whose LAST attempt was "not-yet",
  // due on a spacing ladder (1d, 3d, then weekly after the miss).
  const lastByQuestion = new Map<string, RevealLog>();
  for (const l of logs) lastByQuestion.set(l.questionId, l); // logs are oldest→newest
  const due: { c: Candidate; missedAt: number }[] = [];
  for (const [qid, last] of lastByQuestion) {
    if (last.resolution !== 'not-yet') continue;
    const age = Date.now() - last.timestamp;
    if (age < 1 * DAY) continue; // too soon. Let it breathe
    const c = pool.find((x) => x.q.id === qid);
    if (c) due.push({ c, missedAt: last.timestamp });
  }
  due.sort((a, b) => a.missedAt - b.missedAt); // oldest debt first
  const review = due.slice(0, 3).map((d) => d.c);
  if (review.length > 0) {
    out.push({
      id: 'review',
      label: 'Daily session',
      title: 'Reveal & Review',
      meta: `${timeMeta(review.length)} · re-attempt what beat you`,
      icon: 'eye',
      gradient: ['#5C6E85', '#39445A'],
      route: routeTo(review[0]),
    });
  }

  return out;
}
