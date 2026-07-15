# Friends & privacy — the visibility contract

Exam prep is personal. An app the whole class uses is one bad joke away
from someone screenshotting "Ashley studied 4 hours last night" — or
worse, "Ashley has barely opened the app." Either one is ammunition for
teasing, and either one makes people quit. So the rule is simple and
absolute:

**Friends see what you PUBLISH. Never what you PRACTISE.**

## Visible to friends (deliberate, public acts)
- Papers you upload (already public — the whole class gets them)
- Answers you verify / solutions you post in the room
- Questions you ask the room
- Your name, username, avatar, department, level

## Never visible to anyone
- Sessions started or finished, reveal counts, got-it/not-yet ratios
- Streaks, minutes studied, "last active", time of day you study
- Weak topics, Study DNA, nemesis questions, Wrapped
- Whether you've even opened the app this week

There is no "activity status", no read receipts, no leaderboard of
effort. The class leaderboard that does exist ("Top solvers") counts
published solutions — work you chose to show — not study time.

## Why not opt-in sharing of study stats?

Opt-in sounds harmless but creates social pressure in a cohort app: once
half the class shares streaks, *not* sharing becomes the signal. The
only way nobody can be teased for their number is if nobody has a
number. Study data exists for exactly one audience: the student's own
Study DNA and plan.

## What this means in code
- `communityFeed` / friend notifications may only carry upload,
  verify, post and ask events (`src/lib/notificationSeeds.ts` states the
  rule; the server pipeline enforces it at the event source).
- The reveal log never leaves the device except as anonymous aggregate
  counts ("312 attempts on this question") that are never attributable.
- The friends screen carries the contract in-product ("What friends can
  see"), so the promise is visible where friending happens.
