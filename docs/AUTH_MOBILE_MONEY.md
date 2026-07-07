# "Sign in with Mobile Money" — feasibility & design

Goal: a first-class Revl identity where the student's mobile-money wallet
number IS the account — verified real name, payment method attached from
day one. UI already built in `src/app/(auth)/momo.tsx`.

## MTN MoMo (Cameroon) — YES, genuinely possible

Portal: https://momodeveloper.mtn.com (self-serve sandbox; production
keys issued by MTN Cameroon after partner KYC).

Relevant primitives from the MoMo Open API:

1. **Account validation** — `GET /collection/v1_0/accountholder/msisdn/{msisdn}/active`
   → confirms the number has an active wallet before we even send an OTP.
2. **Basic KYC** — `GET /collection/v1_0/basicuserinfo/...` (also under
   remittance) → returns the wallet's registered name/DOB. This is how a
   new Revl account gets a **verified real name** without a form.
3. **Consent flow (`bc-authorize`, CIBA-style)** — the MoMo API's OAuth
   2.0 backchannel flow: we POST the user's number with `scope=profile`,
   MTN pushes a **USSD approval prompt to the student's phone**, they
   approve on-device, we exchange `auth_req_id` for a token and read
   consented user info. That is functionally "Sign in with MTN MoMo" —
   possession + consent proven by the wallet itself, no SMS needed.
4. **Payments** — `requesttopay` (Collections) reuses the same identity,
   so unlocks are one tap after sign-in.

**Recommended MTN flow:** number → `accountholder/active` check →
`bc-authorize` USSD consent (fallback: SMS OTP) → `basicuserinfo` →
create Revl account { verified name, msisdn, provider: momo }.

## Orange Money (Cameroon) — partial; possession-proof flow

Portal: https://developer.orange.com/apis/om-webpay — the public OM API
for Cameroon is a **merchant Web Payment API**
(`https://api.orange.com/orange-money-webpay/cm/v1/webpayment`, OAuth
client-credentials for the merchant, user confirms payment with a USSD
OTP). There is **no public identity/KYC endpoint** equivalent to MoMo's
`basicuserinfo`.

**Recommended Orange flow:** number → our own SMS OTP (possession
proof) → account created as "phone-verified"; the **name becomes
verified at first payment** (the OM payment confirmation webhook carries
the payer identity). Same UI, slightly later verification milestone.

## Product framing

- One button: **Continue with Mobile Money** → provider picker.
- MTN path feels magical (approve on your phone, no code to type) —
  lead with it; Orange path is a standard OTP.
- Google/Apple remain required alternatives (App Store rule: if you
  offer third-party login on iOS, Sign in with Apple must be offered).
- Link methods: a Google/Apple account can attach a wallet later from
  the unlock flow; store one `user`, many `identities`.

## Risks / notes

- Production MoMo keys require an MTN Cameroon partner agreement —
  start that early; sandbox unblocks development immediately.
- `bc-authorize` availability can vary by market; if unavailable in CM
  production, degrade to SMS OTP + `basicuserinfo` (still verified name).
- Never store wallet PINs or initiate anything beyond consented scopes;
  keep OTP attempts rate-limited server-side.
