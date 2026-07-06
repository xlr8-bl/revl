/**
 * RevealLog store — the single tally table behind all of Study DNA.
 *
 * One row is written every time a student reveals + self-assesses a
 * question. Everything personal (weak topics, false confidence, daily
 * session, nemesis, prerequisite edges) is *derived* from this table by
 * plain queries in lib/selectors.ts. No ML, no server — works day one.
 *
 * Backed by expo-sqlite on device (see lib/db/index.native.ts). Falls
 * back to an in-memory array on web — or if SQLite fails to open — so
 * the app never breaks.
 */
import { openRevlDb } from './db';
import type { RevlDatabase } from './db/types';
import type { RevealLog } from '../types';

type Row = {
  id: string;
  questionId: string;
  courseCode: string;
  tags: string; // JSON string[] in storage
  confidenceBefore: string;
  resolution: string;
  prerequisiteTags: string | null;
  hadNotes: number;
  timestamp: number;
};

const memory: RevealLog[] = []; // fallback store
const listeners = new Set<() => void>();

const db: RevlDatabase | null = (() => {
  const handle = openRevlDb();
  try {
    handle?.execSync(`CREATE TABLE IF NOT EXISTS reveal_log (
      id TEXT PRIMARY KEY,
      questionId TEXT NOT NULL,
      courseCode TEXT NOT NULL,
      tags TEXT NOT NULL,
      confidenceBefore TEXT NOT NULL,
      resolution TEXT NOT NULL,
      prerequisiteTags TEXT,
      hadNotes INTEGER NOT NULL,
      timestamp INTEGER NOT NULL
    );`);
    return handle;
  } catch {
    return null; // in-memory fallback
  }
})();

function rowToLog(r: Row): RevealLog {
  return {
    id: r.id,
    questionId: r.questionId,
    courseCode: r.courseCode,
    tags: JSON.parse(r.tags),
    confidenceBefore: r.confidenceBefore as RevealLog['confidenceBefore'],
    resolution: r.resolution as RevealLog['resolution'],
    prerequisiteTags: r.prerequisiteTags ? JSON.parse(r.prerequisiteTags) : undefined,
    hadNotes: !!r.hadNotes,
    timestamp: r.timestamp,
  };
}

/** Append one reveal/self-assessment row. */
export function logReveal(entry: Omit<RevealLog, 'id' | 'timestamp'> & { timestamp?: number }): RevealLog {
  const full: RevealLog = {
    ...entry,
    id: `rl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: entry.timestamp ?? Date.now(),
  };
  if (db) {
    db.runSync(
      `INSERT INTO reveal_log (id, questionId, courseCode, tags, confidenceBefore, resolution, prerequisiteTags, hadNotes, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        full.id,
        full.questionId,
        full.courseCode,
        JSON.stringify(full.tags),
        full.confidenceBefore,
        full.resolution,
        full.prerequisiteTags ? JSON.stringify(full.prerequisiteTags) : null,
        full.hadNotes ? 1 : 0,
        full.timestamp,
      ]
    );
  } else {
    memory.push(full);
  }
  listeners.forEach((l) => l());
  return full;
}

/** All rows, oldest → newest. Selectors reduce over this. */
export function getAllLogs(): RevealLog[] {
  if (db) {
    const rows = db.getAllSync<Row>('SELECT * FROM reveal_log ORDER BY timestamp ASC');
    return rows.map(rowToLog);
  }
  return [...memory].sort((a, b) => a.timestamp - b.timestamp);
}

/** Subscribe to log changes (screens re-derive DNA when a row lands). */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/* ------------------------------------------------------------------ */
/* Demo seed — gives Study DNA something to show on first run.         */
/* Delete this (and its call in app/_layout.tsx) when real usage       */
/* accumulates its own data.                                           */
/* ------------------------------------------------------------------ */

export function seedDemoDataIfEmpty() {
  if (getAllLogs().length > 0) return;
  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const seed: Array<Omit<RevealLog, 'id'>> = [
    // information-gain: repeated misses, incl. false confidence — the weak cluster
    { questionId: 'q2bi', courseCode: 'CEC420', tags: ['information-gain'], confidenceBefore: 'yes', resolution: 'not-yet', prerequisiteTags: ['entropy', 'logarithms'], hadNotes: true, timestamp: now - 21 * day },
    { questionId: 'q2bi', courseCode: 'CEC420', tags: ['information-gain'], confidenceBefore: 'sort-of', resolution: 'not-yet', prerequisiteTags: ['entropy'], hadNotes: true, timestamp: now - 14 * day },
    { questionId: 'q2bii', courseCode: 'CEC420', tags: ['information-gain', 'decision-trees'], confidenceBefore: 'yes', resolution: 'not-yet', prerequisiteTags: ['entropy'], hadNotes: true, timestamp: now - 10 * day },
    // apriori: the nemesis — most not-yets
    { questionId: 'q4', courseCode: 'CEC420', tags: ['association-rules', 'apriori'], confidenceBefore: 'no', resolution: 'not-yet', hadNotes: true, timestamp: now - 18 * day },
    { questionId: 'q4', courseCode: 'CEC420', tags: ['association-rules', 'apriori'], confidenceBefore: 'sort-of', resolution: 'not-yet', prerequisiteTags: ['set-theory'], hadNotes: true, timestamp: now - 12 * day },
    { questionId: 'q4', courseCode: 'CEC420', tags: ['association-rules', 'apriori'], confidenceBefore: 'yes', resolution: 'not-yet', prerequisiteTags: ['set-theory'], hadNotes: true, timestamp: now - 6 * day },
    // entropy: improving — was weak, now clean
    { questionId: 'q1', courseCode: 'CEC420', tags: ['entropy', 'decision-trees'], confidenceBefore: 'no', resolution: 'not-yet', prerequisiteTags: ['logarithms'], hadNotes: true, timestamp: now - 25 * day },
    { questionId: 'q1', courseCode: 'CEC420', tags: ['entropy', 'decision-trees'], confidenceBefore: 'sort-of', resolution: 'got-it', hadNotes: true, timestamp: now - 15 * day },
    { questionId: 'q2a', courseCode: 'CEC420', tags: ['entropy'], confidenceBefore: 'yes', resolution: 'got-it', hadNotes: true, timestamp: now - 8 * day },
    // clustering: fine
    { questionId: 'q3a', courseCode: 'CEC420', tags: ['clustering', 'hierarchical-clustering'], confidenceBefore: 'sort-of', resolution: 'got-it', hadNotes: true, timestamp: now - 9 * day },
    { questionId: 'q3b', courseCode: 'CEC420', tags: ['clustering'], confidenceBefore: 'yes', resolution: 'got-it', hadNotes: true, timestamp: now - 5 * day },
    // evaluation metrics: one recent miss
    { questionId: 'q5', courseCode: 'CEC420', tags: ['evaluation-metrics', 'classification'], confidenceBefore: 'yes', resolution: 'not-yet', prerequisiteTags: ['ratios'], hadNotes: false, timestamp: now - 2 * day },
    // ML course
    { questionId: 'mlq1', courseCode: 'CEC412', tags: ['gradient-descent', 'linear-regression'], confidenceBefore: 'no', resolution: 'not-yet', prerequisiteTags: ['calculus', 'partial-derivatives'], hadNotes: false, timestamp: now - 4 * day },
  ];
  seed.forEach((s) => logReveal(s));
}
