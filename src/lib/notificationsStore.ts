/**
 * Notifications engine — a WORKING system, not a static mock list. App
 * events push real entries (downloads completing, exam-countdown
 * milestones, friend activity, paper drops, credits), persisted to
 * AsyncStorage so the feed and the bell badge survive restarts. Server
 * push (expo-notifications) is the native-build phase; this store is the
 * shape it will feed.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

const KEY = 'revl.notifications.v1';
const MAX = 60;

export type NotificationKind = 'paper' | 'friend' | 'credits' | 'reminder' | 'download';
export type AppNotification = {
  id: string;
  kind: NotificationKind;
  /** Bold lead-in (actor or subject): "Melissa", "CEC420 2023". */
  lead: string;
  /** Regular continuation: "verified an answer on Q1 in your room." */
  body: string;
  /** Avatar seed for friend items (initial + color); icon kinds ignore it. */
  avatar?: { initial: string; color: string };
  createdAt: number;
  unread: boolean;
};

let items: AppNotification[] = [];
let hydrated = false;
const listeners = new Set<() => void>();
const emit = () => {
  items = [...items];
  listeners.forEach((l) => l());
};
const persist = () => AsyncStorage.setItem(KEY, JSON.stringify(items)).catch(() => {});

AsyncStorage.getItem(KEY)
  .then((raw) => {
    if (raw) items = JSON.parse(raw);
    hydrated = true;
    emit();
  })
  .catch(() => {
    hydrated = true;
  });

export function useNotifications(): AppNotification[] {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => items,
    () => items
  );
}

export function unreadCount(list: AppNotification[]): number {
  return list.filter((n) => n.unread).length;
}

export function markAllRead() {
  items.forEach((n) => (n.unread = false));
  persist();
  emit();
}

/**
 * Push an entry. `dedupeKey` (defaults to lead+body) drops repeats — an
 * exam milestone or a re-downloaded paper only ever lands once.
 */
export function pushNotification(
  n: Omit<AppNotification, 'id' | 'createdAt' | 'unread'> & { createdAt?: number; unread?: boolean },
  dedupeKey?: string
) {
  const key = dedupeKey ?? `${n.kind}:${n.lead}:${n.body}`;
  if (items.some((x) => `${x.kind}:${x.lead}:${x.body}` === key || x.id === key)) return;
  const { createdAt, unread, ...rest } = n;
  items.unshift({ ...rest, id: key, createdAt: createdAt ?? Date.now(), unread: unread ?? true });
  items.sort((a, b) => b.createdAt - a.createdAt);
  if (items.length > MAX) items = items.slice(0, MAX);
  persist();
  emit();
}

/** Relative time for the feed: 2m, 3h, 5d. */
export function relativeTime(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/**
 * Exam-countdown milestones — call on app open with the profile's exam
 * date; each milestone fires exactly once (dedupe by milestone).
 */
export function checkExamMilestones(examDateISO: string | undefined) {
  if (!hydrated || !examDateISO) return;
  const days = Math.ceil((new Date(examDateISO).getTime() - Date.now()) / 86400000);
  const milestones = [30, 14, 7, 3, 1];
  const hit = milestones.find((m) => days === m);
  if (hit) {
    pushNotification(
      {
        kind: 'reminder',
        lead: `Exams in ${hit} day${hit === 1 ? '' : 's'}`,
        body:
          hit <= 3
            ? 'Final stretch — review your weakest topics tonight.'
            : 'A steady 15 minutes a day from now covers your weak topics.',
      },
      `reminder:exam:${hit}`
    );
  }
}
