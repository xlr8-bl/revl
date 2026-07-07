import type { ChatMessage, ExplainResponse, Question } from '../types';

/**
 * Mock AI layer — NotebookLM-style, grounded in the student's notes.
 *
 * When the backend is wired, `explainQuestion` becomes a single API call:
 *   POST /ai/explain { questionId, courseCode }
 * The server does per-question RAG over the student's uploaded notes and
 * returns exactly this ExplainResponse shape (including the structured
 * prerequisite-tag tail, which the client logs into RevealLog).
 */

const cannedExplanations: Record<string, ExplainResponse> = {
  q1: {
    answer:
      'Entropy $H(S)$ measures how *mixed* the class labels in a set are. $H(S) = -\\sum_i p_i \\log_2 p_i$. When $H(S) = 0$, the set is pure — every example has the same label, so that branch of the tree is finished.',
    why:
      'This question is really testing whether you understand **impurity as the driver of tree-building**. ID3 exists to reduce entropy step by step; if you know what $H = 0$ *means*, information gain (which is just "entropy before minus entropy after") follows for free.',
    notesBridge: {
      text: 'This connects directly to what you wrote on p.12 about "uncertainty in a coin flip" — your own example of a fair coin having entropy 1 bit is exactly the intuition the examiner wants. You already have half of this.',
      reference: { source: 'notes', label: 'Your notes, p.12 — "Entropy & impurity"', location: 'notes://cec420/p12' },
    },
    prerequisiteTags: ['logarithms', 'probability-basics'],
  },
  q2bi: {
    answer:
      'Compute the entropy of each branch, weight each by its share of the examples, subtract from $H(S)$: $IG = 0.940 - [\\frac{8}{14}(0.811) + \\frac{6}{14}(1.0)] = 0.048$ bits.',
    why:
      'Information gain is where most marks are lost in this course — not because the idea is hard, but because the arithmetic has three places to slip: the branch entropies, the weights, and the final subtraction. The examiner awards method marks for each stage, so *show the weighted sum explicitly*.',
    notesBridge: {
      text: 'On p.14 you worked this exact weather dataset but stopped after the branch entropies — the weighted-average step is the piece your notes are missing. Add one line and this becomes routine.',
      reference: { source: 'notes', label: 'Your notes, p.14 — worked entropy example', location: 'notes://cec420/p14' },
    },
    prerequisiteTags: ['entropy', 'logarithms', 'weighted-averages'],
  },
};

const genericExplanation = (q: Question): ExplainResponse => ({
  answer:
    q.answers.verified ??
    q.answers.aiGeneral ??
    'Work from the definition: identify what the question is really asking, write the governing formula, substitute, and interpret the result in one sentence.',
  why: `This question sits inside **${q.topics[0] ?? 'the core syllabus'}** — examiners use it to check you can move from definition to computation without prompting. Questions tagged ${q.topics.join(', ')} appear in some form almost every year.`,
  // No notesBridge here — this simulates "no relevant notes found".
  // The UI must skip the bridge silently; never break for a note-less user.
  prerequisiteTags: q.topics.slice(0, 2),
});

/** Mocked explain call. Replace body with the real API call later. */
export async function explainQuestion(q: Question): Promise<ExplainResponse> {
  await new Promise((r) => setTimeout(r, 900)); // simulate network + generation
  return cannedExplanations[q.id] ?? genericExplanation(q);
}

/** Mocked per-question chat (RAG scoped to one question + the student's notes). */
export async function askAboutQuestion(q: Question, userMessage: string): Promise<ChatMessage> {
  await new Promise((r) => setTimeout(r, 800));
  return {
    id: `a-${Date.now()}`,
    role: 'assistant',
    text: `Good question. For Q${q.number}, focus on ${q.topics[0] ?? 'the definition'} first — "${userMessage.slice(0, 60)}" usually comes down to applying the formula carefully and interpreting the result. (Mock reply — this will be grounded in your uploaded notes once the AI is wired.)`,
  };
}

/**
 * Mock daily briefing — one small AI call turns raw Study DNA tallies
 * into a human line. Real version: POST /ai/briefing { topicStats }.
 */
export function getDailyBriefing(hasEnoughData: boolean): string {
  if (!hasEnoughData) {
    // Honest early state, before there's data to personalize with.
    return 'Still learning how you think. The more you revise, the sharper this gets.';
  }
  return 'You keep losing marks on definition-style questions. Three of tonight’s five target exactly that. Your information-gain work is clean now, so I’ve eased off it.';
}
