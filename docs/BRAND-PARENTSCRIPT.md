# ParentScript — Brand Book

> _Say the right thing at the right time._
> Status: v1.0 — Owner: Mark (Marketing Lead). Clinical authority: Mira / Dr. Ariella Eisenberg, PsyD. Last updated 2026-07-05.

This is the canonical brand reference for ParentScript. Read before writing copy, designing a surface, shipping a marketing asset, or signing off on a clinical message. If something here conflicts with `brand-voice-guide.md`, the voice guide wins on copy questions — this book is the visual + UX layer.

Pair with:

- Canonical tokens: [`/Users/Ezra/Projects/team/mark-deliverables/design-tokens.json`](../packages/design/tokens.json) (ParentScript surface = `products.parentscript`)
- Shared design system: [`docs/DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md)
- Voice guide (cross-product): [`/Users/Ezra/Projects/team/mark-deliverables/brand-voice-guide.md`](./BRAND-VOICE.md)
- Clinical glossary: [`docs/CLINICAL_GLOSSARY.md`](./CLINICAL_GLOSSARY.md)

---

## 1. Brand at a glance

|                  |                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------ |
| **Product**      | ParentScript                                                                               |
| **One line**     | _Say the right thing at the right time._                                                   |
| **Audiences**    | (a) Parents working with a child therapist, (b) licensed therapists treating kids          |
| **Brand voice**  | calm, clinical, reassuring, judgment-free                                                  |
| **Brand mark**   | "ParentScript" — sentence case, single word, capital P + capital S                         |
| **Color scheme** | light only (clinical-warmth surface)                                                       |
| **Accent**       | indigo `#6366F1`                                                                           |
| **Warm accent**  | amber `#F59E0B` (used sparingly — only for "warmth" cues, never for errors)                |
| **Type**         | Inter (sans) — body type is one notch larger than Tono's, parents need to read at a glance |
| **Tagline use**  | Italic in body, sentence case in headlines.                                                |

ParentScript is **light by design**. The page is bright. The accent is indigo, used sparingly. There is no dark mode — that would break the clinical-warmth tone.

The brand mark, accent, and surface are the same in every context: app icon, store listing, marketing page, in-app empty state, error message, sales deck, therapist portal. If a screen doesn't have indigo on near-white, it isn't on-brand.

---

## 2. Voice

The full cross-product voice guide lives in the parent `brand-voice-guide.md`. The rules below are the ParentScript-specific application — and the rules that protect the most vulnerable people in the product's audience.

### 2.1 Tone

Calm, not chipper. Clinical, not clinical-sounding. Reassuring, not saccharine.

| Yes                                                             | No                                                |
| --------------------------------------------------------------- | ------------------------------------------------- |
| "theo's having a hard moment in the kitchen."                   | "Uh oh! Meltdown detected! Don't panic!"          |
| "validates the want, holds the limit, offers two alternatives." | "Leverages evidence-based behavioral frameworks." |
| "you have a check-in on thursday."                              | "Don't miss your next appointment!"               |
| "tantrum," "meltdown," "yelling."                               | "BIG FEELINGS MOMENT™."                           |
| "the tantrum wasn't your fault. here's what to try next."       | "When parents lose their cool…"                   |

### 2.2 Micro-rules

- **Sentence case in headlines.** ParentScript doesn't shout. "Your progress" not "YOUR PROGRESS."
- **Names of frameworks spelled out on first use, then abbreviated.** "Parent-Child Interaction Therapy (PCIT)" → "PCIT" after.
- **Always attribute clinical content.** "dr. eisenberg," "the PCIT manual," "research shows…" — never invent authority.
- **Use the parent's name in greetings.** "good morning, sarah." is warmer than "welcome back."
- **Kids' names appear in copy lowercase, exactly as the parent wrote them.** Don't normalize them. Don't capitalize for "grammar."
- **Specific metrics over vague reassurance.** "82% of repair attempts succeeded" not "you're doing great."
- **De-escalation language first.** Even on a marketing page. _Especially_ on a marketing page.

### 2.3 Required clinical guardrails

These are non-negotiable for any copy Mira or a clinician hasn't approved:

1. **Never claim to treat, cure, or diagnose.** ParentScript supports caregivers; it is not therapy.
2. **Always include the safety disclaimer** on any surface that could be reached by a parent in crisis:
   > "ParentScript supports caregiver skills — it isn't a substitute for clinical care. If you're worried about your child's safety or your own, contact a licensed clinician or call/text 988."
3. **Cite frameworks by name** (PCIT, BPT, CPS, Triple P, Circle of Security, Hanen, Incredible Years) when referencing research — never "studies show" without a source.
4. **Avoid outcome guarantees.** "Designed to support" beats "guaranteed to help."
5. **Never imply the parent has been doing it wrong.** Ever. Even subtly. The shame reflex in parenting is the single biggest reason caregivers churn out of any support tool.

If a piece of copy would survive a clinical review but fail a parent in crisis, the parent wins.

---

## 3. Color

ParentScript is light by design. Indigo is the accent. Amber is the warmth accent. Red is reserved for safety, never for marketing. These are the **only** colors that may appear in ParentScript surfaces and marketing — never invent hex values.

### 3.1 Surface palette

Source: `products.parentscript.color` in tokens.

| Slot           | Hex       | Use                                                              |
| -------------- | --------- | ---------------------------------------------------------------- |
| `bg`           | `#FFFFFF` | Page / app background                                            |
| `bgSoft`       | `#FAFBFC` | Section dividers, large fill areas                               |
| `bgCard`       | `#FFFFFF` | Card surfaces (default)                                          |
| `bgElev`       | `#FFFFFF` | Elevated surfaces — modals, popovers, menus (use shadow to lift) |
| `border`       | `#E5E7EB` | Default hairline (1px)                                           |
| `borderStrong` | `#D1D5DB` | Emphasized borders — focus, active rows                          |
| `text`         | `#111827` | Primary copy                                                     |
| `textSoft`     | `#4B5563` | Secondary copy                                                   |
| `textSofter`   | `#6B7280` | Tertiary copy, helper text                                       |
| `muted`        | `#9CA3AF` | Disabled state, placeholder                                      |

### 3.2 Accent (indigo)

| Slot           | Hex       | Use                                                         |
| -------------- | --------- | ----------------------------------------------------------- |
| `accent`       | `#6366F1` | Primary CTA, focused state, brand mark                      |
| `accentHover`  | `#4F46E5` | Hover / pressed state                                       |
| `accentSoft`   | `#EEF2FF` | Selected row tint, subtle backgrounds, hero fills           |
| `accentSofter` | `#F5F5FF` | Hover state on neutral surfaces                             |
| `accentLight`  | `#A5B4FC` | Indigo on soft fill (charts, accents in hero illustrations) |
| `accentInk`    | `#3730A3` | Indigo on light backgrounds where `accent` lacks contrast   |

The accent is **brand-critical but quiet**. ParentScript's CTA sits in the lower-third of the visual weight on most screens — the parent reads the script first, the button second. Indigo shows up where the parent needs to act, never where they're trying to think.

### 3.3 Warmth accent (amber)

| Slot       | Hex       | Use                                                                                               |
| ---------- | --------- | ------------------------------------------------------------------------------------------------- |
| `warm`     | `#F59E0B` | One warmth cue per screen max — a single tap target, a single icon, a single illustration element |
| `warmSoft` | `#FEF3C7` | Warm fill behind the warmth cue                                                                   |

Amber is the difference between "an app" and "a tool that feels like a clinical ally." Use it **once** per screen. If amber appears twice on a screen, the second instance needs to go.

**Amber is never an error color.** Amber is warmth, encouragement, "you can do this." Red is for danger. Don't collapse them.

### 3.4 Crisis channel (shared)

The crisis channel is **global** across both products and lives at `global.feedback.crisis` in tokens. Source values:

| Slot       | Hex       | Use                     |
| ---------- | --------- | ----------------------- |
| `bg`       | `#FEE2E2` | Crisis card background  |
| `bgStrong` | `#FCA5A5` | Crisis card pulsing dot |
| `border`   | `#DC2626` | Crisis card border      |
| `ink`      | `#7F1D1D` | Crisis card copy        |

These tokens override the ParentScript surface palette wherever crisis content lives. The crisis channel **always sits above** the rest of the page (z-index `z.crisis` = 400). This is non-negotiable. See `docs/DESIGN-SYSTEM.md` § 2.3 and § 3.2.

### 3.5 Status / feedback

| Token         | Hex       | Use                                  |
| ------------- | --------- | ------------------------------------ |
| `success`     | `#10B981` | Confirm — saved, skill unlocked      |
| `successSoft` | `#D1FAE5` | Confirm fill                         |
| `danger`      | `#DC2626` | Destructive, error that blocks work  |
| `dangerSoft`  | `#FEE2E2` | Error fill                           |
| `info`        | `#0EA5E9` | Neutral status — syncing, processing |
| `infoSoft`    | `#E0F2FE` | Info fill                            |

Red (`danger` / `dangerSoft`) is **only** for destructive actions and errors. Never for marketing, never for "paywall" CTAs, never for emphasis. If a non-error surface wants emphasis, it uses `accent` (indigo) or `warm` (amber).

### 3.6 Color combos that ship

These combinations have been measured for contrast and approved for production use:

| Combo                   | Ratio  | Notes                                                                                                                               |
| ----------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `text` on `bg`          | 17.7:1 | Default body copy                                                                                                                   |
| `textSoft` on `bg`      | 7.6:1  | Secondary copy                                                                                                                      |
| `textSofter` on `bg`    | 4.8:1  | Tertiary, captions — AA body                                                                                                        |
| `muted` on `bg`         | 2.5:1  | Disabled / placeholder — UI text only, **does not pass AA body**. Use only for non-essential decorative UI text.                    |
| `accent` on `bg`        | 4.5:1  | Accent text on light surface — **passes AA body at the boundary**. For body-weight copy on `accent` background, prefer `accentInk`. |
| White on `accent`       | 4.5:1  | Primary button label — passes AA body                                                                                               |
| `accentInk` on `bg`     | 9.9:1  | Headlines in indigo                                                                                                                 |
| Crisis ink on crisis bg | 8.2:1  | Crisis card copy — measured in QA                                                                                                   |

If you find yourself wanting a combination not in this list, the answer is to use a token — not to invent a hex.

---

## 4. Typography

Inter for everything readable. No monospace in marketing surfaces — parents don't need to see char counts. Type sizes are one notch larger than Tono's, because parents often read at a glance and need the cognitive load low.

### 4.1 Type scale

Source: `products.parentscript.type`.

| Token      | Size / line / tracking / weight | Use                                  |
| ---------- | ------------------------------- | ------------------------------------ |
| `display`  | 40 / 48 / -0.02em / 700         | Hero headline                        |
| `h1`       | 30 / 38 / -0.01em / 700         | Page title                           |
| `h2`       | 22 / 30 / -0.005em / 600        | Section heading                      |
| `h3`       | 18 / 26 / 600                   | Card heading                         |
| `parentLg` | 20 / 30 / 500                   | Large body — script cards, hero copy |
| `body`     | 16 / 26 / 400                   | Default copy                         |
| `bodySm`   | 14 / 22 / 400                   | Secondary copy                       |
| `caption`  | 12 / 16 / 500 / +0.01em         | Eyebrows, labels, timestamps         |

The scale is **larger than Tono's by ~1-2px**. ParentScript surfaces are read at a glance — in the kitchen with a crying toddler, in a waiting room, on a phone in one hand. Bigger type is a feature, not a stylistic choice.

### 4.2 Usage rules

- **Sentence case in headlines.** Always. "Your progress," not "YOUR PROGRESS."
- **`parentLg` is the workhorse for script cards.** When in doubt about which body size, pick `parentLg` (20/30/500). It reads at a glance.
- **Tracking:** `display` and `h1` use negative tracking (tight). `caption` uses positive tracking (open). Nothing else uses tracking.
- **Line length.** Body copy max 60ch on desktop, 42ch on mobile. Scripts and cards max 56ch.
- **No monospace in marketing surfaces.** Char counts, raw text, and copy-paste targets are app-only — parents don't see them in marketing.

### 4.3 Hierarchy example (script card on parent home)

```
h1       "today's scripts"                  ← page title
h2       "the tantrum toolkit"              ← script set title
parentLg validates the want. holds the limit. offers two alternatives.   ← the script
body     try this when theo's stuck on "no."   ← context
bodySm   from dr. eisenberg · 3 min read      ← attribution + time
caption  UNLOCKED · FROM SESSION 2             ← meta
```

---

## 5. Component patterns

Each ParentScript component has a token-aligned default and a documented set of variants. The full source lives in `apps/web/src/components/`. Below is the brand-level pattern.

### 5.1 Buttons

| Variant     | bg          | fg         | border   | Use                                           |
| ----------- | ----------- | ---------- | -------- | --------------------------------------------- |
| `primary`   | `accent`    | `#FFFFFF`  | —        | Primary action — "save", "open live coach"    |
| `secondary` | `bgSoft`    | `text`     | `border` | Secondary action — "view all scripts"         |
| `ghost`     | transparent | `textSoft` | —        | Tertiary — "skip this", "not now"             |
| `danger`    | `danger`    | `#FFFFFF`  | —        | Destructive — "remove profile" (with confirm) |

**Rules:**

- Min height 44px (WCAG 2.5.5). Larger than 44px is preferred on script cards (48-52px) — parents tap one-handed.
- Padding: sm `6/12`, md `10/18`, lg `14/24`.
- Radius: `md` (12px).
- Label is **verb phrase, sentence case, no exclamation**: `save`, `text me this`, `open live coach`, `not now`.
- **No exclamation marks anywhere.** ParentScript never shouts.
- Focus ring: `shadow.focus` (3px indigo ring at 35% opacity) — visible always.
- Disabled: 50% opacity, no hover lift, `cursor: not-allowed`.

### 5.2 Inputs

| Property   | Value                            |
| ---------- | -------------------------------- |
| Padding    | `12px 14px`                      |
| Radius     | `md` (12px)                      |
| Border     | `1px solid border`               |
| Background | `#FFFFFF`                        |
| Focus ring | `shadow.focus` (3px indigo ring) |
| Min height | 44px                             |

Form inputs are sentence-cased, with helper text in `textSofter` immediately below. Never use placeholder as label.

### 5.3 Cards

| Property   | Value                                                         |
| ---------- | ------------------------------------------------------------- |
| Padding    | `20px`                                                        |
| Radius     | `lg` (18px)                                                   |
| Background | `#FFFFFF`                                                     |
| Border     | `1px solid border`                                            |
| Shadow     | `shadow.sm`                                                   |
| Hover      | `border` → `borderStrong`, shadow → `shadow.md` (subtle lift) |

Script cards are the most important card surface in ParentScript. They are larger (`parentLg` body), have a single warmth cue max (amber icon, amber underline, or amber count chip), and a single primary action. No more.

### 5.4 CrisisCard (the in-the-moment banner)

This is ParentScript's most important component. Source: `apps/web/src/components/CrisisCard.tsx`.

- Token-aligned to `global.feedback.crisis`. Always red, always above the fold on parent pages.
- Z-index: `z.crisis` (400) — above modal (200), above nav (50).
- Always includes the safety disclaimer (per § 2.3, guardrail #2).
- Phone numbers are real `<a href="tel:…">` links — tappable from mobile.
- `role="region"` + `aria-label="If you or your child are in crisis, here's how to get help now."`
- `prefers-reduced-motion` disables the pulsing dot.
- `forced-colors` mode uses system colors.
- **Hide state** is persisted in `sessionStorage` (not localStorage). Parents get the card back on next session, but other family members on the same device don't share the dismissal.

The CrisisCard is never below the fold, never behind a modal, never behind a paywall. If a parent needs it, they see it.

### 5.5 Empty state

The ParentScript empty state welcomes, never blames:

```
display  "no children yet."
body     "add one when you're ready — we'll set up their first skill together."
[ primary button: add a child ]
```

No "Welcome to ParentScript!" dialogs. No tooltips. No tours. The first time a parent lands on the empty state, they see one button and one sentence.

### 5.6 Error state

Warm, factual, name the next action:

| State                              | Copy                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------- |
| Connection lost                    | "we couldn't reach parentscript. tap to retry — your drafts are safe."    |
| Auth failure                       | "your session ended. sign in again to get back to your scripts."          |
| Therapist hasn't unlocked anything | "no scripts unlocked yet. your therapist shares them session by session." |
| Server error                       | "we hit a snag saving that. tap to try again."                            |

Always one sentence. Always names the next action. Always includes reassurance that existing work is safe.

---

## 6. Marketing surface patterns

### 6.1 App icon

- Background: indigo `#6366F1` flat fill.
- Mark: lowercase `ps` in white, Inter, 700 weight, sized to fill ~55% of icon canvas. The "p" descender creates a stable visual anchor; the "s" curls around it.
- No rounded rectangle behind the letters — the letters ARE the mark.
- Optional warmth accent: a single small amber dot above the "i" of "parent" (in wordmark variants only — never in the icon).
- Required sizes: 1024, 512, 192, 180, 167, 152, 120, 87, 80, 60, 58, 40, 29.

### 6.2 Store listing (App Store + Play Store)

| Field                 | Value                                                                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Title                 | `ParentScript — scripts that work`                                                                                                                        |
| Subtitle              | `evidence-based parenting, session by session`                                                                                                            |
| Keywords              | `parenting, therapist, PCIT, evidence-based, scripts, child behavior, calm down, tantrum, meltdown, repair attempt`                                       |
| Primary screenshot    | A script card on parent home — the script body, "from dr. eisenberg," and one tap target. The clinical authority is the sell.                             |
| Secondary screenshots | (1) crisis card prominent, (2) therapist-client relationship view, (3) skill unlock over time, (4) progress metrics ("82% of repair attempts succeeded"). |

**ASO rule:** the first screenshot shows a real script card with a real attribution. No illustrations of smiling families. No "Meet ParentScript." The product sells itself, and the selling point is _clinical credibility_.

The **crisis card** must appear on at least one App Store screenshot — by policy. Parents in crisis land on store listings via "how to handle a tantrum" searches. The crisis card on the store page is a chance to point them to 988 before they ever download.

### 6.3 Hero (landing page)

`docs/designs/landing-parent.html` is the canonical reference.

- Headline: **"Say the right thing at the right time."**
- Sub: **"evidence-based scripts your therapist can stand behind. PCIT, BPT, CPS, Triple P, Circle of Security."**
- Hero card: a script card on a soft indigo background. Real script body. Real attribution.
- **Crisis card visible.** Either as a sticky banner at the top of the page or as a dedicated screenshot/inset in the hero. This is a brand promise, not a footer.
- No testimonials on the hero — clinical credibility is the testimonial.

### 6.4 Therapist landing

`docs/designs/landing-therapist.html` is the canonical reference.

- Headline: **"the scripts you actually assign."**
- Sub: **"unlock skills session by session. structured notes. PCIT, BPT, CPS, Triple P, Circle of Security, Hanen, Incredible Years."**
- Tone: professional, structured, evidence-based. Therapists are clinicians; the copy talks to them as peers.
- No crisis card on the therapist landing — they know. The crisis card is for the parent audience.

### 6.5 Pricing

- Two-sided pricing. Therapist and parent are billed separately.
- Parent tier: free to start, paid premium at scale (TBD — confirm with Ezra before publishing).
- Therapist tier: per-client pricing (TBD — confirm with Ezra before publishing).
- **Pricing cards never use red.** Red is reserved for safety. Pricing emphasis is indigo + amber for warmth cues.

---

## 7. Iconography

Stroke icons, 1.5px stroke, line caps round, joins round. Color follows `textSoft` default, `accent` when active, `muted` when disabled. Icons are **monoline** — no filled variants except for state indicators (lock, check, dot).

The icon library of record is Lucide. For custom ParentScript marks (warmth cue icons, skill unlock icons), source lives in `apps/web/src/components/icons/` and ships as 24px SVGs with the appropriate accent baked in.

**Warmth cue icons** use amber `#F59E0B` — never red, never indigo. They mark the small gestures that make ParentScript feel like an ally, not an app.

---

## 8. Motion

- Default duration: `normal` (240ms) for almost everything.
- Easing: `standard` (`cubic-bezier(0.2, 0.8, 0.2, 1)`).
- Script card unlock animation: `slow` (420ms) — the moment a therapist unlocks a skill is the moment of magic, give it room.
- **Reduced motion:** `prefers-reduced-motion: reduce` collapses all durations to 1ms and disables hover lifts. The crisis card pulsing dot stops. The skill unlock animation is still legible — just instant.
- **No bouncy springs.** No cartoon-style overshoot. Parents are stressed; the motion is calm.

---

## 9. Accessibility — ParentScript specifics

- All text/background pairs above meet WCAG AA (4.5:1 body, 3:1 large/UI).
- Crisis card ink (`#7F1D1D`) on crisis card bg (`#FEE2E2`) measures **8.2:1** — measured in QA, re-measure after any token change.
- Focus rings are **always visible**. Never `outline: none` without a `:focus-visible` replacement.
- Tap targets ≥ 44px. Script card tap targets **≥ 48px** (parents tap one-handed).
- Phone numbers are real `tel:` links — tappable from mobile.
- The crisis card is read by screen readers as a region with an explicit aria-label.
- Screen-reader copy never uses ASCII art, decorative characters, or emoji.
- Gender-neutral by default ("your child," "your partner," "your therapist"). Honor a parent's pronouns when they've set them.
- Always specify who a "you" refers to in multi-party contexts (parent vs. therapist vs. child).

---

## 10. Do / Don't cheatsheet

| Do                                               | Don't                                                            |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| Write "Say the right thing at the right time."   | Shout "PARENTING JUST GOT EASIER!"                               |
| Use "tantrum" plainly                            | Invent "BIG FEELINGS MOMENT™"                                    |
| Attribute to dr. eisenberg / PCIT / BPT          | Write "studies show" without a source                            |
| Use indigo for primary CTAs                      | Use indigo for warmth cues — amber is warmth                     |
| Use amber for warmth (one per screen max)        | Use amber twice on the same screen                               |
| Use red for danger / crisis only                 | Use red for marketing emphasis or paywalls                       |
| Cite the framework on first use                  | Drop "PCIT" without spelling it out first                        |
| Show the crisis card on parent-facing surfaces   | Hide the crisis card behind a modal or paywall                   |
| Write "82% of repair attempts succeeded"         | Write "you're doing great"                                       |
| Use sentence case in headlines                   | ALL-CAPS ANYTHING                                                |
| Persist crisis-card hide state in sessionStorage | Persist in localStorage (other parents on the device share that) |
| Treat shame as the biggest churn risk            | Subtle hints that the parent has been doing it wrong             |

---

## 11. What's next

- [ ] Confirm pricing with Ezra (parent tier + therapist tier — both undecided).
- [ ] Lock the parent App Store screenshots (script card hero + crisis card + progress).
- [ ] Lock the therapist App Store screenshots (unlock flow + structured notes + framework library).
- [ ] Run crisis-card contrast through QA after any token change.
- [ ] Mira sign-off on every clinical claim in marketing surfaces before shipping.

---

_Owner: Mark (Marketing Lead). Clinical authority: Mira / Dr. Ariella Eisenberg, PsyD. Engineering: Gary (CTO), Sherlock (infra), Quinn (QA). Last updated 2026-07-05._
