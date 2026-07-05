# ParentScript — Unified Platform

> Status: Live web app, scaffolded iOS + Android. Building out the rest.
> Mission: Develop ParentScript as a unified multi-platform product.

## ParentScript

A two-sided companion app for parents working with a child therapist.

- **Therapist side:** manages clients, unlocks skills session-by-session, structured notes.
- **Parent side:** unlocked skill cheat sheets, "In-the-Moment" coaching, practice logging.

## Brand

- **Product:** ParentScript (vertical under MAZE)
- **Studio:** AMAZED Labs (Dov + Ariella)
- **Tagline:** "When you're lost in the middle, MAZE brings you back to the top."
- **Aesthetic:** light/indigo, sentence case, clinical-warmth

## Tech stack

| Layer         | Tech                                                |
| ------------- | --------------------------------------------------- |
| **Web**       | React + Vite + TypeScript + Tailwind                |
| **Mobile**    | Capacitor (iOS, Android)                            |
| **Desktop**   | Tauri (planned)                                     |
| **Backend**   | Python FastAPI (`api/`)                             |
| **Auth + DB** | Supabase (Postgres + Auth + RLS)                    |
| **Hosting**   | Vercel (web), App Store (iOS), Play Store (Android) |

## Surfaces

| Surface                  | Status                              |
| ------------------------ | ----------------------------------- |
| Web PWA                  | ✅ Live at https://parentscript.app |
| iOS (Capacitor wrap)     | 🟡 Scaffolded in `ios/`             |
| Android (Capacitor wrap) | 🟡 Scaffolded in `android/`         |
| Desktop (Tauri)          | 🔲 Not started                      |
| Chrome extension         | 🔲 Not started                      |
| Slack app                | 🔲 Not started                      |

## Monorepo target

```
parentscript/
├── apps/
│   ├── web/         # Vite + React (current src/)
│   ├── backend/     # FastAPI (current api/)
│   ├── ios/         # Capacitor (current ios/)
│   ├── android/     # Capacitor (current android/)
│   ├── desktop/     # Tauri (new)
│   └── browser-extension/
├── packages/
│   ├── shared/      # TS types + API client + i18n
│   └── design/      # Mark's design tokens
├── docs/
├── fastlane/
└── supabase/
```

## Hard constraints

1. **Role-based RLS** — therapist sees only their clients.
2. **No PHI in v1** — non-identifying labels only.
3. **Clinical safety rail** — author: Mira. Never bypass crisis scripts.
4. **Evidence-based skills** — Mira signs off every cheat sheet.
5. **Separate from Tono** — different product, different repo, different brand.

## Authoritative docs (read first)

- `docs/PLATFORM_VISION.md` — architecture vision
- `docs/PLATFORM_BLUEPRINT.md` — extension blueprint
- `docs/BUILD_PLAN.md` — full build spec
- `docs/CLINICAL_GLOSSARY.md` — terminology

## Reference: Tono's parallel work

Claude did the same exercise on `dovginsburg/Tono-` branch
`claude/tono-globalization-rzoqc7`. Pattern: scaffold monorepo →
brand → account layer → billing → iOS scaffold → Postgres/Redis →
CI/migrations → UI across platforms.

## Git workflow

- Default branch: `main`
- Claude's work branch: `claude/parentscript-unified-*` (use a new suffix per run)
- Commit author: set to `dovginsburg@users.noreply.github.com` (Dov's noreply — required for Vercel deploys to pass team-gate)
- Push to origin as you go
- One commit per logical unit of work
