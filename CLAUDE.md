# Revl

Exam prep for Cameroonian university students: real past papers from the
University of Buea and the HND national programme, worked and explained.

## Writing rules

**Never use em dashes or en dashes.** Not in UI copy, not in code comments, not
in commit messages, not in docs, not in chat. They are the clearest tell of
machine written text. Use a full stop, a comma, a colon, or brackets instead,
and if a sentence only holds together with a dash, split it in two.

Also avoid:

* Hyphenated interjections used as connectors, which are the same habit wearing
  a different hat.
* "It's not just X, it's Y" and other rhetorical seesaws.
* Piling three adjectives where one carries the meaning.

Write UI copy the way a person would say it out loud to a student. Short, plain,
specific. No emojis anywhere in the interface.

## Product rules that keep being got wrong

* **Never invent course titles.** If a title is not published, show the course
  code alone and say the title is pending confirmation.
* **Carry over courses are per semester.** A failed first semester course is
  re sat in the first semester of the following year, never in a second
  semester sitting.
* **Semester and exam date are one derived fact**, computed from the calendar in
  `src/lib/academic.ts`, never two questions the student can answer
  inconsistently. August counts as the run up to first semester.
* **Money is real money.** Balances are in FCFA. There are no coins or credits.

## Conventions

* Theming goes through `colors` and `themedStyleSheet` in `src/theme`. Screens
  call `useThemeVersion()` once so the subtree re-reads the live palette.
* Stores are plain modules over `useSyncExternalStore`, persisted to
  AsyncStorage. See `src/lib/session.ts` for the shape to copy.
* Run `npx tsc --noEmit` before committing.
