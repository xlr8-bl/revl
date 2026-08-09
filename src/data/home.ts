/**
 * Home screen content. Question of the Day and the session cards are no
 * longer mocks — they come from lib/questionOfTheDay and lib/studySessions
 * (real queries over the reveal log). Only the class-room feed slice below
 * is still mock data, and it deliberately shows PUBLIC acts only — things
 * people chose to publish (uploads, verified answers, room posts), never
 * private study activity (sessions finished, streaks, nemeses). Friends
 * being able to measure how hard you're revising is a privacy leak, not a
 * feature.
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

export const communityFeed: { id: string; user: string; initial: string; color: string; action: string; detail: string; time: string }[] = [
  { id: 'c1', user: 'Brandon', initial: 'B', color: '#3C6FE8', action: 'posted a solution', detail: 'CEC420 · Q4. Apriori, step-by-step working', time: '2h' },
  { id: 'c2', user: 'Melissa', initial: 'M', color: '#9D2450', action: 'verified an answer', detail: 'CEC412 · Q1. Gradient descent derivation', time: '4h' },
  { id: 'c3', user: 'Tantoh', initial: 'T', color: '#357F84', action: 'uploaded a paper', detail: 'CEC406 · Computer Networks · 2020', time: '7h' },
  { id: 'c4', user: 'Grace', initial: 'G', color: '#8A6D2F', action: 'asked the room', detail: 'CEC420 · Q2b. Where does the log come from?', time: '9h' },
];
