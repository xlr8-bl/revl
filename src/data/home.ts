/**
 * Home screen content — today's session cards. The Question of the Day is
 * no longer a mock: it comes from lib/questionOfTheDay (real per-student
 * selector). The session cards will eventually be *derived* from Study DNA
 * (see lib/selectors.ts → buildDailySession); these mocks define the shape.
 */

export type SessionCardData = {
  id: string;
  label: string; // small grey label ("Daily Session")
  title: string;
  meta: string; // "5 questions · 15 min"
  icon: string; // Ionicons name for the thumbnail
  gradient: [string, string];
  pill?: { icon: string; value: string }; // tiny stat pill, top-left
  route: string;
};

export const todaySession: SessionCardData[] = [
  {
    id: 's1',
    label: 'Daily Session',
    title: 'Weak Topic Warm-up',
    meta: '5 questions · 12–15 min',
    icon: 'flame',
    gradient: ['#B4543A', '#7A2E1D'],
    pill: { icon: 'water', value: '0' },
    route: '/paper/cec420-2023',
  },
  {
    id: 's2',
    label: 'Daily Session',
    title: 'Reveal & Review',
    meta: '3 questions · 8–10 min',
    icon: 'eye',
    gradient: ['#5C6E85', '#39445A'],
    route: '/paper/cec412-2023',
  },
];

export const communityFeed: { id: string; user: string; initial: string; color: string; action: string; detail: string; time: string }[] = [
  { id: 'c1', user: 'Brandon', initial: 'B', color: '#3C6FE8', action: 'beat their nemesis', detail: 'CEC420 · Q4 — Apriori, after 6 attempts', time: '2h' },
  { id: 'c2', user: 'Melissa', initial: 'M', color: '#9D2450', action: 'verified an answer', detail: 'CEC412 · Q1 — gradient descent derivation', time: '4h' },
  { id: 'c3', user: 'Tantoh', initial: 'T', color: '#357F84', action: 'uploaded a paper', detail: 'CEC406 · Computer Networks · 2020', time: '7h' },
  { id: 'c4', user: 'Grace', initial: 'G', color: '#8A6D2F', action: 'finished a session', detail: 'Weak Topic Warm-up · 5/5 got it', time: '9h' },
];
