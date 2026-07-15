/**
 * Study briefing — the one "AI insight" line above the plan. See
 * docs/AI_INSIGHT.md for the full answer to "what engine writes this?".
 * Short version: the FACTS are a deterministic reduction over the reveal
 * log (no model can invent a weakness you don't have); an LLM is only an
 * optional voice layer later that rephrases these same facts more warmly.
 * Today it runs fully on device, instantly, offline.
 */
import type { RevealLog } from '../types';
import { computeTopicStats, falseConfidenceTopics, weakTopics } from './selectors';

/** Below this many reveals we don't pretend to know the student yet. */
const MIN_DATA = 8;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function buildBriefing(logs: RevealLog[]): string {
  if (logs.length < MIN_DATA) {
    // Honest cold state — no invented personalization on a fresh account.
    return 'Still learning how you think. The more you revise, the sharper this gets.';
  }

  const weak = weakTopics(logs);
  const fc = falseConfidenceTopics(logs)[0];
  const stats = computeTopicStats(logs);
  // "Improving" — a topic you used to miss but have since been getting
  // right, now sitting at low weakness. Real progress, worth naming.
  const improving = stats
    .filter((s) => s.gotIt > 0 && s.notYet > 0 && s.weakness < 0.34)
    .sort((a, b) => a.weakness - b.weakness)[0];

  const parts: string[] = [];

  // Lead with the single highest-value insight. False confidence (said
  // "I've got this", then missed) beats raw weakness — it's the gap a
  // student can't see themselves.
  if (fc) {
    parts.push(
      `You marked ${fc.tag} as "I've got this", then missed it ${fc.falseConfidence}× — close that gap first.`
    );
  } else if (weak[0] && weak[0].weakness > 0) {
    parts.push(`${cap(weak[0].tag)} is where you lose the most marks right now.`);
  }

  // The plan (lib/studySessions) leads with the weakest topic, so this is
  // a true statement about tonight, not a promise.
  const lead = fc ? weak.find((w) => w.tag !== fc.tag) : weak[0];
  if (lead && lead.weakness > 0) {
    parts.push(fc ? `Tonight also warms up your ${lead.tag}.` : `Tonight's plan leads with it.`);
  }

  // Acknowledge progress last — motivation, and it's earned.
  if (improving && improving.tag !== fc?.tag && improving.tag !== lead?.tag) {
    parts.push(`Your ${improving.tag} work is clean now, so I've eased off it.`);
  }

  return parts.length > 0
    ? parts.join(' ')
    : 'You are steady across your topics — tonight keeps them warm before the exam.';
}
