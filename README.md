# ParentScript Platform

The canonical multi-platform monorepo for **ParentScript** (Amazed Labs) — parenting super-app with clinical grounding, a coaching marketplace, and a per-child growth tracker.

This repo is the source of truth during the build-out. Legacy repos remain read-only:

- `dovginsburg/parentscript` — the prior active monorepo. Carries the same code; this repo was created so ownership is unambiguous.
- `dovginsburg/maze` — the older Capacitor-wrapped iOS/Android prototype. iOS template, Vite/React frontend, and `api/` legacy backend. Preserved as historical reference under `docs/legacy/maze/`.

## What's here

```
parentscript-platform/
├── apps/
│   ├── android/            # Capacitor-wrapped Android shell
│   ├── backend/            # Node.js safety-guarded backend
│   │   ├── middleware/     # rate-limit, error-tracking (added 647601e)
│   │   ├── server.mjs
│   │   ├── safety-guard.mjs
│   │   └── Dockerfile      # multi-stage, non-root user
│   ├── browser-extension/  # Manifest V3, content scripts
│   ├── desktop/            # Tauri 2 desktop shell
│   ├── fastlane/           # Fastlane config shared by iOS/Android
│   ├── ios/                # Capacitor-wrapped iOS + SwiftPM bridge
│   ├── slack-app/          # Slack Bolt app (parenting coach in Slack)
│   └── web/                # Next.js 14 web app (parentscript.app)
├── api/                    # Vercel serverless functions
├── docs/                   # Brand, business, design, marketing, expansion
│   └── legacy/maze/        # Historical docs preserved from maze
├── packages/               # Shared libraries
│   ├── design/             # Design tokens / system
│   └── shared/             # Cross-platform shared types, schemas, utils
├── scripts/                # Repo-level scripts
├── .github/workflows/      # 4 app-scoped + 1 platform-level CI workflows
├── apps/web/public/sitemap.xml
└── … (eslint, prettier, vercel.json, package.json)
```

Each platform has its own CI workflow in `apps/<name>/.github/workflows/`. The top-level `.github/workflows/ci.yml` runs them in parallel as a CI matrix gate.

## Sync direction

- **Source of truth:** `dovginsburg/parentscript-platform` (this repo).
- **Legacy:** `dovginsburg/parentscript` and `dovginsburg/maze` are read-only archives.
- Cross-platform shared logic lives in `packages/shared/` and `packages/design/`.
- Per-platform product code lives in `apps/<name>/`. Cross-app imports go through `packages/`, never direct.

## Local development

```bash
# Web
cd apps/web && npm install && npm run dev

# Backend
cd apps/backend && npm install && npm test

# Slack app
cd apps/slack-app && npm install && npm run dev
```

iOS and Android builds use the Capacitor wrappers — see `apps/ios/scripts/` and `apps/android/`. Desktop is a Tauri 2 build — see `apps/desktop/`.

## More

- `OWNERSHIP.md` — canonical home per platform (no migration mid-flight)
- `docs/PLATFORM_VISION.md` — product roadmap
- `docs/INFRASTRUCTURE.md` — hosting, deployments, secrets
- `docs/legacy/maze/` — historical reference from the prior `maze` repo
