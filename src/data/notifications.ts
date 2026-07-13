/**
 * Notifications — mock feed shaped like the real one will be: paper drops
 * for your courses, class-room activity, credits earned, exam reminders.
 * Read state is a tiny module store so the bell badge and the screen stay
 * in sync (server-backed later; the shape won't change).
 */
import { useSyncExternalStore } from 'react';

export type NotificationKind = 'paper' | 'class' | 'credits' | 'reminder';
export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  time: string;
  /** 'today' | 'earlier' — display grouping. */
  group: 'today' | 'earlier';
  unread: boolean;
};

let items: AppNotification[] = [
  {
    id: 'n1',
    kind: 'paper',
    title: 'New paper: CEC420 · 2024',
    detail: 'First Semester Examination just landed for Data Mining.',
    time: '2h',
    group: 'today',
    unread: true,
  },
  {
    id: 'n2',
    kind: 'class',
    title: 'Melissa verified an answer',
    detail: 'CEC412 · Q1 — gradient descent derivation, in your room.',
    time: '4h',
    group: 'today',
    unread: true,
  },
  {
    id: 'n3',
    kind: 'credits',
    title: 'You earned 2 credits',
    detail: 'Your uploaded paper passed review. Spend them on unlocks.',
    time: '9h',
    group: 'today',
    unread: false,
  },
  {
    id: 'n4',
    kind: 'reminder',
    title: 'Exams in 19 days',
    detail: 'Your weakest topic is information gain — 12 minutes tonight covers it.',
    time: '1d',
    group: 'earlier',
    unread: false,
  },
  {
    id: 'n5',
    kind: 'class',
    title: 'Brandon beat their nemesis',
    detail: 'CEC420 · Q4 — Apriori, after 6 attempts.',
    time: '2d',
    group: 'earlier',
    unread: false,
  },
];

const listeners = new Set<() => void>();
const emit = () => {
  items = [...items];
  listeners.forEach((l) => l());
};

export function useNotifications(): AppNotification[] {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => items,
    () => items
  );
}

export function unreadCount(): number {
  return items.filter((n) => n.unread).length;
}

export function markAllRead() {
  items.forEach((n) => (n.unread = false));
  emit();
}
