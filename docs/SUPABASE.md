# Supabase

The backend is driven by the **Supabase CLI**, not an MCP server. Everything
about the database lives in `supabase/migrations/` and is applied with
`supabase db push`, so the schema is reviewable in a diff and reproducible from
an empty project.

## One-time setup

The CLI is a devDependency, so `npx supabase` is the pinned version.

1. **Get a personal access token** — https://supabase.com/dashboard/account/tokens

   ```sh
   export SUPABASE_ACCESS_TOKEN=sbp_...
   ```

   In Claude Code on the web, set this in the environment's variables so
   sessions can run the CLI without pasting it into the transcript.

2. **Link the repo to the project** (`SUPABASE_PROJECT_REF` is the ref in your
   dashboard URL, `https://supabase.com/dashboard/project/<ref>`):

   ```sh
   export SUPABASE_PROJECT_REF=<ref>
   npm run db:link
   ```

3. **Apply the schema:**

   ```sh
   npm run db:push
   ```

## Day to day

| Command | What it does |
| --- | --- |
| `npm run db:push` | Applies pending migrations to the linked project |
| `npm run db:diff <name>` | Writes the drift between the project and the migrations into a new migration file |
| `npm run db:types` | Regenerates `src/lib/db/schema.ts` from the live schema |

Never edit an already-pushed migration — add a new one. `db:diff` exists so
changes made by clicking around in the dashboard can be captured back into the
repo rather than silently diverging.

## App keys

The client needs the project URL and the **publishable** key (`sb_publishable_…`,
or the legacy `anon` key). Both are safe to ship in the bundle — row-level
security is what protects the data, and every table here has it enabled. Put
them in `app.json` under `expo.extra`, or as `EXPO_PUBLIC_` env vars.

The `service_role` key must never reach the app. It bypasses RLS entirely.

## Schema

`supabase/migrations/20260808120000_initial_schema.sql`

- **`profiles`** — one row per `auth.users` row, field-for-field with
  `StudentProfile` in `src/lib/session.ts`. Created automatically by the
  `on_auth_user_created` trigger with whatever the provider gave us, then
  overwritten by onboarding.
- **`enrollments`** — the selected courses, with `is_carryover` and the
  `semester`/`academic_year` a course was taken in.
- **`username_available(text)`** — a `security definer` function, because
  onboarding must answer "is @handle free?" before the row exists and RLS
  correctly hides everyone else's profile. Usernames are `citext`, so
  `@Ashley` and `@ashley` cannot both be claimed.
- **RLS** is on for both tables; a student can read and write only their own
  rows.

### Why there is no `recovery_email` column

The onboarding recovery step promises a confirmation link, and a column cannot
send one. The recovery email goes through Supabase Auth itself:

```ts
await supabase.auth.updateUser({ email: recoveryEmail });
```

Supabase sends the confirmation, and once the student clicks it the address
becomes a real second identity on the account — they can actually sign in with
it after losing the SIM. Storing the string in a table would have looked
identical in the UI and recovered nobody.

`recovery_phone` *is* a plain column: it is a human fallback for support, not a
sign-in factor, and it is deliberately not the number used to sign in.

### Provider data

What Google and Apple actually hand over, and when, is in
[`AUTH.md`](./AUTH.md). The short version the schema depends on: Apple sends the
student's name **only on the very first authorization** — which is why
`handle_new_user` reads it at insert rather than waiting for a later save — and
Apple emails may be `@privaterelay.appleid.com`, flagged as
`email_is_private_relay`.

## Not modelled yet

The FCFA wallet and unlock ledger. Balances have to be server-authoritative
with the write path in a transaction or an edge function; a table with an RLS
policy letting the client update its own balance is a wallet anyone can top up
for free. It is left out rather than half-built.
