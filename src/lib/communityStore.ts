/**
 * Community store — the department room's local state. Same pattern as
 * revealLog: module state + useSyncExternalStore, mock-seeded, fully
 * interactive (like, comment, share, raise hand) so the UX is real
 * before the backend. Rooms are keyed `school:departmentId` server-side.
 *
 * Interaction model (unified per the design):
 *   ♥ Like  — the single tap that matters.
 *     · on an ASK   → your like IS your raised hand (adds to demand)
 *     · on a SOLVE  → your like is a "found this useful" vote (drives
 *                     the community-verified threshold)
 *   💬 Comment — real threaded replies, stored per post.
 *   ↗ Share    — hands off to the OS share sheet; counted.
 */
import { useSyncExternalStore } from 'react';

export type QuestionRef = { paperId: string; questionId: string };

export type Comment = {
  id: string;
  author: { name: string; initial: string; color: string };
  text: string;
  time: string;
};

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
  /** ♥ count. On asks this is the raised-hand demand; on solves it's usefulness. */
  likes: number;
  likedByMe?: boolean;
  comments: Comment[];
  shares: number;
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
      likes: 47,
      comments: [
        { id: 'c1', author: { name: 'Melissa', initial: 'M', color: '#FF8FA3' }, text: 'This finally made it click, thank you!', time: '1h' },
        { id: 'c2', author: { name: 'Tantoh', initial: 'T', color: '#5EEAD4' }, text: 'Wait so the confidence is 3/3? Let me redo mine.', time: '48m' },
      ],
      shares: 6,
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
      likes: 18,
      comments: [
        { id: 'c3', author: { name: 'Grace', initial: 'G', color: '#F2A93B' }, text: 'The 8/14 is the share of rows in that branch. Weight each entropy by its branch size.', time: '3h' },
      ],
      shares: 1,
      level: 'L400',
      time: '5h',
    },
    {
      id: 'p3',
      kind: 'ask',
      author: { name: 'Tantoh', initial: 'T', color: '#5EEAD4', level: 'L300' },
      text: 'Does anyone have the 2022 marking guide? Prof said the confusion matrix question repeats almost every year.',
      courseCode: 'CEC420',
      likes: 9,
      comments: [],
      shares: 0,
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
      likes: 21,
      comments: [
        { id: 'c4', author: { name: 'Brandon', initial: 'B', color: '#7EA8FF' }, text: 'Clean. The F1 shortcut saves so much time.', time: '20h' },
      ],
      shares: 2,
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

export function addPost(post: Omit<CommunityPost, 'id' | 'likes' | 'comments' | 'shares' | 'time'>) {
  state.posts = [
    { ...post, id: `p-${Date.now()}`, likes: 0, comments: [], shares: 0, time: 'now' },
    ...state.posts,
  ];
  emit();
}

/** Adjust a question's raised-hand tally (shared by likes and the reader). */
function adjustHands(ref: QuestionRef, courseCode: string, delta: number, mine: boolean) {
  const existing = state.wanted.find((w) => w.ref.questionId === ref.questionId);
  if (existing) {
    existing.hands = Math.max(0, existing.hands + delta);
    existing.raisedByMe = mine;
  } else if (delta > 0) {
    state.wanted = [...state.wanted, { ref, courseCode, hands: delta, raisedByMe: mine }];
  }
}

/**
 * Toggle a like. On an ask post the like is a raised hand, so it moves
 * the question's demand tally with it. On a solve it is a usefulness vote.
 */
export function toggleLike(postId: string) {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return;
  const nowLiked = !post.likedByMe;
  post.likedByMe = nowLiked;
  post.likes = Math.max(0, post.likes + (nowLiked ? 1 : -1));
  if (post.kind === 'ask' && post.questionRef && post.courseCode) {
    adjustHands(post.questionRef, post.courseCode, nowLiked ? 1 : -1, nowLiked);
  }
  state.posts = [...state.posts];
  emit();
}

/** Double-tap always likes (never unlikes), IG-style. */
export function likeOn(postId: string) {
  const post = state.posts.find((p) => p.id === postId);
  if (post && !post.likedByMe) toggleLike(postId);
}

export function addComment(postId: string, text: string, author: Comment['author']) {
  const post = state.posts.find((p) => p.id === postId);
  if (!post || !text.trim()) return;
  post.comments = [...post.comments, { id: `c-${Date.now()}`, author, text: text.trim(), time: 'now' }];
  state.posts = [...state.posts];
  emit();
}

export function sharePost(postId: string) {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return;
  post.shares += 1;
  state.posts = [...state.posts];
  emit();
}

/** Raise a hand directly (the paper reader's explicit affordance). */
export function raiseHand(ref: QuestionRef, courseCode: string) {
  const existing = state.wanted.find((w) => w.ref.questionId === ref.questionId);
  if (existing?.raisedByMe) return;
  adjustHands(ref, courseCode, 1, true);
  emit();
}

export function handsFor(questionId: string): WantedEntry | undefined {
  return state.wanted.find((w) => w.ref.questionId === questionId);
}
