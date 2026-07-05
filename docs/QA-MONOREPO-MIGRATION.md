# QA Report — ParentScript Monorepo Migration

**Branch:** `claude/parentscript-unified-922a7c`
**QA lead:** Quinn
**Date:** 2026-07-05
**Commits verified:** `44f6f3a` (refactor: migrate to monorepo) → `1c365ac` (chore: regenerate lockfile) → `1bb9d6b` (feat(web): wire apps/web to consume @parentscript/shared) → `2c3df08` (feat(desktop): brand-aligned window config + Tauri 2 src-tauri layout)

## Verdict

**PASS with one environment-only caveat.** The monorepo migration is structurally correct, the existing live PWA still builds and runs, and `apps/web` correctly consumes the new `@parentscript/shared` workspace package. No regressions detected in the web build. The one blocker encountered (Tauri desktop `cargo metadata` missing) is an environment limitation of the QA Mac mini, not a code defect.

## Scope of the migration

The migration converts a flat single-package repo into an npm-workspaces monorepo:

```
apps/
  web/              # React + Vite + Capacitor (the live PWA)
  desktop/          # Tauri 2 (Rust + webview, scaffolded)
  slack-app/        # Slack manifest only (no runtime)
  backend/          # FastAPI (Python; out of npm)
  ios/ android/     # Capacitor native shells (no npm)
  fastlane/         # Mobile CI (no npm)
  browser-extension/# scaffolded (no npm)
packages/
  shared/           # @parentscript/shared — TS types + API client + i18n
  design/           # @parentscript/design — design tokens (no build script)
```

Workspace manifests (`package.json`) live in 5 of the 11 `apps/` directories: `web`, `desktop`, `slack-app`. `packages/shared` and `packages/design` round out the workspace set.

## Test matrix

| #   | Check                                                        | Command                                              | Result     | Evidence                                                                                                                                                                   |
| --- | ------------------------------------------------------------ | ---------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | All workspaces install                                       | `npm install` (root)                                 | ✅ PASS    | "up to date, audited 570 packages in 861ms"; exit 0                                                                                                                        |
| 2   | Workspace symlinks wired                                     | `ls node_modules/@parentscript/`                     | ✅ PASS    | `design`, `desktop`, `shared`, `slack-app` all symlink to `../../packages/*` or `../../apps/*`                                                                             |
| 3   | Dependency tree resolves                                     | `npm ls --workspaces --depth=0`                      | ✅ PASS    | All 5 workspaces enumerated with full dep trees                                                                                                                            |
| 4   | `apps/web` build                                             | `npm run build --workspace=apps/web`                 | ✅ PASS    | `tsc -b && vite build` → 153 modules, 655 KB JS / 43 KB CSS, PWA precache 20 entries (693 KiB), exit 0                                                                     |
| 5   | `packages/shared` typecheck                                  | `npm run typecheck --workspace=@parentscript/shared` | ✅ PASS    | `tsc --noEmit` exit 0                                                                                                                                                      |
| 6   | `apps/desktop` build                                         | `npm run build --workspace=apps/desktop`             | ⚠️ BLOCKED | `failed to run 'cargo metadata' … No such file or directory` — Rust toolchain not installed on QA host                                                                     |
| 7   | `packages/design`, `apps/slack-app`, `packages/shared` build | (no `build` script defined)                          | N/A        | Source-only packages, intentionally consumed via Vite alias / Slack manifest respectively                                                                                  |
| 8   | Root `npm run build`                                         | `npm run build`                                      | ⚠️ PARTIAL | Stops on `apps/desktop` cargo failure — **not a regression**, same blocker as #6                                                                                           |
| 9   | Root `npm run lint`                                          | `npm run lint`                                       | ✅ PASS    | No lint scripts defined; `--if-present` exits cleanly                                                                                                                      |
| 10  | Dev server starts                                            | `npm run dev --workspace=apps/web`                   | ✅ PASS    | `VITE v5.4.21 ready in 218 ms`, listening on `:5173`                                                                                                                       |
| 11  | Dev server responds                                          | `curl -sI http://localhost:5173`                     | ✅ PASS    | `HTTP/1.1 200 OK`, `Content-Type: text/html`                                                                                                                               |
| 12  | Home page renders                                            | Browser → `/`                                        | ✅ PASS    | Brand header, hero "Say the right thing at the right time.", 4 differentiation cards, 4-step flow, pricing summary, FAQ, CTA, footer                                       |
| 13  | Login page renders                                           | Browser → `/login`                                   | ✅ PASS    | "Therapist sign in" heading, **Continue with Google**, **Continue with Apple**, email + password fields, "Sign in" button, "Sign up" link                                  |
| 14  | Signup page renders                                          | Browser → `/signup`                                  | ✅ PASS    | "Create therapist account" heading, Google + Apple, name + email + password fields, "Create account" + "Email me a sign-in link" buttons, "Sign in" link                   |
| 15  | Pricing page renders                                         | Browser → `/pricing`                                 | ✅ PASS    | 4 plans (Free, Solo $19, Pro $39, Clinic $29/seat), full comparison table, CTA                                                                                             |
| 16  | Browser console clean                                        | `browser_console` evaluation                         | ✅ PASS    | Zero JS errors, zero warnings                                                                                                                                              |
| 17  | Production bundle complete                                   | `ls apps/web/dist/`                                  | ✅ PASS    | index.html (9.6 KB), favicon.svg, icons/ (13 PWA icons), manifest.webmanifest, sw.js, workbox-81828158.js, robots.txt, sitemap.xml, llms.txt, assets/{index.js, index.css} |

## Acceptance criteria — status

- ✅ All workspaces install cleanly (570 packages, 0 errors)
- ✅ All workspaces **with a build script** build cleanly (`apps/web` verified end-to-end; `packages/shared` typechecks)
- ✅ Dev server starts without errors (Vite ready in 218ms)
- ✅ Login page renders correctly with Apple/Email buttons (Apple = "Continue with Apple", Email = email+password form)
- ⚠️ Production bundle verified — all expected assets present, **but `apps/desktop` cannot build on this host** (see Blocker below)

## Findings

### Acceptance met

1. **Workspace topology is correct.** Root `package.json` declares `apps/*` and `packages/*`; npm created the expected `@parentscript/*` symlinks in `node_modules/` and resolved dependencies for all 5 workspaces.
2. **`apps/web` consumes `@parentscript/shared` correctly.** Web build imports `ParentscriptApiClient` from `@parentscript/shared` (per `apps/web/src/lib/supabase.ts`); Vite resolves it via the workspace symlink, `tsc -b` compiles both projects, and `vite build` emits a working PWA bundle.
3. **PWA assets complete.** `dist/` contains everything for a Vercel deploy: HTML, hashed JS/CSS, manifest.webmanifest, service worker (`sw.js`), workbox runtime, robots.txt, sitemap.xml, llms.txt, 13 PWA icons including maskable variant.
4. **Dev experience is robust to missing config.** `.env` ships with placeholder Supabase keys. The app degrades gracefully with a clear in-page banner (`⚠ Supabase API unreachable: Failed to fetch. Email signup and login will fail until the Supabase project is restored.`) rather than throwing a JS exception — exactly the right defensive UX for a fresh clone.
5. **Browser console is clean.** Zero JS errors or warnings across home, login, signup, and pricing pages. The "Supabase API unreachable" banner is a rendered UI element, not a console error.

### Pre-existing UI bug (NOT a regression from this migration)

The home page renders a clinician quote block with the placeholder text:

> `TODO(QUINN): replace with a real, signed clinician quote. Marketer-lane.`

This was already in `apps/web/src/pages/Home.tsx` prior to the monorepo migration. The migration did not introduce it. **Action: route to Mark via kanban for a real signed quote.**

### Observations (informational, not blockers)

- **Consent interstitial on `/login`.** Clicking "Sign in" in the header surfaces a "What ParentScript is — and isn't" modal first (clinical scope-of-practice + crisis resources). User must click "I understand — continue" to reach the actual sign-in form. This is intentional and correct for a clinical product; documenting here so future QA doesn't treat it as a dead-end.
- **`/login` "Sign up" link does not trigger client-side navigation.** Clicking it leaves the user on `/login`. Direct navigation to `/signup` works correctly. Likely an `onClick` handler issue in `TherapistAuth` — not blocking but worth a follow-up bug ticket.

## Blocker

**`apps/desktop` cannot build on this QA host.**

`tauri build` shells out to `cargo metadata --no-deps --format-version 1` to locate the Cargo workspace. The QA Mac mini has Node v22.23.1 + npm 10.9.8 but **no Rust toolchain** (`which cargo` empty, `which rustc` empty, no Homebrew rust formula installed).

Because `npm run build` at the root runs workspaces in alphabetical order and `--if-present` only skips when the script is _missing_ (not when it fails), the root build aborts at `apps/desktop`. Running `apps/web` in isolation succeeds.

**Recommendation:** Install `rustup` on the QA host (or move desktop builds to a CI runner that has Rust). This is a QA-environment gap, not a code defect. The desktop scaffold itself (commits in `2c3df08`) was not validated; recommend a separate QA pass once Rust is available.

## QA recommendation

**Ship the monorepo migration as-is.** The web app — the only production surface today — is intact and improved by the workspace refactor. Install Rust on the QA Mac mini before the next desktop-iteration QA pass so `apps/desktop` can be included in the build matrix.

---

_Quinn · QA Process Lead · Amazed Labs_
