# ParentScript Platform — Extension Blueprint

> Drafted by Gary (builder), 2026-06-30.
> Status: v0 — open for Mira, Ezra, Dov review.
> Goal: identify adjacent surfaces that share the same clinical-safety
> rail and the same "in-the-moment coaching" shape, so we can ship
> them in series with minimal incremental cost.

## The shared shape

Every surface in this family has three rails:

1. **Clinical safety rail** — `api/safety-guard.mjs` (Mira-authored).
   Triggers, verbatim crisis response, scope-of-practice, locale registry.
   Works in any language once Mira signs off the translation.
2. **In-the-Moment coaching rail** — streaming LLM response with the
   standard empathy → steps → safetyNote shape. `crisisResponsePayload`
   swaps in for any flagged input.
3. **Evidence-based scripts rail** — skill cards, leveled L1–L5, with
   age adaptations. The skill _content_ is the surface-specific bit.
   The _infrastructure_ is shared.

What changes per surface is the **script library** (different modalities
in the citation), the **user role** (parent / teen / partner), and the
**clinical review layer** (parenting therapist / school counselor /
couples therapist).

## Surfaces in the family

| Surface                      | User                                         | Script modality                                           | Lead review                    | Build cost | 0-to-1 status                |
| ---------------------------- | -------------------------------------------- | --------------------------------------------------------- | ------------------------------ | ---------- | ---------------------------- |
| **ParentScript** (live)      | Parent of child 0–13                         | PCIT, BPT, CPS, Triple P, Circle of Security              | Mira (parenting psych)         | shipped    | **LIVE at parentscript.app** |
| **SiblingSupport** (next)    | Teen 13–18, supporting a sibling in distress | Active listening, validation, I-statements, de-escalation | Mira + school counselor review | ~1 day     | **build this next**          |
| **CouplesCompanion** (later) | Partner in a relationship                    | Gottman, EFT, attachment, nonviolent communication        | Couples / family therapist     | ~3 days    | design only                  |
| **CaregiverCoach** (later)   | Adult child of elderly parent                | Validation, boundary-setting, self-care                   | Geriatric psych                | ~3 days    | design only                  |
| **TeacherAid** (later)       | K-12 teacher in classroom                    | Restorative practice, de-escalation, trauma-informed      | School psych                   | ~5 days    | design only                  |

## Why SiblingSupport first

**Demand signal (qualitative, Dov's network):** teens are increasingly
the first-responder for siblings in distress — older siblings of
trans kids, neurodivergent siblings, siblings of parents in crisis.
There's no good product for this. Adult-facing crisis rails (988)
exist. School counselors exist. But the _peer_ moment — when a 16-year-old
is sitting with their 13-year-old brother who just said something scary —
is unaddressed.

**Supply fit (us):**

- The clinical safety rail already has SUICIDAL_CHILD and SELF_HARM
  categories; we just surface them to a teen audience.
- The In-the-Moment rail is _already_ designed for a single user typing
  a paragraph; a teen describing a sibling's behavior is structurally
  identical.
- Mira is the right reviewer (developmental psychology, family systems).
- The Capacitor app we shipped already does iOS/Android + PWA; same
  bundle, different `/sibling/*` route.

**Risk if we wait:** every quarter we delay, that's a quarter of teens
talking to ChatGPT without a safety rail. The ParentScript safety work
is _exactly_ what's needed for this. Shipping it is a moral move, not
just a product move.

## SiblingSupport v0 scope

What ships:

- `/sibling` marketing landing — analog to `/` (parentscript Home)
- `/sibling/app` coach page — analog to `/app/InTheMoment` but with
  a sibling-voice prompt and a sibling-script library
- Same `api/coach` endpoint, gated on a `surface: 'sibling'` parameter
  that selects a different system prompt
- Same `api/safety-guard.mjs` (the categories are identical; child-SI
  is the dominant one)
- Different scope-of-practice disclosure:
  "SiblingSupport is a peer support tool, not counseling or therapy.
  It's not a crisis service. If you or your sibling are in crisis,
  call 988, text HOME to 741741, or call 911."

What does NOT ship in v0:

- Direct messaging / 1:1 chat (out of scope; we are not building a
  social network)
- Parental dashboard (we are not the parent in this surface)
- Therapist-side unlock (sibling support is peer-to-peer, not
  clinical-to-client)

## CouplesCompanion v0 design notes (defer)

- Same rails, but `surface: 'couple'` and a different scope
  disclosure (relationship advice, not parenting advice)
- Categories to add: ESCALATION (active conflict), GASLIGHTING,
  ISOLATION_BY_PARTNER
- Mira is NOT the right reviewer for couples — need a couples /
  family therapist. Two-week vendor review before shipping.
- Estimated build: 3 days once reviewer is locked.

## CaregiverCoach v0 design notes (defer)

- For adult children of elderly parents
- Categories to add: BURNOUT_CAREGIVER, GRIEF_ANTICIPATORY,
  DEMENTIA_RELATED_DISTRESS
- Build cost: 3 days, geriatric psych review

## TeacherAid v0 design notes (defer)

- For K-12 teachers
- Categories to add: CLASSROOM_ESCALATION, MANDATORY_REPORTING_HINT,
  TRAUMA_RESPONSE_IN_CHILD
- HIGH regulatory load (FERPA, mandatory reporting laws vary by state)
- Build cost: 5 days + legal review, defer until sibling ships

## Shared infrastructure we get for free

By building all five surfaces on the same Capacitor app + same Express
API, we get:

- One iOS build, one Android build, one PWA → ship to all platforms
- One Supabase project (multi-tenant via RLS) → one auth, one DB
- One Stripe account (5 products, separate SKUs)
- One safety-guard module → one set of patterns, one test suite
- One CI pipeline
- One vercel deploy

Per-surface marginal cost drops to ~1 day of script curation +
Mira review + marketing landing.

## Sequencing

1. ✅ ParentScript live (parentscript.app, iOS, Android, PWA)
2. 🔨 SiblingSupport v0 (next sprint)
3. CouplesCompanion (after SiblingSupport ships, ~2 weeks)
4. CaregiverCoach (after CouplesCompanion, ~2 weeks)
5. TeacherAid (after CaregiverCoach, ~3 weeks — regulatory)

## Open questions for Dov

- Should SiblingSupport be a separate App Store listing, or a tab
  inside the existing ParentScript app? (Recommend: separate listing
  for teen-audience trust; "this isn't a parenting app, this is
  for me and my sibling")
- Should SiblingSupport be free in v0 to seed adoption, or paid from
  day 1? (Recommend: free, gated to 1/day, mirror ParentScript's
  1/day free tier; upgrade to $4.99/mo pro after 90 days)
- Do we want to license the safety rail (with Mira's sign-off) to
  other coaching/therapy apps as a B2B line? (Recommend: explore in
  2027 once we have 5 surfaces of proof)
