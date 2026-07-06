import type { WrappedStats } from '../types';

/**
 * Mock Wrapped stats. The real version is derived entirely from the
 * local RevealLog table at the end of semester (see lib/selectors.ts) —
 * this mock defines the exact shape those queries must produce.
 */
export const wrappedStats: WrappedStats = {
  papersConquered: 11,
  questionsRevealed: 247,
  nemesis: {
    questionNumber: '4',
    courseCode: 'CEC420',
    excerpt: 'Using the Apriori algorithm, find all frequent 2-itemsets…',
    beaten: true,
    notYetCount: 6,
  },
  turnaround: {
    topic: 'information-gain',
    septemberWeakness: 0.85,
    nowWeakness: 0.15,
  },
  prerequisiteStory: {
    struggled: 'information-gain',
    tracedTo: 'entropy',
    clickedWeek: 9,
    unlockedTopics: ['information-gain', 'decision-trees', 'gain-ratio', 'pruning'],
  },
  hoursStudied: 63,
  mostActiveHour: '11 PM',
  falseConfidenceStart: 14,
  falseConfidenceEnd: 3,
  predictedAccuracy: 0.72,
};
