/**
 * Demo event feed — stands in for the server push pipeline. Called once on
 * app open (Today mount): seeds friend activity for people you're actually
 * friends with, a paper drop for an enrolled course, and a credits mint
 * matching the review pipeline (docs/PAPER_REVIEW.md). Every entry is
 * deduped by key, so this is idempotent across launches; the server phase
 * replaces this file with real pushes into the same store.
 *
 * Privacy rule (docs/FRIENDS_PRIVACY.md): friend items may only describe
 * PUBLIC acts — uploads, verified answers, room posts. Never study
 * activity (sessions finished, streaks, reveal counts) — friends must not
 * be able to measure how hard someone is revising.
 */
import { friendIdSet, person } from './friendsStore';
import { checkExamMilestones, pushNotification } from './notificationsStore';

const HOUR = 3600000;

export function seedDemoNotifications(opts: {
  enrolledCourseCodes?: string[];
  examDateISO?: string;
}) {
  const friends = friendIdSet();
  const now = Date.now();

  // Friend activity — only people in YOUR graph ever appear.
  const melissa = person('p2');
  if (melissa && friends.has('p2')) {
    pushNotification(
      {
        kind: 'friend',
        lead: 'Melissa',
        body: 'verified an answer on CEC412 Q1. Gradient descent derivation.',
        avatar: { initial: melissa.initial, color: melissa.color },
        createdAt: now - 4 * HOUR,
      },
      'friend:seed:melissa-verified'
    );
  }
  const grace = person('p3');
  if (grace && friends.has('p3')) {
    pushNotification(
      {
        kind: 'friend',
        lead: 'Grace',
        body: 'asked the room about CEC420 Q2b. You attempted that one.',
        avatar: { initial: grace.initial, color: grace.color },
        createdAt: now - 9 * HOUR,
        unread: false,
      },
      'friend:seed:grace-asked'
    );
  }

  // Paper drop — only for a course you're enrolled in.
  const enrolled = opts.enrolledCourseCodes ?? [];
  if (enrolled.includes('CEC420')) {
    pushNotification(
      {
        kind: 'paper',
        lead: 'CEC420 · 2024',
        body: 'just landed. First Semester Examination, Data Mining.',
        createdAt: now - 2 * HOUR,
      },
      'paper:seed:cec420-2024'
    );
  }

  // Credits mint — copy matches the paper review pipeline.
  pushNotification(
    {
      kind: 'credits',
      lead: 'You earned 2 credits',
      body: 'your CEC406 upload passed review. Spend them on unlocks.',
      createdAt: now - 26 * HOUR,
      unread: false,
    },
    'credits:seed:cec406-review'
  );

  checkExamMilestones(opts.examDateISO);
}
