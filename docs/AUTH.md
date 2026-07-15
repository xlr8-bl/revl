# Authentication — Google, Apple, Mobile Money (Supabase-ready)

How sign-in works and, crucially, what each provider actually gives us and
when — so onboarding never re-asks what we already know, and so wiring
Supabase later is a mechanical swap. The app currently mocks the providers
with a `ProviderIdentity` shaped exactly like the real Supabase user.

## What each provider returns

| | Google | Apple | Mobile Money |
|---|---|---|---|
| Stable id (`sub`) | ✅ every sign-in | ✅ every sign-in | wallet number |
| Email | ✅ verified | ✅ — but a `@privaterelay.appleid.com` relay if the user hid it | ❌ (none) |
| Full name | ✅ every sign-in | ⚠️ **first authorization only, once** — from the native dialog, not the token | ❌ |
| Photo | ✅ `picture` URL | ❌ never | ❌ |

The two things that bite people:

1. **Apple only gives the name once.** The identity token has no name; the
   native dialog returns it **only on the very first authorization**. If you
   don't capture and persist it then, it's gone until the user removes the
   app from their Apple-ID settings and re-authorizes. So: capture on first
   auth, save immediately, never rely on the token for it.
2. **Apple emails may be private relays.** Store and use them as-is — they
   deliver through Apple's relay (needs the relay/sender domain configured
   in the Apple Developer account). Don't treat a relay as invalid.

## The flow (production, per step)

1. Welcome → tap provider → native dialog returns an `id_token`
   (+ Apple: `fullName` on first auth only).
2. `supabase.auth.signInWithIdToken({ provider, token, nonce })` → session +
   `auth.users` row. The **nonce is required** for native id-token sign-in
   (generate a random nonce, pass its SHA-256 to the provider, the raw one
   to Supabase).
3. **Apple first-auth only:** immediately
   `supabase.auth.updateUser({ data: { full_name, given_name, family_name } })`
   from the native credential — the token can't carry it.
4. **New vs returning** is decided by looking up a `profiles` row for
   `user.id` (a DB trigger can seed it from `raw_user_meta_data`) — NOT by
   trusting the token. Returning + complete → into the app; missing/incomplete
   → onboarding.
5. **Onboarding prefills, never re-asks what we have:**
   - name ← Google `full_name` / captured Apple name / else blank → ask
   - email ← `user.email` (relay allowed)
   - avatar ← Google `picture` / else the default photo or an upload
   - **username** ← neither provider gives one → always ask, suggested from
     the email local-part
6. Finish → write the `StudentProfile` to `profiles` keyed by `user.id`.

## Edge cases (all handled, not assumed)

- **Apple returning user with no stored name** (reinstall, revoked, or we
  failed to save first time): token has no name → onboarding asks. Never
  fabricate.
- **Private-relay email:** stored, flagged, kept — it's deliverable.
- **Google `picture` rotates/expires:** store `avatar_url` but always allow
  a manual upload; may re-copy on each sign-in.
- **`email_verified = false`** (rare for Google): allow, mark unverified.
- **User cancels the dialog:** back to welcome, no session created.
- **Same person, Google then Apple:** different `sub` and possibly different
  email (Google real vs Apple relay) → potential duplicate. Identity linking
  (Supabase "link identities" or manual by verified email) is a deliberate
  backend decision — never silently merge.

## Field mapping (mock → Supabase → profile)

| `ProviderIdentity` (mock, `lib/session.ts`) | Supabase source | `StudentProfile` column |
|---|---|---|
| `providerUserId` | `auth.users.id` (`sub`) | row key / `profiles.id` |
| `email` | `auth.users.email` | `email` |
| `emailIsPrivateRelay` | `user_metadata.is_private_email` | `emailIsPrivateRelay` |
| `fullName` | `user_metadata.full_name` (Google) / captured Apple name | `name` (editable) |
| `avatarUrl` | `user_metadata.avatar_url` / `picture` | `avatarUri` (until replaced) |
| `provider` | `app_metadata.provider` | `authProvider` |

When Supabase is wired, only `signIn()` in `lib/session.ts` changes: replace
`mockIdentity()` with the real `signInWithIdToken` result mapped into
`ProviderIdentity`. Everything in onboarding already reads that shape.

## Mobile Money

No provider identity (no email/name/photo), so onboarding asks for the name
and offers an **optional recovery email + backup phone** (so a lost SIM
doesn't lose the account). The wallet number itself is the login handle.
