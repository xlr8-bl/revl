# The "AI insight" line — what engine actually writes it

The violet line above the daily plan ("You marked information-gain as 'I've
got this', then missed it 3× — close that gap first.") looks like a live
model wrote it. It doesn't, and it shouldn't. Here's the real engine.

## Facts are deterministic, not generated

`src/lib/studyBriefing.ts` reduces the reveal log into the line. It ranks:

1. **False confidence** — topics you said "Yes, I could answer this" and
   then marked "Not yet." This is the single highest-value insight because
   it's the gap a student *cannot see themselves*. It leads the sentence.
2. **Weakness** — the topic you lose the most marks on (not-yet share).
   Tied to tonight's plan, which genuinely leads with it.
3. **Progress** — a topic you used to miss and now get right. Named last,
   as earned motivation.

No model is involved in deciding any of this. A language model cannot
invent a weakness you don't have or miss one you do — the truth is in the
tallies. Running an LLM here would add cost, latency, an offline failure
mode, and a hallucination risk, in exchange for nothing, because the facts
are already computed. So on device, instantly, offline, the deterministic
builder is the whole engine today.

## Where an LLM *would* help (later, optional)

One place only: **voice**. The same three facts could be handed to a small
model to rephrase into warmer, more varied prose so the line doesn't feel
templated after a month of daily use:

```
POST /ai/briefing
{ facts: { falseConfidence: {tag:'information-gain', n:3},
           weakest:{tag:'apriori'}, improving:{tag:'entropy'} } }
→ "Entropy's clicking now — nice. But you keep trusting yourself on
   information-gain and getting burned. That's tonight's job."
```

Crucial constraint: the model receives **only the pre-computed facts** and
may only rephrase them. It never sees raw data and never decides what's
true. If the call fails or the student is offline, the deterministic line
(which is always correct) shows instead. The LLM is a garnish on a dish
that's already complete — exactly the same shape as the Question of the Day
(`QUESTION_OF_THE_DAY.md`) and the session engine (`SESSION_ENGINE.md`).

## Honesty rule

Until that voice layer ships, the line is labelled by behaviour, not by a
fake "AI is thinking" flourish, and it stays in an honest cold state
("Still learning how you think…") until there are ~8 reveals to reason
over. No invented personalization on a fresh account.
