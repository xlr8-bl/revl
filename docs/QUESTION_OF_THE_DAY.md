# Question of the Day — the system behind the hero card

The daily question is Revl's strongest engagement loop: one well-chosen
question, every day, that feels hand-picked for *you*. This doc answers
"what layer runs this — an LLM?" with the production design. Short answer:
**selection is deterministic and cheap; the LLM only generates new material,
and never without human review.**

## 1. Targeting: enrolled courses, not the department

Each student's pool is built from their **enrolled course set**, not their
department. This matters because departments split unofficially — in
Computer Engineering, networking-track and software-track students sit the
same department but take different electives. There is no "track" field to
model and nothing to configure: a networking student enrolls CEC406, a
software student enrolls CEC420, and each automatically gets questions from
the papers they will actually be examined on.

## 2. Candidate pool

Extracted questions from past papers of the enrolled courses. Every
question in the paper JSON is already topic-tagged by the ingestion
pipeline (see `PAPER_PIPELINE`), so the pool arrives pre-labelled — no
runtime NLP.

## 3. Selection: deterministic score, no LLM

For each candidate question, computed on device today and server-side in
the nightly batch later:

```
score = topicWeakness × 10        // Study DNA: not-yet share on the tag,
                                  // nudged up by false confidence
      + staleDays × 0.5           // spaced repetition: days since the topic
                                  // was last seen (capped), FSRS-flavored
      + dateSeededHash(day, qid)  // deterministic daily shuffle for ties
```

Rules on top of the score:

- One pick per calendar day; the same question is served all day.
- A 7-day no-repeat window (persisted history of picks).
- **Cold start** (no reveal logs yet): weakness terms are zero, so the
  date-seeded shuffle rotates fairly through the pool; server phase
  upgrades this to "most-attempted question in your department."

Why not an LLM for selection: selection is a ranking problem over
structured data we already have. An LLM adds cost, latency, and
non-determinism, and gives nothing back — the interesting signal (weakness,
recency, exam proximity) is all in the reveal log.

## 4. Where the LLM actually fits: generation, behind review

Research on retrieval practice with LLM-generated questions is promising
(recall lifted ~89% vs ~73% in recent classroom studies), but raw LLM
output has a known error rate that is unacceptable for exam prep. So the
LLM layer is a **content factory, not a decision maker**:

1. Nightly job proposes *variants* of high-demand questions (same topic,
   new numbers/context) and short explanations for verified answers.
2. Every generated item lands in the same human review queue as uploaded
   papers (see `PAPER_REVIEW.md`) — nothing generated reaches students
   unreviewed.
3. Approved variants join the candidate pool tagged `generated`, and the
   card says so.

## 5. Rollout phases

| Phase | Selection | Pool | Delivery |
|---|---|---|---|
| **Now (MVP, on device)** | `src/lib/questionOfTheDay.ts` — the exact score above over local data | Bundled papers of enrolled courses | Computed on open; pick persisted per day |
| **Server** | Same score, nightly batch per student | Full catalogue + department attempt stats for cold start | Push notification at a per-user quiet-hour ("Tonight's question is ready") |
| **Generation** | Unchanged | + human-approved LLM variants | Unchanged |

The card never invents stats. Instead of a fake "12.4K attempts today," it
states the true reason for the pick: *"Picked for your weak topic:
entropy."* When real attempt counts exist server-side, they can return —
as real numbers.
