# ParentScript Design System

> One design system, two products. Two skins, one token tree.

This document is the canonical reference for the Amazed Labs design system
across Tono (dark / professional / dry-witty) and ParentScript (light /
clinical / calm / judgment-free). It is owned by **Mark** (Marketing Lead)
and ships tokens, components, and marketing surfaces that all teams consume.

The canonical token source lives at
[`packages/design/tokens.json`](../packages/design/tokens.json) (this repo)
and is mirrored from
`/Users/Ezra/Projects/team/mark-deliverables/design-tokens.json`.

---

## 1. Two skins, one tree

Both products share the same primitives — radius, spacing, type scale,
motion, z-index, and a feedback channel — and only diverge on color, tone
voice, and surface.

|              | **Tono**                                    | **ParentScript**                          |
| ------------ | ------------------------------------------- | ----------------------------------------- |
| Surface      | operate (operational tool)                  | monitor (status / glanceable)             |
| Color scheme | dark                                        | light                                     |
| Accent       | `#A855F7` (violet)                          | `#6366F1` (indigo)                        |
| Tone         | professional, premium, confident, dry-witty | calm, clinical, reassuring, judgment-free |
| One-liner    | _say what you mean._                        | _say the right thing at the right time._  |
| Voice rule   | lowercase everywhere                        | sentence case, never shouty               |

Voice and copy are owned by `brand-voice-guide.md` (Mark). This doc only
covers the visual language.

---

## 2. Tokens

Tokens are the **single source of truth**. Every component, every page, every
marketing surface reads from `tokens.json`. Tailwind classes and CSS vars
mirror the JSON — they are never the primary source.

### 2.1 Token shape

The file is structured as a DTCG-style hierarchy:

```
global → font, radius, space, shadow, motion, z, feedback
products → tono, parentscript
components → button, input, card, crisisCard, toast
tailwindTheme → { colors, borderRadius, fontFamily, boxShadow, … }
```

### 2.2 Color

Each product has its own named color slots:

```
products.tono.color          // dark surface palette
products.parentscript.color  // light surface palette
```

**Slots used by every component:**

| Slot         | Tono                    | ParentScript |
| ------------ | ----------------------- | ------------ |
| `bg`         | `#000000`               | `#FFFFFF`    |
| `bgSoft`     | `#0A0A0A`               | `#FAFBFC`    |
| `bgCard`     | `#111113`               | `#FFFFFF`    |
| `border`     | `#1F1F23`               | `#E5E7EB`    |
| `text`       | `#FFFFFF`               | `#111827`    |
| `textSoft`   | `#C9C9D1`               | `#4B5563`    |
| `accent`     | `#A855F7`               | `#6366F1`    |
| `accentSoft` | `rgba(168,85,247,0.12)` | `#EEF2FF`    |

**Tono has tone accents for the four rewrites:**

```
products.tono.toneAccents:
  warmer  → #F472B6   (pink)
  clearer → #38BDF8   (sky)
  funnier → #FBBF24   (amber)
  safer   → #34D399   (green)
```

These are the only allowed source for "warmer / clearer / funnier / safer"
UI accents — never invent hex values on the fly. The tones are _named_ in
copy and _colored_ on screen, in lockstep.

### 2.3 Feedback

The crisis channel is **shared** across both products and lives at
`global.feedback.crisis`:

```
global.feedback.crisis:
  bg:        #FEE2E2
  bgStrong:  #FCA5A5
  border:    #DC2626
  ink:       #7F1D1D
  shadow:    0 8px 32px rgba(220, 38, 38, 0.20)
  hotline:
    988         → call or text 988
    911         → call 911
    childhelp   → 1-800-422-4453
```

The crisis z-index is `z.crisis` (400) — above modal (200), above nav (50).
Anything safety-related uses these tokens. No exceptions.

### 2.4 Spacing

4px base. Use the named scale, never arbitrary pixels:

```
0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32
```

For 80/96/128 (large marketing sections), use `16/20/24/32` (64/80/96/128px).

### 2.5 Radius

```
none  0px
sm    8px   ← inputs, small chips
md    12px  ← buttons, cards (default)
lg    18px  ← larger cards, panels
xl    24px  ← modal surfaces, hero cards
2xl   32px  ← special — landing-page hero, marketing tiles
full  9999px ← pills, dots, avatars
```

### 2.6 Shadow

```
xs        0 1px 2px rgba(0,0,0,0.04)
sm        0 2px 8px rgba(0,0,0,0.06)
md        0 8px 24px rgba(0,0,0,0.08)
lg        0 24px 64px rgba(0,0,0,0.12)
focus     0 0 0 3px rgba(99,102,241,0.35)        ← ParentScript focus ring
focusTono 0 0 0 3px rgba(168,85,247,0.35)        ← Tono focus ring
focusDanger 0 0 0 3px rgba(220,38,38,0.40)       ← crisis focus ring
```

### 2.7 Motion

```
duration:
  instant    80ms
  fast       160ms
  normal     240ms   ← default — use this for almost everything
  slow       420ms
  deliberate 640ms

ease:
  standard     cubic-bezier(0.2, 0.8, 0.2, 1)   ← default
  decelerate   cubic-bezier(0, 0, 0.2, 1)
  accelerate   cubic-bezier(0.4, 0, 1, 1)
```

**Reduced motion**: when `prefers-reduced-motion: reduce`, all transitions
collapse to ~1ms. Hover lifts are disabled. The crisis pulse stops.

### 2.8 Typography

Both products use Inter (sans) and JetBrains Mono (mono). Type scales are
product-specific because ParentScript's parents need slightly larger body
text than Tono's professional audience.

|          | Tono                       | ParentScript               |
| -------- | -------------------------- | -------------------------- |
| display  | 48px / 56 / -0.025em / 700 | 40px / 48 / -0.02em / 700  |
| h1       | 36px / 44 / -0.02em / 700  | 30px / 38 / -0.01em / 700  |
| h2       | 24px / 32 / -0.01em / 600  | 22px / 30 / -0.005em / 600 |
| h3       | 18px / 26 / 600            | 18px / 26 / 600            |
| body     | 15px / 24 / 400            | 16px / 26 / 400            |
| bodySm   | 13px / 20 / 400            | 14px / 22 / 400            |
| caption  | 12px / 16 / 500 / +0.02em  | 12px / 16 / 500 / +0.01em  |
| mono     | 13px / 20 / 400            | —                          |
| parentLg | —                          | 20px / 30 / 500            |

---

## 3. Components

Each component is shipped as a `.tsx` file (logic + a11y) and a CSS block
(mirrored in `apps/web/src/styles/design-system-components.css`). Both
files reference the same token paths, so the styles stay in sync.

### 3.1 OAuth buttons — `OAuthButtons.tsx`

Three buttons. **Apple is black, Google is white, Email is ghost.** The
color stack is in `components.button.variants.oauth*`.

| Variant       | bg          | fg         | hover     | border         |
| ------------- | ----------- | ---------- | --------- | -------------- |
| `oauthApple`  | `#000000`   | `#FFFFFF`  | `#1F1F23` | `#000000`      |
| `oauthGoogle` | `#FFFFFF`   | `#1F1F23`  | `#F9FAFB` | `#D1D5DB`      |
| `oauthEmail`  | transparent | `textSoft` | `text`    | `borderStrong` |

A11y:

- `min-height: 44px` (WCAG 2.5.5 target size)
- `focus-visible` uses `shadow.focus` (3px indigo ring)
- `prefers-reduced-motion` kills the active-state lift
- `forced-colors` mode uses system colors

### 3.2 Crisis card — `CrisisCard.tsx`

The "in-the-moment" emergency banner. Token-aligned to `global.feedback.crisis`.

**Properties:**

- z-index: `z.crisis` (400) — above modals, above nav
- Always above the fold on parent pages
- Tappable phone numbers (`<a href="tel:…">`)
- `role="region"` + `aria-label`
- `prefers-reduced-motion` disables the pulsing dot
- `forced-colors` mode uses system borders

**Hide state** is persisted in `sessionStorage` (not localStorage) so
parents get it back on next session — but other family members on the same
device don't share the dismissal.

### 3.3 TonePreview — `TonePreview.tsx`

The Tono 4-tone rewrite preview. Original on the left, four cards on the
right, each with a copy button.

**Tone accents** (from `products.tono.toneAccents`):

```
warmer  #F472B6   --tone-color
clearer #38BDF8
funnier #FBBF24
safer   #34D399
```

CSS vars (`--tone-color`, `--tone-soft`, `--tone-glow`) are set per-card so
hover / focus / copy states all derive from one place.

**Responsive surface:** dark by default (Tono = operate surface). Has a
`prefers-color-scheme: light` block that swaps to light surface tokens —
Tono's web companion app can opt into either.

**A11y:** `role="list"` on the grid, `role="listitem"` per card, focus-visible
uses `--tone-glow` per card so the ring matches the tone accent.

### 3.4 Buttons — generic

Token-aligned variants in `components.button.variants`:

| Variant   | bg          | fg       | hover             |
| --------- | ----------- | -------- | ----------------- |
| primary   | accent      | white    | accentHover       |
| secondary | bgSoft      | text     | (border emphasis) |
| ghost     | transparent | textSoft | text              |
| danger    | danger      | white    | (darker red)      |

Min height 44px. Padding `sm 6/12`, `md 10/18`, `lg 14/24`. Radius `md` (12px).

### 3.5 Inputs

`padding: 12px 14px`, `radius: md`, `border: 1px solid border`,
`focusRing: shadow.focus`. Min height 44px.

### 3.6 Cards

`padding: 20px`, `radius: lg`, `bg: bgCard`, `border: 1px solid border`,
`shadow: shadow.sm`.

---

## 4. Accessibility — non-negotiable

These are table stakes. None are optional.

1. **Contrast — WCAG AA minimum.** All text/background pairs in this
   system measure ≥ 4.5:1 for body, ≥ 3:1 for large text and UI icons.
   The crisis card ink (`#7F1D1D`) on the bg (`#FEE2E2`) measures 8.4:1.
2. **Focus rings are always visible.** Never `outline: none` without a
   replacement `:focus-visible` rule. The system uses a 3px ring at 35-40%
   opacity of the accent color.
3. **Tap targets ≥ 44px.** WCAG 2.5.5. Buttons and tappable links.
4. **Phone numbers are real `tel:` links.** Tappable from mobile.
5. **`prefers-reduced-motion`** is respected. Hover lifts, pulses, and
   transitions collapse or stop entirely.
6. **`forced-colors` mode** is respected. Buttons use `ButtonText` /
   `Highlight` from the system palette.
7. **Voice / screen reader copy** never relies on color alone. Tones are
   named ("warmer," "clearer," etc.) in addition to being colored.

---

## 5. Marketing surfaces

Three hero screens live in [`docs/designs/`](./designs/):

| File                     | Audience            | Skin                           | Surface                |
| ------------------------ | ------------------- | ------------------------------ | ---------------------- |
| `landing-tone.html`      | Tono prospects      | dark / violet / lowercase      | operate-as-marketing   |
| `landing-therapist.html` | Licensed clinicians | light / indigo / sentence case | clinical authority     |
| `landing-parent.html`    | Parents             | light / indigo / sentence case | monitor / crisis-aware |

Each one is a static HTML file with the tokens inlined as CSS custom
properties — so designers can open them in a browser without running the
app. They are not part of the production bundle.

The 4-tone editor (`landing-tone.html`) doubles as the **demo** — the hero
is the actual editor, not a screenshot of it.

### 5.1 Dark mode

- **ParentScript surfaces** are light-only by design. The pages do not
  flip when `prefers-color-scheme: dark` is set — that would break the
  clinical-warmth tone. Documented inline in each HTML file.
- **Tono surfaces** are dark-only by design. The landing page is
  dark regardless of system preference — Tono's operate surface doesn't
  have a light skin in v1.
- **`TonePreview` component** is the one exception: it ships a
  `prefers-color-scheme: light` block so Tono's web companion (when it
  ships) can be used in either skin.

---

## 6. Process

### Adding a token

1. Edit `packages/design/tokens.json` first.
2. Mirror it in `tailwindTheme` (for Tailwind) and the CSS vars block in
   `apps/web/src/index.css` (for vanilla CSS).
3. Update `apps/web/tailwind.config.ts` if it's a Tailwind-accessible token.
4. Document it here.

### Adding a component

1. Create `apps/web/src/components/<Name>.tsx` with a `*_CSS` string export.
2. Mirror the CSS into `apps/web/src/styles/design-system-components.css`
   (byte-for-byte identical).
3. Reference only tokens in the CSS — never raw hex.
4. Document it in this file under § 3.

### Skins / white-labeling

If a third product is added later:

1. Add `products.<name>` in `tokens.json` with `colorScheme`, `color`,
   `toneAccents` (optional), `type`.
2. Add `<name>.<role>` colors to `tailwindTheme.colors`.
3. Update § 1 here.

---

## 7. Owner & change log

**Owner:** Mark (Marketing Lead, `mark@amazedlabs`)
**Clinical authority:** Mira / Dr. Ariella Eisenberg, PsyD
**Engineering:** Gary (CTO), Sherlock (infra), Quinn (QA)

| Date       | Change                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------- |
| 2026-07-03 | v1.0 — Mark shipped initial design tokens + two hero screens (tone + dashboard)                                     |
| 2026-07-05 | v1.1 — added `global.feedback.crisis` tokens, OAuthButtons polish, CrisisCard, TonePreview, and three landing pages |

---

## 8. References

- **Tokens (canonical):** [`packages/design/tokens.json`](../packages/design/tokens.json)
- **Tokens (deliverables mirror):** `/Users/Ezra/Projects/team/mark-deliverables/design-tokens.json`
- **Brand voice:** `docs/BRAND-VOICE.md` (lives in `team/mark-deliverables/`)
- **Tailwind config:** `apps/web/tailwind.config.ts`
- **CSS variables:** `apps/web/src/index.css`
- **Component CSS bundle:** `apps/web/src/styles/design-system-components.css`
- **Marketing surfaces:** `docs/designs/`
- **WCAG 2.5.5:** https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html
