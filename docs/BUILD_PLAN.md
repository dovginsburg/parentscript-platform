# Build Plan — Therapist-Controlled Parenting Skills App (working name: TBD)

**Audience for this doc:** Claude Code (the builder) + Dov/Ariella (decision-makers).
**Status:** MVP spec. Opinionated. Where a decision wasn't obvious, the reasoning is stated so it can be overridden.

---

## 0. What this app is

A two-sided companion app for parents working with a child therapist (children ~3–10; ADHD, anxiety, defiance).

- **Therapist side (desktop web):** manages clients, unlocks parenting skills session-by-session, leaves a short structured note per skill.
- **Parent side (mobile PWA):** sees unlocked skills as scannable "cheat sheets," has an always-available _In-the-Moment_ coaching button, logs practice.

**Core differentiator:** therapist-controlled progressive unlock of an evidence-based skill curriculum (PCIT / Behavioral Parent Training). Parents see locked skills grayed-out as "coming soon" (motivation) but can only open content the therapist has unlocked.

---

## 1. Recommended stack (decisive)

| Layer               | Choice                                                        | Why                                                                                                                                                                 |
| ------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend            | React + Vite + TypeScript + Tailwind                          | Fast, high-contrast big-button UI; one codebase, role-based routing                                                                                                 |
| Parent app delivery | Installable **PWA**                                           | No App Store review for MVP; home-screen icon for the In-the-Moment button; instant therapist→parent onboarding via link                                            |
| Backend / data      | **Supabase** (Postgres + Auth + Row-Level Security + Storage) | The security-critical "therapist sees only their own clients" boundary is enforced _in the database_ via RLS, not hand-rolled. Auth is done for you. Free to start. |
| Hosting             | Vercel (frontend) + Supabase (managed Postgres)               | Proper TLS, free tier, **not** the home/Hermes Mac mini                                                                                                             |

**Alternative path (full control):** FastAPI + Postgres + custom JWT auth. More code, larger security surface, but familiar to Dov. If chosen, the data model, screens, and access rules below are unchanged — only the implementation of auth + tenancy moves from RLS policies to API middleware.

**Do not** build this on no-code (Glide/Bubble/FlutterFlow): the cost/time argument that justifies no-code collapses when the builder is technical + has Claude Code, and no-code muddies data residency and tenancy enforcement — the two things this app most needs to control.

**Do not** host on personal/home infrastructure. This app has real users and compliance exposure; keep it fully separate from any hobby AI stack.

---

## 2. Privacy / data-minimization architecture (the core — read first)

This is a permanent design principle, not a temporary "HIPAA hack." The goal: the database should never contain Protected Health Information, so the MVP can be tested legally and cheaply — and stays defensible as it grows.

**Hard rules for v1:**

- **No patient/child names, DOB, addresses, or diagnoses anywhere.** No name fields. The therapist creates a client as a **non-identifying label they choose** (e.g., "Client 042"). Warn the therapist at the point of entry not to use real names or identifying detail. The therapist holds the label→patient mapping _outside_ the app; the app never sees it.
- **No free-text clinical notes in v1.** Therapist notes are **structured / templated** (see §4). One typed "Jacob hit his sister" turns the whole DB into a PHI store. Free-text notes are deferred to a phase that has a real compliance path (BAA / HIPAA review).
- **Parent reflections are structured, not free-text** (emoji rating + optional non-clinical tags). Same reasoning.
- **Children's data raises the stakes:** even with the parent as the account holder, the data is _about_ a minor. Treat with extra care (COPPA / consumer-health-privacy considerations). Clear, plain-language consent at parent signup.
- **Security regardless of PHI status:** TLS in transit, encryption at rest, RLS tenancy, no third-party analytics SDK that exfiltrates user content, minimal logging.

**Legal:** Before any real family — even de-identified — uses this, get a short review from counsel familiar with HIPAA / FTC Health Breach Notification Rule / state consumer-health-data laws. This doc is engineering guidance, not legal advice. Exposure is higher for a physician + clinician than for a generic founder.

---

## 3. Data model

> Auth users are managed by Supabase Auth. App tables below reference `auth.users.id`.

**therapists**

| col          | type        | notes                              |
| ------------ | ----------- | ---------------------------------- |
| id           | uuid pk     | = auth user id                     |
| email        | text        | therapist PII, with consent — fine |
| display_name | text        | optional                           |
| created_at   | timestamptz |                                    |

**clients** (a child/family case — never named)

| col          | type                    | notes                                            |
| ------------ | ----------------------- | ------------------------------------------------ |
| id           | uuid pk                 |                                                  |
| therapist_id | uuid fk → therapists.id |                                                  |
| label        | text                    | non-identifying, therapist-chosen ("Client 042") |
| created_at   | timestamptz             |                                                  |

**parents** (a parent login attached to a client)

| col        | type                 | notes                                    |
| ---------- | -------------------- | ---------------------------------------- |
| id         | uuid pk              | = auth user id                           |
| client_id  | uuid fk → clients.id | a client may have >1 parent (co-parents) |
| email      | text                 | parent's own, with consent               |
| created_at | timestamptz          |                                          |

**invites** (therapist → parent onboarding)

| col         | type                 | notes                |
| ----------- | -------------------- | -------------------- |
| id          | uuid pk              |                      |
| client_id   | uuid fk → clients.id |                      |
| code        | text unique          | single-use, expiring |
| expires_at  | timestamptz          |                      |
| consumed_at | timestamptz null     |                      |

**skills** (curriculum content — same for everyone in v1, seeded)

| col             | type        | notes                                         |
| --------------- | ----------- | --------------------------------------------- |
| id              | uuid pk     |                                               |
| slug            | text unique |                                               |
| level           | int         | 1–4                                           |
| sort_order      | int         |                                               |
| title           | text        | "Labeled Praise"                              |
| goal            | text        | 1 sentence                                    |
| use_when        | text        | trigger scenario                              |
| say_this        | text        | exact script                                  |
| dont_say        | text        | common pitfalls                               |
| safety_warning  | text null   | e.g., never ignore aggression/self-harm       |
| age_adaptations | text null   | Age-specific guidance (e.g., "Ages 3–5: ...") |
| is_published    | bool        | gate Level 4 etc.                             |

**client_skill_state** (per-client unlock + structured note)

| col         | type                    | notes                                                                          |
| ----------- | ----------------------- | ------------------------------------------------------------------------------ |
| id          | uuid pk                 |                                                                                |
| client_id   | uuid fk                 |                                                                                |
| skill_id    | uuid fk                 |                                                                                |
| status      | enum: locked / unlocked |                                                                                |
| unlocked_at | timestamptz null        |                                                                                |
| note_tag    | enum null               | structured note (e.g., focus_this_week / going_well / revisit) — NOT free text |

**practice_logs** (accountability)

| col             | type                      | notes                              |
| --------------- | ------------------------- | ---------------------------------- |
| id              | uuid pk                   |                                    |
| client_id       | uuid fk                   |                                    |
| parent_id       | uuid fk                   |                                    |
| skill_id        | uuid fk null              | null = general practice            |
| practiced_at    | timestamptz               |                                    |
| went_how        | enum: good / mixed / hard | emoji rating                       |
| reflection_tags | text[] null               | from a fixed, non-clinical tag set |

---

## 4. Access rules (RLS)

Enforce tenancy in the database. Examples (Supabase SQL flavor):

```sql
-- Therapist can only see/modify their own clients
create policy "therapist owns clients"
on clients for all
using (therapist_id = auth.uid());

-- Parent can only see their own client's skill state
create policy "parent reads own client skills"
on client_skill_state for select
using (
  client_id in (select client_id from parents where id = auth.uid())
);

-- Therapist can write skill state only for their clients
create policy "therapist writes own client skills"
on client_skill_state for all
using (
  client_id in (select id from clients where therapist_id = auth.uid())
);

-- Parent writes only their own practice logs
create policy "parent writes own logs"
on practice_logs for insert
with check (parent_id = auth.uid());
```

Role distinction (therapist vs parent) by which table the auth id appears in. `skills` is world-readable (published rows only); everything else is row-scoped.

---

## 5. Screens

### Therapist (desktop web)

1. **Auth** — sign up / log in (Supabase Auth, email + magic link or password).
2. **Client list** — add client (label only, with the "no real names" warning); per-client at-a-glance progress (e.g., "5/12 unlocked, last practice 2 days ago"); "Invite parent" → generates code/link.
3. **Client detail** — skill tree by level; toggle each skill locked↔unlocked; set structured `note_tag`; practice-log summary (counts + last-7-days sparkline). No free-text anywhere.

### Parent (mobile PWA)

1. **Onboarding** — open invite link → create login → consent screen (plain language).
2. **Home** — big persistent **"In the Moment"** button at top; below it, unlocked skills as cards. Locked skills are **NOT shown** — parents should not see what's coming next. Minimal scroll.
3. **Skill detail (cheat sheet)** — fixed layout, large type, high contrast:
   - Goal · Use When · **Say This** · Don't Say · ⚠️ Safety Warning · Age Adaptations · Therapist focus tag (if set)
   - One-tap "Practiced this" → reflection.
4. **In-the-Moment flow** — see §6.
5. **Practiced today** — `went_how` (😀/😐/😞) + optional tags. Two taps, done.

**UX law for the parent side:** designed for a brain in panic mode. Massive tap targets, zero horizontal scroll, ≤3 short bullets per action screen, no skill content longer than the screen.

---

## 6. "In the Moment" — spec + safety (non-negotiable)

This is the highest-value feature and the highest-liability one. It is **everyday-hard-moment coaching, not crisis intervention.**

Flow:

1. Tap big button → "What's happening?" → 3–4 large situation buttons (e.g., _Meltdown / Defiance / Whining / Sibling conflict_).
2. → A short de-escalation script: **≤3 bullets, huge text, no scroll.** Universal basics — **not gated** by the unlock state (a parent in a hard moment must never hit a paywall/lock).
3. Persistent at the bottom of every In-the-Moment screen: **"This isn't working / I need help"** → escalation panel:
   - Call my therapist (if number on file) · **Call/Text 988** (crisis line) · **Call 911**.
4. Disclaimer, brief and unmissable: this app does not handle emergencies; for danger to anyone, call 911.

The "never ignore aggression or self-harm" warning must be **structural** here and on relevant cheat sheets — not buried.

---

## 7. Clinical curriculum

Organized into behavioral tiers (PCIT / BPT). **Seed Levels 1–3 for MVP; defer Level 4.**

- **L1 Connection & Foundation:** Validation/Reflective Listening · Labeled Praise · Special Time (child-led play)
- **L2 Shaping Behavior:** Active Ignoring (strict safety disclaimer) · Differential Attention · First/Then
- **L3 Limits & Boundaries:** Effective Commands (one, calm, clear) · Natural & Logical Consequences · Limit Setting & Consistency · Effective Discipline & Time-Out Procedure
- **L4 Regulation (Phase 2):** Parent Self-Regulation · Co-regulation & Repair · Parental Coping Skills · Understanding the Escalation Curve (escalating → peak → cool down) and How to Respond at Each Step (e.g., limit verbalization at peak)
- **L5 Support & Maintenance (Phase 2):** Limiting Accommodations · Support Statements · Reinforcements · Managing Antecedents

**Age Adaptations:** Each skill card should include age-specific guidance (e.g., "Ages 3–5: Use simple one-step commands. Ages 6–8: Can handle two-step directions. Ages 9–10: Can discuss rules and consequences before they happen.").

Every skill uses the §3 `skills` schema (Goal / Use When / Say This / Don't Say / Safety Warning / Age Adaptations).

**Content ownership (open decision):** the cheat-sheet copy must be authored or reviewed by a licensed clinician before real families use it. Claude Code should scaffold the schema and seed **placeholder** copy clearly marked `DRAFT — clinician review required`; it must not invent clinical scripts presented as final.

---

## 8. Phasing

**Phase 0 — pre-build (days):**

- Lock MVP scope to this doc.
- Confirm clinical-copy author/reviewer.
- 5-min competitive scan (search: "behavioral parent training app therapist dashboard", "PCIT companion app") — confirm the gap.
- Secure 2–3 therapist design partners (verbal commitment to test).
- Short legal skim of the data-minimization model.

**Phase 1 — MVP build:** everything in §3–§7. Auth, therapist client mgmt + unlock + structured notes, parent PWA with cheat sheets + In-the-Moment + practice logging, RLS, PWA install. Seed L1–L3. Free for all users.

**Phase 2 — post-validation:** free-text notes _with_ a compliance path (BAA/HIPAA if BA status applies); L4 content; therapist analytics; practice reminders/push; monetization ($29/mo per therapist, ~10 active clients — parents always free); optional native wrappers.

**Phase 3 — scale (only if Phase 1 retains):** multi-clinician orgs, billing, admin.

---

## 9. Hard requirements (do not ship without)

1. No PHI fields in v1; "no real names" warning at client creation.
2. Structured notes + reflections only; **no free-text** in v1.
3. In-the-Moment has an always-visible 988/911/therapist escalation and never claims to handle emergencies.
4. TLS + at-rest encryption + RLS tenancy; no content-exfiltrating analytics SDKs.
5. Clinical copy clinician-reviewed before real families use it.
6. Brief legal review before onboarding any real (even de-identified) patient.
7. Hosted on proper cloud, not personal/home infra.

---

## 10. Open decisions for Dov/Ariella (stated assumptions in brackets — override freely)

- Clinical copy: Ariella authors vs. separate licensed reviewer? [assumed: clinician-reviewed before launch]
- Parent delivery: PWA now vs. native iOS now? [assumed: PWA for MVP]
- Backend: Supabase vs. FastAPI? [assumed: Supabase]
- App name + branding [TBD]

---

## 11. Claude Code build order (suggested checklist)

1. Scaffold Vite + React + TS + Tailwind; PWA manifest + service worker; role-based routing.
2. Supabase project; tables from §3; **enable RLS + write policies from §4 before any data UI.**
3. Auth (therapist signup/login; parent magic-link onboarding via invite code).
4. Seed `skills` with L1–L3 **DRAFT** copy.
5. Therapist: client list (label-only + warning), invite generation, client detail with unlock toggles + structured note tag.
6. Parent: home (In-the-Moment button + unlocked/locked cards), skill cheat-sheet view, practice logging.
7. In-the-Moment flow (§6) incl. escalation panel + disclaimer.
8. Therapist practice-log summary view.
9. High-stress UX pass on parent side (tap targets, contrast, no-scroll action screens).
10. Manual test of RLS (therapist A cannot read therapist B's clients; parent cannot read another client).
