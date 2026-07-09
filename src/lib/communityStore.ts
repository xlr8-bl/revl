/**
 * Community store — the department room's local state. Same pattern as
 * revealLog: module state + useSyncExternalStore, mock-seeded, fully
 * interactive (post, upvote, raise hand) so the UX is real before the
 * backend. Rooms are keyed `school:departmentId` server-side later.
 */
import { useSyncExternalStore } from 'react';

export type QuestionRef = { paperId: string; questionId: string };

export type CommunityPost = {
  id: string;
  kind: 'ask' | 'solve';
  author: { name: string; initial: string; color: string; level: string };
  text: string;
  /** Snapped photo of handwritten work (Solve posts). */
  imageUri?: string;
  /** The anchored question — renders as a real question card in the post. */
  questionRef?: QuestionRef;
  courseCode?: string;
  upvotes: number;
  upvotedByMe?: boolean;
  comments: number;
  /** Solve posts past the community threshold become the verified answer. */
  communityVerified?: boolean;
  level: string;
  time: string;
};

export type WantedEntry = { ref: QuestionRef; courseCode: string; hands: number; raisedByMe?: boolean };

type State = { posts: CommunityPost[]; wanted: WantedEntry[] };

const seed: State = {
  posts: [
    {
      id: 'p1',
      kind: 'solve',
      author: { name: 'Brandon', initial: 'B', color: '#7EA8FF', level: 'L400' },
      text: 'Finally cracked the Apriori question everyone keeps raising hands on. Full working below. The trick is counting {diapers, beer} BEFORE pruning. Snapped my working.',
      imageUri: 'https://picsum.photos/seed/revl-solution/640/420',
      questionRef: { paperId: 'cec420-2023', questionId: 'q4' },
      courseCode: 'CEC420',
      upvotes: 47,
      comments: 12,
      communityVerified: true,
      level: 'L400',
      time: '2h',
    },
    {
      id: 'p2',
      kind: 'ask',
      author: { name: 'Melissa', initial: 'M', color: '#FF8FA3', level: 'L400' },
      text: 'Can someone explain why we weight the branch entropies in 2(b)(i)? I keep getting 0.94 instead of 0.048 and I do not see where the 8/14 comes from.',
      questionRef: { paperId: 'cec420-2023', questionId: 'q2bi' },
      courseCode: 'CEC420',
      upvotes: 18,
      comments: 7,
      level: 'L400',
      time: '5h',
    },
    {
      id: 'p3',
      kind: 'ask',
      author: { name: 'Tantoh', initial: 'T', color: '#5EEAD4', level: 'L300' },
      text: 'Does anyone have the 2022 marking guide? Prof said the confusion matrix question repeats almost every year.',
      courseCode: 'CEC420',
      upvotes: 9,
      comments: 3,
      level: 'L300',
      time: '9h',
    },
    {
      id: 'p4',
      kind: 'solve',
      author: { name: 'Grace', initial: 'G', color: '#F2A93B', level: 'L400' },
      text: 'Precision/recall worked cleanly, with the F1 shortcut we derived in class. Check my steps before the exam.',
      questionRef: { paperId: 'cec420-2023', questionId: 'q5' },
      courseCode: 'CEC420',
      upvotes: 21,
      comments: 4,
      level: 'L400',
      time: '1d',
    },
  ],
  wanted: [
    { ref: { paperId: 'cec420-2023', questionId: 'q4' }, courseCode: 'CEC420', hands: 23 },
    { ref: { paperId: 'cec420-2023', questionId: 'q2bi' }, courseCode: 'CEC420', hands: 17 },
    { ref: { paperId: 'cec412-2023', questionId: 'mlq1' }, courseCode: 'CEC412', hands: 11 },
    { ref: { paperId: 'cec420-2023', questionId: 'q3a' }, courseCode: 'CEC420', hands: 6 },
  ],
};

let state: State = seed;
const listeners = new Set<() => void>();
const emit = () => {
  state = { ...state };
  listeners.forEach((l) => l());
};

export function useCommunity(): State {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => state,
    () => state
  );
}

export function addPost(post: Omit<CommunityPost, 'id' | 'upvotes' | 'comments' | 'time'>) {
  state.posts = [
    { ...post, id: `p-${Date.now()}`, upvotes: 0, comments: 0, time: 'now' },
    ...state.posts,
  ];
  emit();
}

export function toggleUpvote(postId: string) {
  state.posts = state.posts.map((p) =>
    p.id === postId
      ? { ...p, upvotedByMe: !p.upvotedByMe, upvotes: p.upvotes + (p.upvotedByMe ? -1 : 1) }
      : p
  );
  emit();
}

/** Raise a hand on a question: explicit demand for a human solution. */
export function raiseHand(ref: QuestionRef, courseCode: string) {
  const existing = state.wanted.find((w) => w.ref.questionId === ref.questionId);
  if (existing) {
    if (existing.raisedByMe) return;
    existing.hands += 1;
    existing.raisedByMe = true;
  } else {
    state.wanted = [...state.wanted, { ref, courseCode, hands: 1, raisedByMe: true }];
  }
  emit();
}

export function handsFor(questionId: string): WantedEntry | undefined {
  return state.wanted.find((w) => w.ref.questionId === questionId);
}
