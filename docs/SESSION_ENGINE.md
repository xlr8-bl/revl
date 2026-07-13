# Session engine — what runs "Weak Topic Warm-up" and "Reveal & Review"

The daily plan cards are now real queries (`src/lib/studySessions.ts`),
not mocks. This doc explains the production system behind them — and
tackles the hard problem underneath: **the AI does not know what a topic
is.** Left free-form, an LLM will tag one question "entropy", the next
"Shannon entropy", the next "information theory basics" — three names,
one topic, and every downstream feature (weakness scores, warm-ups,
prerequisite maps) silently fragments.

## 1. Topics are a closed vocabulary, not AI free-text

Every course gets a **controlled topic vocabulary** — a short list
(15–40 entries) of canonical tags like `information-gain`,
`association-rules`, `gradient-descent`. It is built once per course at
ingestion time:

1. **Draft**: an LLM pass over the course's syllabus (when we have it)
   and ALL of its past-paper questions proposes a topic list, merging
   near-duplicates by embedding similarity ("info gain" and "IG
   computation" cluster together).
2. **Human confirm**: the reviewer approving the course's first paper
   also approves its vocabulary — rename, merge, split. Takes minutes;
   happens once.
3. **Frozen with aliases**: after that the vocabulary is a fixed enum.
   New synonyms become *aliases* of existing tags, never new tags,
   unless a human adds one.

## 2. Tagging questions: constrained choice, not generation

When a new paper is ingested, the LLM tags each question by **choosing
from the course's vocabulary** (a classification call with the enum in
the prompt — it cannot invent strings). Each tag comes with a
confidence; low-confidence tags route to the same human review queue as
everything else (`PAPER_REVIEW.md`). So a tag in production is either
high-confidence machine choice from a human-approved list, or a human
decision.

This is why the client-side engines can be dumb and fast: by the time a
question reaches the app, `topics: ['information-gain']` is trustworthy
enough to do arithmetic on.

## 3. The sessions themselves: deterministic queries

No runtime LLM. Both sessions are selectors over two local tables — the
topic-tagged catalogue and the student's reveal log:

**Weak Topic Warm-up** — practice where you're weak, before exams do it
for you:
- Candidates: questions from enrolled courses, not attempted in the
  last 24h.
- Ranked by the weakness of their weakest tag (not-yet share, nudged by
  false confidence — the existing Study DNA math).
- **Coverage cap: max 2 questions per topic**, so one terrible topic
  doesn't monopolise the session. Up to 5 questions.

**Reveal & Review** — spaced re-attempts of what beat you:
- Candidates: questions whose *last* resolution was "not-yet".
- Not re-served within 24h of the miss (cramming the same question
  minutes later measures memory, not understanding).
- Oldest debt first, 3 per day. Server phase upgrades the ladder to
  full FSRS-style intervals (1d → 3d → 7d → exam-proximity override).

**Cold start** (zero reveals — a brand-new account): one honest
"Starter session" card pointing at the first questions of the newest
paper in their enrolled courses, labelled "attempt, then reveal — this
builds your Study DNA". The briefing line stays in its honest early
state ("Still learning how you think…") until ~8 reveals exist. No fake
personalization on day one.

## 4. Where the AI layer actually is

| Job | Layer | Why |
|---|---|---|
| Define what topics exist | LLM draft → human approve, once per course | Taxonomy errors poison everything downstream |
| Tag each question | LLM constrained-choice + confidence gate | Cheap classification, human catches the tail |
| Pick tonight's questions | Deterministic selector, on device | All the signal is in the reveal log; LLM adds nothing |
| Explain a revealed answer | LLM with RAG over the student's notes | This is where generation genuinely helps |
| Write the briefing line | One small LLM call over topic tallies | Turns numbers into a human sentence; harmless if imperfect |
