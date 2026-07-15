# Sourcing actual papers — findings & what it takes

The question: how hard is it to get the real UB / UBa paper *content*
(questions + solutions), and what do we need? This is the honest answer
after investigating papers.ndetek.com (NdeTek Papers), the largest
Cameroon archive.

## What we already have (free, done)

NdeTek's **catalogue metadata is public and fully harvestable**, and we've
harvested it:

- The sitemap lists **2,534 papers, 251 departments, 33 faculties, 4
  universities** (University of Buea, University of Bamenda, HIBMAT/HUIB
  Buea, Landmark Buea).
- Each department page serves **clean structured JSON**: institution,
  faculty, and every course (code, title, level).
- Each paper page publicly exposes its **university, faculty, department,
  level, semester, course, year** — everything except the questions.

From this we built the complete **University of Buea catalogue** (12
faculties, 95 departments, ~1,270 courses) with real paper-availability
counts per course. UBa/HIBMAT/Landmark can be added the same way (same
scraper, filter by institution) whenever we want them.

## What is NOT free: the paper content itself

The actual questions and worked solutions are **paywalled**:

- Every paper page carries `price: 1050 XAF` (~$1.75), `isAccessibleForFree:
  false`, and a sign-in/purchase gate.
- The question text and solutions are **not** in the page HTML — they load
  only after purchase behind auth.

So the content cannot simply be scraped. Bypassing the paywall would be a
terms-of-service violation and is off the table.

## The realistic ways to get real content

1. **Partner / license with NdeTek.** They already have thousands of
   structured papers + solutions and a payment relationship with students.
   A licensing or revenue-share deal is by far the fastest path to real
   content at scale. Contact is public: info@ndetek.com, +237 683 028 811.
2. **Buy the papers we need.** At ~1,050 XAF each, seeding the top ~200
   most-wanted UB courses is on the order of 200k XAF (~$350) one-off —
   cheap for a launch content set, if their terms permit redistribution
   inside another app (needs their written OK — otherwise it's personal-use
   only).
3. **Our own crowd-sourced pipeline (already designed).** Students upload
   photos of their papers → OCR/structuring → human review → credits
   (`docs/PAPER_PIPELINE.md`, `docs/PAPER_REVIEW.md`). This is the
   defensible long game: content we own, contributors we reward, no
   dependency on a third party. It's slower to reach breadth but it's the
   moat.

## Recommendation

Ship on the **complete catalogue** now (done) so every student sees their
real courses and how many papers exist. In parallel, open a licensing
conversation with NdeTek for breadth, and run the crowd-sourced pipeline
for ownership. Do **not** scrape their paid content — catalogue metadata is
fair game and gives us the shelf; the books come from a deal or from our
own contributors.
