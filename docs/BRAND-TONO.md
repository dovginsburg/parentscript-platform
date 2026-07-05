# Tono — Brand Book

> _say what you mean._
> Status: v1.0 — Owner: Mark (Marketing Lead). Last updated 2026-07-05.

This is the single page anyone writing Tono copy, designing a Tono surface, or shipping a Tono marketing asset should read first. It defines the brand mark, voice, color usage, typography, component patterns, and the tests we run copy through before it ships.

Pair with:

- Canonical tokens: [`/Users/Ezra/Projects/team/mark-deliverables/design-tokens.json`](../packages/design/tokens.json) (Tono surface = `products.tono`)
- Shared design system: [`docs/DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md)
- Voice guide (cross-product): [`/Users/Ezra/Projects/team/mark-deliverables/brand-voice-guide.md`](./BRAND-VOICE.md)

---

## 1. Brand at a glance

|                  |                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Product**      | Tono                                                                                                                     |
| **One line**     | _say what you mean._                                                                                                     |
| **Audience**     | Professionals who send high-stakes text — managers, founders, lawyers, salespeople, anyone whose words have consequences |
| **Brand voice**  | professional, premium, confident, dry-witty                                                                              |
| **Brand mark**   | Always lowercase `tono`. Never `Tono`, never `TONO`.                                                                     |
| **Color scheme** | dark only (operate surface)                                                                                              |
| **Accent**       | violet `#A855F7`                                                                                                         |
| **Type**         | Inter (sans) + JetBrains Mono (mono)                                                                                     |
| **Tagline use**  | Tagline is italic in body, lowercase in headlines.                                                                       |

The brand mark and accent are **the same in every context**: app icon, store listing, marketing page, in-app empty state, error message, sales deck. If a screen doesn't have violet on black, it isn't on-brand.

---

## 2. Voice

The full cross-product voice guide lives in the parent `brand-voice-guide.md`. The rules below are the Tono-specific application.

### 2.1 Tone

Professional, not stiff. Confident, not loud. Dry, not dismissive.

| Yes                                | No                                                                 |
| ---------------------------------- | ------------------------------------------------------------------ |
| "four ways to say it."             | "four amazing AI-powered alternatives!"                            |
| "pick one, copy, send."            | "Discover the perfect rewrite for every occasion."                 |
| "Q3 timeline keeps slipping."      | "Navigating timeline ambiguity in cross-functional collaboration." |
| "warmer. clearer. funnier. safer." | "Our Warm, Clear, Funny, and Safe tone options…"                   |
| "2 of 3 free today"                | "Unlimited free tier"                                              |

### 2.2 Micro-rules

- **Lowercase.** The brand mark is `tono`. Headlines, CTAs, and button labels follow suit: `rewrite`, not `Rewrite`. Sentence case is _not_ the Tono house style — Tono speaks lowercase.
- **No exclamation marks.** The product is confident; it doesn't need to raise its voice.
- **Em-dashes over commas.** Tono reads like someone who thinks in clauses, not lists.
- **Numbers and specifics over adjectives.** "184 chars" not "your text."
- **One verb per button.** Lowercase, no articles: `paste`, `rewrite`, `copy`, `send`, `clear`, `delete`.
- **The four tones are always named and colored together.** In copy they're lowercased; in CSS they map to a fixed accent each.

### 2.3 Anti-headlines

If you find yourself reaching for any of these, stop and rewrite:

- "AI-powered tone optimizer"
- "Intelligent communication assistant"
- "Your personal writing co-pilot"
- "Transform how you communicate"
- "Unlock the power of clear writing"

The cliff test applies: _if a customer read just this line, would they know what the product does?_ "four ways to say it." passes. "AI that gets you." fails.

---

## 3. Color

Tono is dark by design. The accent is violet. The four tone rewrites get one fixed accent each. These are the **only** colors that may appear in Tono surfaces and marketing — never invent hex values.

### 3.1 Surface palette

Source: `products.tono.color` in tokens.

| Slot           | Hex       | Use                                         |
| -------------- | --------- | ------------------------------------------- |
| `bg`           | `#000000` | Page / app background                       |
| `bgSoft`       | `#0A0A0A` | Section dividers, large fill areas          |
| `bgCard`       | `#111113` | Card surfaces (default)                     |
| `bgElev`       | `#16161A` | Elevated surfaces — modals, popovers, menus |
| `border`       | `#1F1F23` | Default hairline (1px)                      |
| `borderStrong` | `#2A2A30` | Emphasized borders — focus, active rows     |
| `text`         | `#FFFFFF` | Primary copy                                |
| `textSoft`     | `#C9C9D1` | Secondary copy                              |
| `textSofter`   | `#9CA3AF` | Tertiary copy, helper text                  |
| `muted`        | `#6B7280` | Disabled state, placeholder                 |

### 3.2 Accent (violet)

| Slot           | Hex                     | Use                                                      |
| -------------- | ----------------------- | -------------------------------------------------------- |
| `accent`       | `#A855F7`               | Primary CTA, focused state, brand mark                   |
| `accentHover`  | `#9333EA`               | Hover / pressed state                                    |
| `accentSoft`   | `rgba(168,85,247,0.12)` | Selected row tint, subtle backgrounds                    |
| `accentSofter` | `rgba(168,85,247,0.06)` | Hover state on neutral surfaces                          |
| `accentLight`  | `#D8B4FE`               | Accent on light marketing surfaces (rare — Tono is dark) |
| `accentGlow`   | `rgba(168,85,247,0.35)` | Focus ring, halo behind CTAs                             |

The accent is **brand-critical**. Primary CTAs use `accent` background with white text. Secondary surfaces that need to feel "Tono" use `accentSoft` for fills and `accent` for text or icon.

### 3.3 Tone accents (the four rewrites)

Source: `products.tono.toneAccents`. These are non-negotiable: warmer is always pink, clearer is always sky, funnier is always amber, safer is always green.

| Tone      | Hex       | Role                             |
| --------- | --------- | -------------------------------- |
| `warmer`  | `#F472B6` | Adds warmth, softens a hard line |
| `clearer` | `#38BDF8` | Tightens, removes ambiguity      |
| `funnier` | `#FBBF24` | Adds levity, breaks tension      |
| `safer`   | `#34D399` | De-risks, politens, hedges       |

**Naming + color lockstep.** The copy name and the CSS color must match in lockstep on every surface. Never display a "warmer" rewrite in green; never show "safer" in pink. The tokens ship as `--tone-color`, `--tone-soft`, `--tone-glow` so the four tones always derive from one source.

### 3.4 Status / feedback

| Token     | Hex       | Use                                         |
| --------- | --------- | ------------------------------------------- |
| `danger`  | `#EF4444` | Destructive actions, errors that block work |
| `warning` | `#F59E0B` | Caution — paywall limit, expiring session   |
| `success` | `#10B981` | Confirm — copied, sent, saved               |
| `info`    | `#3B82F6` | Neutral status — syncing, processing        |

### 3.5 Color combos that ship

These combinations have been measured for contrast and approved for production use:

| Combo                       | Ratio  | Notes                                                                                         |
| --------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `text` on `bg`              | 21.0:1 | Default body copy                                                                             |
| `textSoft` on `bg`          | 12.8:1 | Secondary copy                                                                                |
| `textSofter` on `bg`        | 8.3:1  | Tertiary, captions                                                                            |
| `muted` on `bg`             | 4.3:1  | Disabled / placeholder — AA Large only                                                        |
| `accent` on `bg`            | 5.3:1  | Accent text on dark surface — passes AA body                                                  |
| White on `accent`           | 4.0:1  | Primary button label — AA Large only (use `text` not white for body on accent if body weight) |
| `accent` focus ring on `bg` | n/a    | 3px halo at 35% opacity — `shadow.focus`                                                      |

If you find yourself wanting a combination not in this list, the answer is to use a token — not to invent a hex.

---

## 4. Typography

Inter for everything readable, JetBrains Mono only for code, char counts, and ID-style data. Type sizes are slightly tighter than ParentScript's because Tono's audience reads densely.

### 4.1 Type scale

Source: `products.tono.type`.

| Token     | Size / line / tracking / weight | Use                                       |
| --------- | ------------------------------- | ----------------------------------------- |
| `display` | 48 / 56 / -0.025em / 700        | Hero headline, app store feature graphic  |
| `h1`      | 36 / 44 / -0.02em / 700         | Page title                                |
| `h2`      | 24 / 32 / -0.01em / 600         | Section heading                           |
| `h3`      | 18 / 26 / 600                   | Card heading                              |
| `body`    | 15 / 24 / 400                   | Default copy                              |
| `bodySm`  | 13 / 20 / 400                   | Secondary copy                            |
| `caption` | 12 / 16 / 500 / +0.02em         | All-caps eyebrows, labels                 |
| `mono`    | 13 / 20 / 400                   | Char counts, copy-paste targets, raw text |

The scale is deliberately tighter than ParentScript's by ~1-2px because Tono surfaces pack more copy per viewport.

### 4.2 Usage rules

- **Display + h1 are always lowercase** in marketing surfaces. Not a typo — Tono speaks lowercase.
- **Caption is the only all-caps size.** Use for eyebrows (`COPY • REWRITE • SEND`) and form labels. Never use it for body copy.
- **Mono is for things the user might copy.** Don't use it for prose — JetBrains Mono on prose reads cold and broken.
- **Tracking:** `display` and `h1` use negative tracking (tight). `caption` uses positive tracking (open). Nothing else uses tracking.
- **Line length.** Body copy max 64ch on desktop, 44ch on mobile. Anything wider is hostile to read.

### 4.3 Hierarchy example (rewrite editor)

```
display  "four ways to say it."       ← hero / landing
h1       "rewrite"                    ← in-app page title
h2       "your text"  ·  "tono says"  ← section headings
h3       warmer. clearer. funnier. safer.  ← card titles
body     paste any text. four rewrites in two seconds.   ← primary CTA copy
bodySm   184 chars · 2 of 3 free today                   ← supporting
caption  COPY · REWRITE · SEND                           ← eyebrow / breadcrumb
mono     184 chars  ← character count
```

---

## 5. Component patterns

Each Tono component has a token-aligned default and a documented set of variants. The full source lives in `apps/web/src/components/`. Below is the brand-level pattern.

### 5.1 Buttons

| Variant     | bg          | fg         | border   | Use                                        |
| ----------- | ----------- | ---------- | -------- | ------------------------------------------ |
| `primary`   | `accent`    | `#FFFFFF`  | —        | Primary action — "rewrite", "copy", "send" |
| `secondary` | `bgSoft`    | `text`     | `border` | Secondary action — "clear", "paste new"    |
| `ghost`     | transparent | `textSoft` | —        | Tertiary — "skip", "dismiss"               |
| `danger`    | `danger`    | `#FFFFFF`  | —        | Destructive — "delete", "remove"           |

**Rules:**

- Min height 44px (WCAG 2.5.5).
- Padding: sm `6/12`, md `10/18`, lg `14/24`.
- Radius: `md` (12px).
- Label is **one verb, lowercase, no article**: `rewrite`, `paste`, `copy`, `send`, `clear`, `delete`, `try again`.
- Focus ring: `shadow.focus` (3px accent glow at 35% opacity) — visible always.
- Disabled: 50% opacity, no hover lift, `cursor: not-allowed`.

### 5.2 Inputs

| Property   | Value                            |
| ---------- | -------------------------------- |
| Padding    | `12px 14px`                      |
| Radius     | `md` (12px)                      |
| Border     | `1px solid border`               |
| Background | `bgCard`                         |
| Focus ring | `shadow.focus` (3px accent glow) |
| Min height | 44px                             |

Text inputs are **monospace** when they hold text the user will paste, copy, or send — i.e. the rewrite editor's source and target. Plain prose inputs use the default body type.

### 5.3 Cards

| Property   | Value                                           |
| ---------- | ----------------------------------------------- |
| Padding    | `20px`                                          |
| Radius     | `lg` (18px)                                     |
| Background | `bgCard`                                        |
| Border     | `1px solid border`                              |
| Shadow     | `shadow.sm`                                     |
| Hover      | `border` → `borderStrong`, accent glow on focus |

### 5.4 TonePreview (the 4-rewrite grid)

This is Tono's signature component. Source: `apps/web/src/components/TonePreview.tsx`.

- Layout: original on the left, four rewrite cards on the right (warmer, clearer, funnier, safer).
- Each card has a fixed accent color (the toneAccents).
- A copy button sits in the top-right of each card.
- Hover: subtle border lift to `borderStrong` + accent-specific `accentSoft` fill.
- Focus: ring uses the tone-specific `accentGlow` so the focus state matches the tone.
- A11y: `role="list"` on the grid, `role="listitem"` per card. Tone name in copy + colored ring on focus — never color alone.

### 5.5 Empty state

The Tono empty state is the demo:

```
display  "paste any text."
body     "four rewrites in two seconds."
[ primary button: paste ]
```

The empty state is _the_ conversion moment. No tutorials, no "Get started" tooltip tours. The product is the demo.

### 5.6 Error state

Dry, specific, actionable:

| State           | Copy                                                        |
| --------------- | ----------------------------------------------------------- |
| Connection lost | "couldn't reach tono. check your connection and try again." |
| Limit reached   | "3 of 3 free today. tono pro is $5.99/mo."                  |
| Empty paste     | "paste something to rewrite."                               |
| Server error    | "tono hit a snag. tap to retry."                            |

Always one sentence. Always names the next action.

---

## 6. Marketing surface patterns

### 6.1 App icon

- Background: pure black `#000000`.
- Mark: lowercase `t` in `accent` (`#A855F7`) centered, Inter, 700 weight, sized to fill ~60% of icon canvas.
- No rounded rectangle behind the letter — the letter IS the mark.
- Required sizes: 1024, 512, 192, 180, 167, 152, 120, 87, 80, 60, 58, 40, 29.

### 6.2 Store listing (App Store + Play Store)

| Field                 | Value                                                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Title                 | `tono — say what you mean`                                                                                             |
| Subtitle              | `rewrite any text in four tones`                                                                                       |
| Keywords              | `rewrite, tone, message, email, slack, professional, copy, voice`                                                      |
| Primary screenshot    | The 4-rewrite editor. Original on left, warmer/clearer/funnier/safer cards on right.                                   |
| Secondary screenshots | (1) empty state CTA, (2) tone-specific use cases (work email / Slack / sales / hard feedback), (3) pro upgrade screen. |

**ASO rule:** the first screenshot must show the product doing the thing. No abstract illustrations. No "Meet tono." The four rewrite cards in violet on black is the entire brand promise, in one image.

### 6.3 Hero (landing page)

`docs/designs/landing-tone.html` is the canonical reference.

- Headline: **"four ways to say it."**
- Sub: **"pick one, copy, send."**
- Hero is the live editor, not a screenshot of it.
- Background: pure black, accent glow halo behind the editor frame.
- No scrolling carousel. No testimonials on the hero. The product sells itself.

### 6.4 Pricing card

- `$5.99/mo` for Tono Pro.
- "2 of 3 free today" framing for the free tier — never "unlimited free."
- Show the price as `$5.99/mo` — never `$5.99`, never `$71.88/yr`. The number per month is the unit of comparison.

---

## 7. Iconography

Stroke icons, 1.5px stroke, line caps round, joins round. Color follows `textSoft` default, `accent` when active, `muted` when disabled. Icons are **monoline** — no filled variants except for state indicators (lock, check, dot).

The icon library of record is Lucide (consistent with the web stack). For custom Tono marks (the four-tone icons), source lives in `apps/web/src/components/icons/` and ships as 24px SVGs with the tone accent baked in.

---

## 8. Motion

- Default duration: `normal` (240ms) for almost everything.
- Easing: `standard` (`cubic-bezier(0.2, 0.8, 0.2, 1)`).
- The rewrite editor's transition between original and four rewrites uses `slow` (420ms) — this is the moment of magic, give it room.
- Hover lifts are 1-2px translateY max. No bouncy springs.
- **Reduced motion:** `prefers-reduced-motion: reduce` collapses all durations to 1ms and disables hover lifts. The 4-tone preview is still legible — just instant.

---

## 9. Accessibility — Tono specifics

- All text/background pairs above meet WCAG AA (4.5:1 body, 3:1 large/UI).
- Focus rings are **always visible**. Never `outline: none` without a `:focus-visible` replacement.
- Tap targets ≥ 44px.
- Tone names appear in copy (warmer/clearer/funnier/safer) in addition to their color — color is never the only signal.
- Screen-reader copy never uses ASCII art or emoji.
- The rewrite editor announces tone changes politely: "warmer rewrite generated" rather than "done."

---

## 10. Do / Don't cheatsheet

| Do                                          | Don't                                       |
| ------------------------------------------- | ------------------------------------------- |
| Write headlines in lowercase                | Capitalize Tono copy like a press release   |
| Use one verb per button                     | Write "Click here to rewrite your text"     |
| Show 184 chars                              | Write "your text" in the preview            |
| Map tone name to tone color                 | Show "warmer" in green                      |
| Use the four-tone editor as the hero        | Show a screenshot of the editor on the hero |
| Use `accent` for primary CTAs               | Invent a hex value for a CTA                |
| "tono pro is $5.99/mo"                      | "$5.99" without the unit, or "$71.88/yr"    |
| Write error copy that names the next action | Write "Something went wrong"                |
| Use the global crisis channel tokens        | Roll a Tono-specific danger color           |

---

## 11. What's next

- [ ] Lock the rewrite editor screenshot as the App Store primary in EN-US, EN-GB, ES, DE, FR.
- [ ] Build the four-tone use-case cards (work email / Slack / sales / hard feedback) for the secondary screenshots.
- [ ] Produce a 15-second product reel: paste → split → copy. TikTok + Reels + Shorts.
- [ ] Lock the pro upgrade screen copy: "3 of 3 free today" → "tono pro · $5.99/mo · cancel anytime."

---

_Owner: Mark (Marketing Lead). Clinical authority: n/a (Tono is not a clinical product). Engineering: Gary (CTO). Last updated 2026-07-05._
