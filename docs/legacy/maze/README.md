# Legacy: dovginsburg/maze

These documents are preserved from `dovginsburg/maze`, the pre-monorepo
Capacitor-wrapped prototype. They are read-only historical reference.

`maze` (now archived) had a flat structure: a Vite/React frontend at root,
`api/` for backend, `ios/` and `android/` as Capacitor-wrapped shells at
root level, and `src/` for the SPA. None of that code is current; the
modern consolidated monorepo lives at this repo's `apps/` directory.

## What was preserved

- `SECURITY_AUDIT.md` (26 KB) — security audit of the maze/iOS prototype.
- `BUGS.md` (12 KB) — bug log from the maze era.
- `BUG_REPORT.md` (15 KB) — formal bug report from maze.
- `DNS_SETUP.md` (8 KB) — DNS configuration notes from maze.
- `EMAIL_SETUP.md` (18 KB) — transactional email wiring notes from maze.

## What was NOT preserved

- `maze/.herenow/` — here.now publishing metadata (auto-generated)
- `maze/.quinn-verify/` — Quinn's QA artifact (binary iOS payload)
- `maze/node_modules/`, `maze/dist/`, `maze/dev-dist/` — build outputs
- `maze/src/` — React/Vite code, superseded by `apps/web/`
- `maze/api/` — node.js API code, superseded by `apps/backend/`
- `maze/ios/`, `maze/android/` — Capacitor wrappers, superseded by
  `apps/ios/` and `apps/android/`

## Replacement policy

Per Dov's directive (2026-07-05), no deletions of legacy repositories
until this repo is "excellent". Once `parentscript-platform` is excellent
and stable, `maze` becomes read-only.

## Source of truth

The active code is here: https://github.com/dovginsburg/parentscript-platform
