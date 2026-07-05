# OWNERSHIP — ParentScript Platform

The canonical repo for every ParentScript surface. Where two platforms live, this table names the home.

## Canonical home

| Surface | Canonical location | Notes |
|---|---|---|
| Web app (parentscript.app) | `apps/web/` | Next.js 14. Deployed to Vercel. |
| Backend API | `apps/backend/` | Node.js, ESM. Safety-guard middleware (`safety-guard.mjs`), rate-limit (`middleware/rate-limit.mjs`), error-tracking (`middleware/error-tracking.mjs`). |
| Vercel serverless functions | `api/` | Top-level for Vercel's automatic function discovery. |
| Browser extension | `apps/browser-extension/` | Manifest V3. |
| Desktop (Tauri 2) | `apps/desktop/` | Wraps the web bundle. |
| Mobile — iOS | `apps/ios/` | Capacitor wrapper + SwiftPM CapApp-SPM bridge. |
| Mobile — Android | `apps/android/` | Capacitor wrapper. |
| Slack app | `apps/slack-app/` | Slack Bolt app. |
| Mobile release automation | `apps/fastlane/` | Fastlane shared by iOS/Android. |
| Shared design tokens | `packages/design/` | |
| Shared utilities, types, schemas | `packages/shared/` | |
| Brand, docs, marketing | `docs/` | Top-level docs. |
| Repo-level scripts | `scripts/` | |
| CI workflows (top-level orchestrator) | `.github/workflows/ci.yml` | Matrix dispatch across all platforms. |
| CI workflows (per-app) | `apps/<name>/.github/workflows/*.yml` | Run when the app's `apps/<name>/**` changes. |

## Legacy repos (read-only)

| Legacy repo | Reason archived | What it holds that this repo preserved |
|---|---|---|
| `dovginsburg/parentscript` | Became the unification zone, then was superseded by this repo | All apps/ + docs/ + packages/ + configs carried here |
| `dovginsburg/maze` | Pre-monorepo state (flat Vite/React + iOS/Android Capacitor at root + api/ at root) | Historical docs only — `docs/legacy/maze/` |

## Source-of-truth rules (enforced for the build-out)

1. **No cross-app imports.** Apps import from `packages/shared/` and `packages/design/`, never from another `apps/*` directly.
2. **No `maze`-style flat structures.** Every platform lives under `apps/<name>/`.
3. **Top-level docs only.** Per-app docs go in `apps/<name>/docs/` (e.g. iOS-specific copy in `apps/ios/docs/`).
4. **CI is layered.** Per-app CI under `apps/<name>/.github/workflows/` runs on per-app PRs. The top-level `.github/workflows/ci.yml` runs the whole matrix on platform-wide PRs.
5. **One canonical schema per concern.** Vercel functions at top-level `api/` use the same handler signatures as `apps/backend/server.mjs`.

## Replacement policy

Until this repo is "excellent" (per Dov's 2026-07-05 directive), no deletions of the legacy repos. Once excellent, the legacy repos become archives and `OWNERSHIP.md` becomes the single source of truth.
