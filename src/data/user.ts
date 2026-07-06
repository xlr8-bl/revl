import type { LedgerEntry, User } from '../types';

/** Mock signed-in student. Swap for the real auth/user record later. */
export const currentUser: User = {
  id: 'u1',
  name: 'Ashley',
  initial: 'A',
  credits: 2, // the ⚡ count in the Home header
  notifications: 1,
  enrolledCourseCodes: ['CEC420', 'CEC412', 'CEC406'],
};

/** Mock credit ledger for the wallet screen. + earned, − spent. */
export const ledger: LedgerEntry[] = [
  { id: 'l5', amount: -3, reason: 'Unlocked CEC420 · 2021 paper', timestamp: Date.parse('2026-06-28') },
  { id: 'l4', amount: 2, reason: 'Prediction resolved: Q3 appeared in CEC412 exam', timestamp: Date.parse('2026-06-20') },
  { id: 'l3', amount: 1, reason: '7-day revision streak', timestamp: Date.parse('2026-06-14') },
  { id: 'l2', amount: 3, reason: 'Uploaded CEC406 · 2022 paper (approved)', timestamp: Date.parse('2026-06-02') },
  { id: 'l1', amount: 2, reason: 'Welcome bonus', timestamp: Date.parse('2026-05-25') },
];
