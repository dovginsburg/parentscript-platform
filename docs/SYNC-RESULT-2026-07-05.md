# ParentScript + Tono Sync Smoke — 2026-07-05

**Task:** `t_bd79b516` (15-min smoke, re-scoped by Ezra)
**Reporter:** Quinn (QA Process Lead)
**Branch:** `claude/parentscript-unified-922a7c` @ `475dfce`

---

## TL;DR

Both apps load at their apex domains with **0 console / 0 page errors**. The Tono end-to-end flow (apex → login → OAuth → analyze) works. ParentScript has **three P0 bugs** that block the AI coach feature entirely, plus a stale bundle that omits Apple/Google OAuth buttons. PasskeyAuth code is in the bundle but the UI is gated behind an unset feature flag.

| # | Severity | Finding |
|---|---|---|
| P0-1 | **P0** | ParentScript `/api/health` returns SPA HTML (7463 B) instead of JSON. Vercel build produces 0 functions despite `api/health.mjs` and `vercel.json` `functions` config being valid. |
| P0-2 | **P0** | ParentScript frontend calls `/api/coach` (per `apps/web/src/lib/ai-prompts.ts`); same root cause as P0-1 — the entire in-app coaching flow is dead in production. |
| P0-3 | **P0** | Tono's Railway backend `/api/health` returns 404; the web tier serves `/api/health` and `/api/analyze` directly. The Railway deploy referenced by the spec doesn't exist or has been retired. |
| P1-1 | **P1** | ParentScript deployed bundle (`index-BFbg3LiX.js`, 519 KB, July 2) is missing Apple + Google OAuth buttons. Local source + dist (`index-CCZurlzq.js`, 658 KB, July 5 12:26) contain them. Vercel cache is serving the old bundle. |
| P1-2 | **P1** | PasskeyAuth UI is **not rendered** on `/app/login`. Buttons in DOM: only `Sign in` and `Forgot password?`. The Supabase `registerPasskey` / `signInWithPasskey` functions are bundled, but no Passkey button is wired up. |
| P1-3 | **P1** | All recent ParentScript Production deploys (5 errors in last 5m) return ● Error with `Builds: [0ms]` and zero functions in the output array — the `api/*.mjs` functions are never built. The live production alias still points at the July 2 build. |
| P2-1 | **P2** | `/robots.txt` and `/sitemap.xml` on parentscript.app both return the SPA HTML (200, text/html). No SEO surface. |
| P2-2 | **P2** | Tono `/v1/analyze` returns 404; the actual endpoint is `/api/analyze`. Spec mismatch. |
| P2-3 | **P2** | Account migration not tested directly (would need a real Apple/Google round-trip with credentials). The Supabase OAuth client IDs exist (Apple redirect reaches `appleid.apple.com` with `client_id=com.parentscript.app.parentscript-service`), so the redirect URI is correctly configured. The concern about schema migration breaking existing accounts is untestable from the public surface — needs DB access. |

---

## 1. Apex domain load + console health

Both apps serve HTTP 200 at their apex domains with zero console errors and zero page errors in headless Chromium.

| URL | Status | Console errs | Page errs | Title |
|---|---|---|---|---|
| `https://tonoit.com/` | 200 | 0 | 0 | "tono — say what you mean" |
| `https://parentscript.app/` | 200 (→ 307 → `/app/login`) | 0 | 0 | "ParentScript" |

Screenshots: `docs/qa-final/screenshots-jul5/{tono,ps}-apex.png`.

---

## 2. Backend health endpoints

| Endpoint | HTTP | Content-Type | Body | Verdict |
|---|---|---|---|---|
| `https://tonoit.com/api/health` | 200 | `application/json` | `{"status":"ok","ts":1783274466,"id":"71f29d5b","version":"0.3.0","stripe_configured":true,"slack_configured":false,"free_daily_limit":10}` | ✅ JSON |
| `https://tono-backend-production.up.railway.app/api/health` | 404 | `application/json` | `{"detail":"Not Found"}` | ❌ Spec URL is dead |
| `https://parentscript.app/api/health` | 200 | `text/html; charset=utf-8` | SPA `index.html` (7463 B, `last-modified: Thu, 02 Jul 2026 04:38:46 GMT`, `age: 307349` = ~85h) | ❌ **HTML, not JSON** |

### P0-1 / P0-3 root cause

`api/health.mjs` is valid Node code that returns JSON when invoked locally:

```
$ node test_api_health.mjs
status 200 {"ok":true,"service":"parentscript-api","rate_limits":{"default_per_min":60,"coach_per_min":20,"stripe_per_min":30}}
```

But `vercel inspect` on the latest Production deploy (5m ago, status=Error) shows:

```
builds: [{
  entrypoint: ".",
  use: "@vercel/vc-build",
  config: {},
  output: []       <-- ZERO functions built
}]
routes: [/, /app, /app/(.*) -> /index.html, no api routes]
```

Vercel scanned the repo root, ran `@vercel/vc-build` in 0 ms, and produced zero functions despite `vercel.json` declaring `"functions": {"api/*.mjs": {"runtime": "@vercel/node@4.0.0"}}` and `api/health.mjs` + `api/coach.mjs` + `api/lib/rate_limit.mjs` existing at the repo root. **All 4 most-recent Production deploys in the last 5 minutes are ● Error with the same empty-builds pattern.**

The rewrite `^/app(?:/(.*))$ -> /index.html` does NOT match `/api/health`, so the rewrite isn't shadowing the function — the function simply doesn't exist in the deployed artifact.

### Account migration impact (concern #3 from Ezra's scope)

If the api/ functions were deployed, they would call into `apps/web/src/lib/ai-prompts.ts` which streams to `/api/coach`. Because the function isn't deployed, the frontend's `fetch('/api/coach')` receives the SPA HTML (200 OK with text/html), the stream parser fails, and the UI shows a generic error. **The Coach button on `/app/parent-home` is effectively a no-op in production.**

OAuth itself does round-trip. Verified via headless click on Tono's `/login`:

```
> clicking "Continue with Apple" on https://tonoit.com/login
> → https://appleid.apple.com/auth/authorize
     ?client_id=com.parentscript.app.parentscript-service
     &redirect_uri=https%3A%2F%2Fbndbgpqbpzukrbhquztj.supabase.co%2Fauth%2Fv1%2Fcallback
     &response_mode=form_post
     &response_type=code
     &scope=email+name
     &state=6504cb53-...
```

The Supabase project ID `bndbgpqbpzukrbhquztj` matches what the spec described. Schema-migration risk can't be tested from the public surface alone — would need a real `signInWithIdToken` round-trip with a stored credential, or direct DB read on `auth.users` and the new `user_roles` table.

---

## 3. OAuth round-trip on ParentScript — buttons missing

Spec asks to verify Apple + Google OAuth on ParentScript. The Tono side works (above). The ParentScript side **does not render the buttons** in the deployed bundle.

DOM dump of `https://parentscript.app/app/login` after hydration (3.5s wait):

```
buttons: ["Sign in", "Forgot password?"]
links:   ["Sign up", "Sign up free →", "Pricing", "Security & HIPAA",
          "Privacy policy", "Contact support"]
passkey mentioned in DOM:    false
face-id / touch-id in DOM:   false
```

**Yet the source code in this branch contains them.** `apps/web/src/pages/auth/TherapistAuth.tsx:119` renders `<OAuthButtons />`, and `apps/web/src/components/OAuthButtons.tsx:141-174` defines three buttons with labels `Continue with Apple`, `Continue with Google`, `Continue with email`. The local dist bundle `apps/web/dist/assets/index-CCZurlzq.js` contains those strings:

```
$ grep -o "Continue with \(Google\|Apple\|email\)" apps/web/dist/assets/index-CCZurlzq.js
Continue with Apple
Continue with Google
Continue with email
```

The **live bundle** `https://parentscript.app/app/assets/index-BFbg3LiX.js` (519 KB, MD5 `9c4e75f046a2566fc28145938e1f26cb`) does NOT contain those strings — only `Sign in`, `Sign up`, `Back to sign in`, `Redirecting you to sign in…`. Hash mismatch with the local dist (`index-CCZurlzq.js`, 658 KB, MD5 `a1b61a8483b2a2571ccf62a95626831d`). The Vercel production alias is pointing at a stale build from July 2.

### Why Vercel hasn't shipped the new bundle

All four most-recent Production deploys returned ● Error with the same pattern (Builds: [0ms], zero functions). The 5 most recent Preview deploys also failed. Vercel has been trying to redeploy (5 errors in the last 5 minutes) but each one fails because of the missing api/ function build, and because the build fails Vercel never promotes the new bundle either.

---

## 4. PasskeyAuth — code present, UI absent

`@supabase/supabase-js@2.46.1` exposes `auth.registerPasskey()` and `auth.signInWithPasskey()` as **experimental** APIs. Both are bundled into `apps/web/dist/assets/index-CCZurlzq.js`:

```
$ grep -oE "(registerPasskey|signInWithPasskey|navigator\.credentials\.create)" \
  apps/web/dist/assets/index-CCZurlzq.js
registerPasskey
signInWithPasskey
navigator.credentials.create
```

But the login page UI does not surface them:

- No "Use your device" / "Use Face ID" / "Use Touch ID" button rendered.
- `document.body.innerText` after hydration does not contain "passkey" anywhere.
- Feature flag key `parentscript.featureFlags.v1` reads `{}` (empty) in localStorage.

### Headless WebAuthn virtual authenticator test

Attached a virtual CTAP2 authenticator via Chrome DevTools Protocol (`WebAuthn.addVirtualAuthenticator`, hasResidentKey=true, isUserVerified=true). `navigator.credentials.create` is callable (`is_public_key_capable: true`). But because no UI button triggers the call, there's nothing to click — the authenticator sits idle.

### Path to fix

Either:
1. Add a "Sign in with passkey" button to `apps/web/src/pages/auth/TherapistAuth.tsx` that calls `supabase.auth.signInWithPasskey()`, OR
2. Wire the existing OAuthButtons component to also surface a passkey option when `navigator.credentials` is available, OR
3. Add a feature flag (`passkeySignIn` in `apps/web/src/lib/featureFlags.ts`) and turn it on for testers.

(3) is the safest path because Supabase labels the API as `experimental` — keeping it behind a flag means real users don't see it until we want them to.

---

## Evidence files (this smoke)

```
docs/qa-final/qa_smoke_jul5.py              # initial 4-target smoke
docs/qa-final/qa_smoke_jul5_round2.py       # round-2: passkey UI, Apple click, bundle hash
docs/qa-final/smoke-jul5-results.json       # raw results, round 1
docs/qa-final/smoke-jul5-round2.json        # raw results, round 2
docs/qa-final/screenshots-jul5/             # 7 screenshots
```

Plus prior harness outputs in `docs/qa-final/{analyze-results.json, oauth-results.json, ps-auth-results.json, deep-results.json}` from the earlier (failed-on-budget) full-matrix run — still useful as a baseline.

---

## Recommended next actions (for Dov to triage)

1. **Diagnose the empty `builds` array.** `vercel inspect dpl_2YoLLB3H4EHXsk2Ge8gzisWW5XS4` shows `output: []` from `@vercel/vc-build`. Vercel isn't picking up `api/*.mjs`. Possible causes: (a) `api/` not at the root Vercel is deploying from, (b) `.vercelignore` excluding it, (c) `functions` config syntax wrong for `@vercel/node@4.0.0`. **Owner: Gary.** Until this is fixed, every deploy will fail and the existing live build will keep drifting behind `main`.
2. **Promote a working build.** Once #1 is fixed, force a fresh Production deploy (or rollback to `c4ha6xdsu` from the Vercel deploy list, which was ● Ready at the 2-hour mark). The local dist already has Apple + Google buttons baked in.
3. **Decide on PasskeyAuth.** Wire it behind `passkeySignIn` flag and test with two browsers (residentKey required for sign-in without username). Or punt to v2 if the priority is the backend deploy.
4. **Mark Tono Railway backend as retired.** `https://tono-backend-production.up.railway.app/api/health` returns 404. Either Tono's `api/*` was migrated to the web tier (verifies — see §2 table row 1) or the Railway service was deleted. Update the team docs so other agents don't loop on it.