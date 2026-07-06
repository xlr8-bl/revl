# Revl

Revise with real past exam papers. A React Native (Expo) app: pure-black
YouVersion-style design system, structured native paper rendering (no PDFs),
a reveal → self-assess → AI-explain loop, and local "Study DNA"
personalization derived from tap tallies.

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android), or press `w` for web.
SF Pro Display is bundled in `assets/fonts/` and loaded at startup.

## Where things live

```
src/
  app/            expo-router routes
    (tabs)/       Home · Papers · Courses · Discover · You
    paper/[id]    PaperReader (structured JSON → native components)
    dna           Study DNA constellation
    wrapped       end-of-semester recap (time-gated)
    wallet        credits ledger (stub)
    notes         notes upload (grounds the AI)
    contribute    upload-to-earn (stub)
    unlock/[id]   mobile-money paywall (MTN MoMo / Orange Money, stub)
    predicted/    predicted-paper placeholder
  components/     HeroCard, SessionCard, CategoryTile, FilterChips,
                  FloatingTabBar, QuestionBlock, ExplainSheet,
                  ConfidencePill, DiagramView, MathRichText, …
  theme/          design tokens (colors, type scale, spacing, radii)
  data/           ALL mock data — swap these to wire the backend
  lib/            RevealLog store (SQLite) + Study DNA selectors + gates
  types/          Paper / Question / RevealLog / ExplainResponse / …
```

## Swapping in real data

Everything the UI renders comes from `src/data/`:

| File               | Replace with                                              |
| ------------------ | --------------------------------------------------------- |
| `data/papers.ts`   | fetched structured-paper JSON (schema in `types/index.ts`) |
| `data/courses.ts`  | course/faculty catalogue                                   |
| `data/home.ts`     | question of the day + daily session (derive via `lib/selectors.buildDailySession`) |
| `data/ai.ts`       | real AI calls — `explainQuestion`, `askAboutQuestion`, `getDailyBriefing` keep their signatures |
| `data/user.ts`     | auth user + credit ledger                                  |
| `data/notes.ts`    | uploaded-notes index                                       |
| `data/wrapped.ts`  | derive from the RevealLog table at term end                |
| `data/config.ts`   | `semesterEndDate` drives the Wrapped time gate             |

The reveal loop already writes real rows to a local SQLite table
(`lib/revealLog.ts`); all personalization (weak topics, false confidence,
daily session, nemesis, prerequisite edges) is derived from it in
`lib/selectors.ts`. Demo seed rows are inserted on first run —
remove `seedDemoDataIfEmpty()` in `src/app/_layout.tsx` for production.

Math rendering: `components/MathRichText.tsx` prettifies inline LaTeX to
Unicode; swap its math span for a KaTeX renderer when full coverage is needed.
