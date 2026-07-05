# Legacy: dovginsburg/parentscript

`dovginsburg/parentscript` is the prior active monorepo for ParentScript.
Its main branch (`10394a6`) is the commit from which this repo was
cherry-picked — i.e., the entire active codebase has been moved here.

The legacy repo remains accessible for two reasons:

1. Until this repo is "excellent" (per Dov's 2026-07-05 directive), no
   deletions. The legacy repo is the safety net.
2. PR history in `parentscript` is preserved; the prior 23-commit merge
   (`claude/parentscript-unified-922a7c`) plus the recovered
   `647601e` (production hardening: rate-limit, error-tracking, analytics,
   Dockerfile, ESLint/Prettier/sitemap) are part of the lived history.

## Equivalence

This repo (parentscript-platform) and the legacy repo (parentscript)
have the SAME active code at the time of cherry-pick. The differences
are:

| Concern               | parentscript-platform     | parentscript (legacy)     |
| --------------------- | ------------------------- | ------------------------- |
| Top-level README      | Yes                       | Yes (older)               |
| OWNERSHIP.md          | Yes                       | No                        |
| docs/legacy/maze/     | Yes                       | No                        |
| Top-level CI matrix   | Yes                       | No                        |
| Apps under apps/      | Yes                       | Yes                       |
| Recovery of `647601e` | Carried via 10394a6 merge | Carried via 10394a6 merge |

## Source of truth

Going forward: https://github.com/dovginsburg/parentscript-platform
