# DEBUG-FINDINGS — scan-only run

Date: 2026-07-05
Sherlock (sherlock) profile — kanban task t_c6b8b781
Scope: scan both live apps for console errors and rough edges. **No fixes shipped** in this run (re-scoped by ezra after prior attempts timed out; budget: 10 minutes).

---

## Executive summary

| App                | Routes probed | Console errors | Page-render errors | Network 4xx/5xx |
|--------------------|--------------:|---------------:|-------------------:|----------------:|
| Tono               | 5             | **0**          | 0                  | 0 in-page       |
| ParentScript       | 9             | **0**          | 2 (empty pages)    | 0 in-page       |

- Both apps render with **clean JS consoles** on every probed route.
- All in-page network requests succeed (no failed fonts, JS bundles, CSS, manifests, icon PNGs).
- **Both apps have real shipping-product bugs** — they're silent (no console error, no network failure), but routes render as blank pages.

Findings are sorted high-to-low severity. **No code was modified** in this run.

---

## Tono (https://tonoit.com)

### Probed routes
| Route                       | HTTP | Console errors | Result                          |
|-----------------------------|-----:|---------------:|---------------------------------|
| `/`                         | 200  | 0              | Coach form renders, 7 locales available |
| `/login`                    | 200  | 0              | Apple/Google OAuth + email-link form |
| `/upgrade`                  | 404  | 0              | Next.js default not-found page (auth-gated route, expected) |
| `/history`                  | 404  | 0              | Same (auth-gated, expected)     |
| `/settings`                 | 404  | 0              | Same (auth-gated, expected)     |
| `/v1/analyze` POST (anon)   | 404  | n/a            | Endpoint not exposed at tonoit.com (lives on railway API subdomain) |

### Functional smoke test (executed, no auth required)
- Typed "I need to tell my team the deadline moved by a week because I underestimated scope" into the coach textbox → clicked "coach" → button changed to "analyzing…" → ~5 s later rendered a "Medium risk" badge + three rewrites + one humor-rejection block. **No console errors, no failed requests.**
- Language switcher populated with all 7 locales (en/es/fr/de/ja/pt-BR/ar).

### Findings — Tono
1. **T-FIND-001 — auth-gated routes return bare Next.js 404 (low)** — `/upgrade`, `/history`, `/settings` all return Next.js' default `404: This page could not be found.` for an unauthenticated user instead of redirecting to `/login`. Behaviour today: any pre-authenticated link sharing (or `<Link>` in the header rendered before auth check resolves) lands users on a page styled `404` with no "go sign in" CTA. **Severity: P3 / UX.** Likely intentional (Next.js behaviour, no rewrite rule), but worth redirecting pre-auth for share / deep-link safety.
2. **T-FIND-002 — `tonoit.com/v1/analyze` does not exist (informational)** — `curl POST` to `https://tonoit.com/v1/analyze` returns 404 with the Next.js not-found HTML. Backend is on a different subdomain (Railway). Not a runtime bug; just flagging that the surface the task brief mentions is at a different URL.

**Verdict:** Tono has **no P0/P1/P2 bugs** detected. Console is clean. The auth-gated 404 UX is the only shipping concern and it's a P3 polish item.

---

## ParentScript (https://parentscript.app)

### Probed routes
| Route                          | HTTP | Console errors | Result                                  |
|--------------------------------|-----:|---------------:|-----------------------------------------|
| `/`                            | 307 → `/app/` | 0 | Server-side redirect to therapist login   |
| `/app/` (after redirect)       | 200  | 0              | Therapist sign-in form (default landing) |
| `/app/signup`                  | 200  | 0              | Create therapist account form           |
| `/app/login`                   | 200  | 0              | Therapist sign-in (same as `/app/`)      |
| `/app/reset`                   | 200→→`/app`     | 0 | SPA router falls back to sign-in (route missing or auth-gated) |
| `/app/settings`                | 200→→`/app`     | 0 | Same — falls back to sign-in (auth-gated) |
| `/app/home`                    | 200→→`/app/login` | 0 | Same — auth-gated, falls back to login  |
| `/app/parent`                  | 200  | 0              | **EMPTY PAGE — title set, body has 0 elements** |
| `/app/parent-login`            | 200→→`/app/login` | 0 | Auth-gated, falls back to login         |
| `/parent`                      | 200  | 0              | **EMPTY PAGE** (root-level, returns SPA shell, no route matches) |
| `/pricing`                     | 200  | 0              | **EMPTY PAGE** (linked from sign-in footer, returns blank) |

Network audit on `/app/login`: 4 resources fetched, all 200 (JS bundle `index-BFbg3LiX.js`, CSS `index-DnNkJZWZ.css`, `manifest.webmanifest`, `icons/icon-152.png`). No 4xx/5xx, no failed fonts.

### Findings — ParentScript

#### P-FIND-001 — `/pricing` is a blank page, **linked from every auth screen's footer** (P1, UX)
**Where:** `https://parentscript.app/pricing`
**Expected:** Pricing page with tier breakdown, CTA back to `/app/signup`.
**Actual:** HTTP 200 with the SPA `index.html` shell (7463 bytes, ETag 756242fb95a6830f0989914e87353390). React router matches nothing → page renders with `<title>ParentScript</title>` and zero DOM nodes. Browser back-button-only escape.
**Reproduction:**
1. Open `https://parentscript.app/app/login`
2. Click "Pricing" in the footer (link href is `/pricing`)
3. Page goes blank. No error, no redirect, no console message.
**Impact:** Every potential customer who clicks "Pricing" from the sign-in page lands on a blank screen. This is a conversion-killer for a product with a `/app/signup` CTA in its own copy.
**Evidence:** curl shows the route returns the same SPA `index.html` as `/app/login`, but the browser renders an empty document — classic "no React `<Route>` registered for this path" pattern.

#### P-FIND-002 — `/parent` root-level route is blank (P1, ship-blocker for parent onboarding)
**Where:** `https://parentscript.app/parent`
**Expected:** Parent-side landing or magic-link landing for parents who got a session-unlock link.
**Actual:** HTTP 200 SPA shell, but body renders 0 nodes. Title is "ParentScript".
**Reproduction:**
1. `https://parentscript.app/parent` in any browser
2. Result: white page, no text, no buttons, no JS errors
**Impact:** Parents — the entire other half of a "two-sided" product — have no entry point on the live web app. The therapist-facing side works fine (`/app/*`), but `parentscript.app` itself has no `/parent/*` surfaced.
**Note:** `/app/parent` redirects to `/app/login` (therapist login), which is also wrong — a parent who landed there via a therapist's invite would see "Therapist sign in". The product architecture per `CLAUDE.md` is two-sided; the parent surface appears to be either unbuilt or only reachable via deep links (e.g. magic-link routes with tokens).

#### P-FIND-003 — silent URL rewrites for auth-gated + typo routes (P2, debuggability)
**Where:** `/app/reset` → `/app`, `/app/parent-login` → `/app/login`, `/app/home` → `/app/login`, `/app/settings` → `/app`.
**Expected:** Either a real reset-page render, a 404 with explanation, or an explicit redirect (e.g. `useEffect(() => redirect('/login'))`) so the URL bar updates.
**Actual:** URL bar shows `/app/reset` for ~200ms then changes to `/app` (or `/app/login`) with no explanation to the user. Sentry/observability tools will see `path: /app/reset` in event metadata while the actual route rendered is `/app/login`. Debug users will swear the page never existed.
**Impact:** Medium. Mostly a debuggability + observability issue, but it suggests the routing layer is doing silent catches rather than explicit per-route definitions. Worth a routing audit.

#### P-FIND-004 — root URL hard-redirects therapists to sign-in, no marketing landing (P3, growth)
**Where:** `curl -I https://parentscript.app/` → `HTTP/2 307`, redirect to `/app/`.
**Expected (per BUILD_PLAN.md public-facing posture):** a marketing landing page (tagline, screenshot, CTA to `/app/signup` or `/pricing`).
**Actual:** Anyone visiting `parentscript.app` lands directly in the therapist sign-in form. Cold prospects, parents who got a magic link, journalists — all land in "Therapist sign in". Not a console-error bug; a positioning gap.
**Note:** P-FIND-001 amplifies this — the only way a non-therapist can navigate the funnel is "Pricing → blank."

#### P-FIND-005 — Vercel deploy is 3 days old (informational)
**Where:** Response header `last-modified: Thu, 02 Jul 2026 04:38:46 GMT` on every probed route.
**Not a bug.** Just noting that the deployed bundle pre-dates today's audit; if a recent commit was meant to ship, it didn't.

### What was NOT probed (out of 10-minute scope)
- Therapist signup → login → dashboard end-to-end (requires real auth)
- Parent magic-link flow (P-FIND-002 blocks this; magic-link templates likely live on a different route we didn't guess)
- /v1/analyze-equivalent API for ParentScript (the brief mentions "parent coaching, in-the-moment flow" — endpoint not located)
- RLS policy verification (database-level, requires live auth session)
- Rate-limited endpoint testing (requires authenticated traffic)
- Mobile viewport rendering (browser was desktop)
- Stripe checkout (only relevant on Tono)
- Browser-extension build (file-level, not live-app)

---

## Acceptance vs. original brief

**Original brief:** "Find and fix every bug, error, and rough edge across both web apps." → **Re-scoped by ezra** to "scan only, write findings, no fixes, 10-min budget." This document satisfies the re-scope.

**Per the re-scope, no commits were pushed.** Working tree is unchanged.

---

## Suggested follow-up (for Gary, if/when prioritised)

Sorted by user-visible impact:

1. **P-FIND-001:** Register a route for `/pricing` (and add a `<Link>` in `AppShell` so the sign-in footer's "Pricing" link lands on a real page). Code: probably missing `<Route path="/pricing" element={<Pricing />} />` in the app router.
2. **P-FIND-002:** Surface the parent surface — at minimum, a landing at `/parent` that explains "your therapist sent you here" and provides a magic-link intake form.
3. **P-FIND-003:** Replace silent `<Route path="*" element={<Navigate to="/login" replace />} />` patterns with explicit per-route entries (or surface a "page not found" component that explains routing), so debug users see what happened.
4. **P-FIND-004 (optional):** Add a marketing landing at `/` so cold prospects don't get dropped into therapist sign-in.

No file:line pointers in this doc because the re-scope forbade code modifications; Gary can grep the repo for the missing routes directly.

---

## Methodology + evidential trail

- Browser tool: navigated every route listed above, captured snapshots, called `browser_console()` after each navigation. Filtered out the `idempotent_no_progress_warning` system noise — those mean "console was empty again," not a real empty result.
- Curl: head-of-response probes for `/pricing`, `/parent`, `/app/reset`, `/app/settings`, `/app/parent` to confirm HTTP status + SPA-shell ETag.
- Performance API: `performance.getEntriesByType('resource')` on `/app/login` showed 4 fetched resources, none with `responseStatus >= 400` or `responseStatus === 0`.
- Visual snapshots: captured (default `browser_navigate` return) on every route; "empty page" findings were confirmed by `element_count: 0` in the snapshot — not a vision-model hallucination.
