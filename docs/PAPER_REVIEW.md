# Paper review — who checks uploaded papers before they go live

Students upload photos/PDFs of past papers and earn credits when the paper
is accepted. This doc answers "what is going to review those papers?" —
the answer is an AI layer for the mechanical checks with a **human gate
before anything is published or paid**.

## Pipeline

### 1. Automated checks (instant, on upload)

- **Extraction confidence** — the OCR/structuring pass (see
  `PAPER_PIPELINE`) reports per-question confidence; a paper below
  threshold is bounced back with "photos too blurry" instead of entering
  the queue.
- **Duplicate detection** — near-duplicate text match against the existing
  catalogue (same course + year + question overlap) so the same 2019 paper
  can't be minted twice.
- **Course-code validation** — the claimed course must exist in the
  UB/HND catalogue; level and semester sanity-checked against it.

Failing uploads never reach a human; the uploader gets a specific fix-it
message.

### 2. Human review queue (the gate)

Everything that passes the checks lands in a lightweight review dashboard
(server phase; founder-operated at first, trusted senior students later):

- Side-by-side: original photos vs extracted, structured questions.
- Approve / fix-and-approve / reject with a reason the uploader sees.
- Approval **publishes the paper and mints the uploader's credits** in one
  action — credits are never minted by the automated layer, so the reward
  can't be gamed by spam uploads.
- Matching notification (already in the app's engine): *"You earned 2
  credits — your CEC406 upload passed review."*

### 3. Community verification (after publication)

Answers keep improving after release through the existing room mechanics:
solve posts that cross the vote threshold become the paper's "verified by
top student" answer, and disputed extractions can be flagged from the
reader, which reopens the paper in the review queue.

## Why this shape

- AI does what it is reliable at (OCR confidence, duplicates, catalogue
  checks) and drops garbage early.
- A human owns the two irreversible actions: publishing content students
  will trust the night before an exam, and paying credits.
- The queue is the same one LLM-generated question variants flow through
  (`QUESTION_OF_THE_DAY.md` §4), so there is exactly one review surface.
