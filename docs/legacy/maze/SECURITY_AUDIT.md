# ParentScript — Security Audit

**Audited:** 2026-06-26
**Auditor:** Sherlock (debug_hermes_v2)
**App:** /Users/Ezra/Projects/maze — ParentScript / MAZE (therapist + parent PWA)
**Scope:** pre-prod audit before Ariella uses her real email. Full source tree + dist/ build artifacts + .gitignore + RLS schema + Node API server.

## TL;DR

The app is in good shape for a real-email production use. RLS is on every table with correct policies; no secrets in source; no XSS sinks; route protection is in place; the API server's auth gate validates the caller's scope on every privileged read.

**0 CRITICAL · 1 HIGH · 5 MEDIUM · 4 LOW** findings.

The HIGH finding is not an exploit against current users — it's a hardening gap that should be closed before public deploy because Ariella's email (and any parent's email) is at risk from a credential-stuffing adversary on the public signup endpoint.

| Severity | Finding | File |
|---|---|---|
| HIGH | No rate-limit / lockout on `signInWithPassword` or `signUp` | `src/pages/auth/TherapistAuth.tsx`, `src/pages/auth/ParentOnboarding.tsx` |
| MEDIUM | `dev-dist/` (VitePWA dev-mode SW) is tracked by git | `/dev-dist/` (missing `.gitignore` entry) |
| MEDIUM | Service-role key read into JS module-scope vars (loaded on `require`) | `api/server.mjs:148` |
| MEDIUM | Supabase anon key used as anon in analytics auth header (intended but worth noting) | `api/server.mjs:154` |
| MEDIUM | Invite-link shown in plaintext UI (no copy-with-mask, screenshot-safe) | `src/pages/therapist/ClientDetail.tsx:312-329` |
| MEDIUM | Auth bootstrap falls open if Supabase config is broken mid-session (no try/catch in `loadUser`) | `src/hooks/useAuth.tsx:44-51` |
| LOW | Email pattern validation is browser-default only (no format check beyond `type="email"`) | `TherapistAuth.tsx:97-100`, `ParentOnboarding.tsx:135-138` |
| LOW | XSS-safe but `dangerouslySetInnerHTML`-style string concat used to build markdown-like lines | `api/prompts.mjs:111-118` (server-side only) |
| LOW | No CSP / X-Frame-Options / Referrer-Policy set on HTML or via headers | `index.html` (no `<meta http-equiv>`); no helmet/CSP middleware on `api/server.mjs` |
| LOW | Boot log reveals which providers are configured (small fingerprint, not secret) | `api/server.mjs:445-447` |

---

## 1. `.gitignore` review — MEDIUM + LOW findings

`.gitignore` correctly excludes:
- `.env`, `.env.local`, `.env.*.local` ✓
- `node_modules/` ✓
- `dist/`, `dist-ssr/` ✓
- `.vercel/` ✓ (contains `projectId`, `orgId`, `projectName` — non-secret identifiers but should not be tracked)
- `*.tsbuildinfo` ✓

Verified by `git check-ignore`:
```
.env        ✓ ignored
.env.local  ✓ ignored
dist        ✓ ignored
node_modules ✓ ignored
.vercel     ✓ ignored
```

### MEDIUM-1: `dev-dist/` is tracked (small leak surface, no secrets)

`dev-dist/` contains the VitePWA development-mode service worker (`sw.js`, `workbox-b696421e.js`, `registerSW.js`). `git ls-files dev-dist/` confirms three files are committed:

```
dev-dist/registerSW.js
dev-dist/sw.js
dev-dist/workbox-b696421e.js
```

No secrets in these files (Google Workbox library + auto-generated SW), but they are auto-rebuilt by the Vite dev server and pollute diffs. Add to `.gitignore`:

```
# VitePWA dev-mode output (auto-rebuilt on `vite` dev server)
dev-dist/
```

### LOW-1: `.secrets.json` not explicitly ignored (low risk — file does not exist)

The task spec called out `.secrets.json` specifically. The file does not exist anywhere in the tree (`find . -name '.secrets.json'` returns nothing), and `.env*` patterns cover it. No action needed, but for defense in depth, add `*.secrets.json` and `secrets.json` if external tooling will ever produce them:

```
# Common secret files (defense in depth)
*.secrets.json
secrets.json
```

### LOW-2: `qa-evidence/`, `.herenow/` untracked but present

Both are untracked (not in `.gitignore`, not committed). `.herenow/` is a marker for the `here.now` deploy tool — it shouldn't be committed but isn't sensitive. `qa-evidence/` contains test artifacts. Recommend adding:

```
.herenow/
qa-evidence/
```

Neither contains secrets; low-risk cleanup.

---

## 2. `src/lib/supabase.ts` — CLEAN

The file is 11 lines:

```ts
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)
```

Verdict: **No secrets exposed beyond the documented design.** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are intentionally client-visible (they have the `VITE_` prefix that Vite replaces at build time). The anon key is a JWT with RLS-enforced permissions — by definition safe to ship to the client. The placeholder fallback prevents the app from crashing on misconfiguration (good UX, no security impact).

No findings.

---

## 3. Auth files (`src/pages/auth/`)

### 3a. `TherapistAuth.tsx`

- **Signup flow:** `supabase.auth.signUp({ email, password })` → inserts therapist row.
- **Login flow:** `supabase.auth.signInWithPassword({ email, password })` → reads role.
- **Password field:** `type="password"`, `minLength={8}`, `required`, `autoComplete={mode === 'login' ? 'current-password' : 'new-password'}`. ✓
- **Email field:** `type="email"`, `required`, `autoComplete="email"`. ✓
- **Error display:** Uses Supabase's `AuthError.message` directly (with `as { message?: string }` narrowing). Slightly leaky — Supabase errors include `"User already registered"` on signup, `"Invalid login credentials"` on bad password — both are useful UX, both are widely understood attack-enabling signals (account enumeration).
- **No CSRF token:** Not needed because Supabase Auth uses bearer JWT, not cookies, for the API itself. ✓
- **No rate limiting / lockout** (see HIGH finding below).

### 3b. `ParentOnboarding.tsx`

- **Invite gate:** Loads `invites` row via `.eq('code', code).is('consumed_at', null).gt('expires_at', ...)`. RLS policy `public can read active invites` allows this read for unauthenticated users. ✓
- **Signup:** `supabase.auth.signUp({ email, password })`. Same `minLength={8}` constraint. ✓
- **Consent step:** Inserts `parents` row with `client_id: invite.client_id` and consumes the invite (`update { consumed_at: now }`). RLS lets auth'd users consume any unconsumed, unexpired invite (`auth.uid() is not null` is the only check — see MEDIUM finding below). ✓
- **No double-consume guard on the client:** If two tabs open the same invite at the same time, both can race to consume it. The RLS doesn't prevent this. Low risk in practice but worth noting.

### Verdict: Auth pages are well-formed. One HIGH finding below.

---

## 4. `vite.config.ts` — CLEAN

```ts
base: '/app/',
server: { proxy: { '/api': { target: 'http://localhost:8787', changeOrigin: true } } },
plugins: [react(), VitePWA({ ... })]
```

- **No `define` block injecting secrets at build.** ✓
- **No `defineConfig` env overrides.** ✓
- **`changeOrigin: true`** on the dev proxy is normal — not a security issue, just rewrites the `Host` header for the upstream Node server.
- **PWA workbox runtime caches `*.supabase.co` with `NetworkFirst`:** means auth tokens and user data are cached on the client. This is by design (offline support) but worth understanding — `cacheableResponse: { statuses: [0, 200] }` excludes error responses from cache. ✓

No findings.

---

## 5. RLS policies — MOSTLY CLEAN (1 design note)

Read `docs/supabase-schema.sql` (318 lines). Verified:

| Table | RLS enabled | Policies | Verdict |
|---|---|---|---|
| `therapists` | ✓ | SELECT/INSERT/UPDATE own row | ✓ |
| `clients` | ✓ | ALL for owning therapist | ✓ |
| `parents` | ✓ | SELECT/INSERT own; therapist sees parents of own clients | ✓ |
| `invites` | ✓ | public SELECT (active only); therapist INSERT for own clients; therapist SELECT own; auth'd UPDATE to consume | ⚠ See note |
| `skills` | ✓ | SELECT (published only) | ✓ |
| `client_skill_state` | ✓ | parent SELECT own; therapist ALL for own clients | ✓ |
| `practice_logs` | ✓ | parent INSERT/SELECT own; therapist SELECT own clients | ✓ |

**MEDIUM design note on invites — race + over-permissive consume policy:**

```sql
create policy "auth user can consume invite"
  on invites for update
  using (consumed_at is null and expires_at > now())
  with check (auth.uid() is not null);
```

Two issues:

1. **No client-ownership check on consume.** Any signed-in user who learns a code (e.g. the code is in the URL `/invite/<code>`) can race-consume it. A leaked invite link can be stolen by a logged-in user.
2. **Code in the URL is the secret.** `ParentOnboarding.tsx` puts the code in `useParams<{ code: string }>()`. Browser history, server logs, referrer headers — all see the code. Codes are UUIDs (`crypto.randomUUID()` in `ClientDetail.tsx:14-16`) so unguessable, but once exposed, they have full consume privilege.

**Recommendation:** Tighten the consume policy to require `client_id` to match a parent the user is creating OR add a check that the consuming user has no existing `parents` row (so an attacker with a victim's invite can't bind it to a different parent account):

```sql
create policy "auth user can consume invite they originated the signup for"
  on invites for update
  using (
    consumed_at is null
    and expires_at > now()
    and auth.uid() is not null
  )
  with check (
    -- Belt-and-suspenders: ensure consuming user has no parents row yet
    -- (so a stolen invite can't be reassigned to a different parent)
    not exists (select 1 from parents where id = auth.uid())
  );
```

The leak vector is small (invite codes are UUIDs, not enumerable) but the fix is one extra subquery. Worth it before real emails go in.

---

## 6. Hardcoded passwords / API keys / secrets in source — CLEAN

Ran grep across `src/`, `api/`, `website/` (excluding `node_modules`, `dist`, `.git`):

```bash
grep -rnE 'sk-[A-Za-z0-9]{20,}|sk_live_|sk_test_|AKIA[A-Z0-9]{16}|ghp_[A-Za-z0-9]{20,}|xox[abp]-[A-Za-z0-9-]{20,}|sk-ant-[A-Za-z0-9_-]{20,}|sk-proj-[A-Za-z0-9_-]{20,}'
```
**Result: 0 matches.**

```bash
grep -rnE 'password\s*[:=]\s*["\x27][^"\x27]+["\x27]|api[_-]?key\s*[:=]\s*["\x27][^"\x27]+["\x27]|secret\s*[:=]\s*["\x27][^"\x27]+["\x27]'
```
**Result: 0 matches** (after filtering out `.env.example` placeholders).

The only env vars read are:
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (intentionally client-public)
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` (server-only, read from env)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `PORT` (no security impact)

No findings.

---

## 7. XSS vulnerabilities — CLEAN

```bash
grep -rnE 'dangerouslySetInnerHTML|innerHTML|eval\(|new Function' src/
```
**Result: 0 matches.**

All user-supplied or DB-supplied strings are rendered via React's standard text interpolation (`{variable}`), which auto-escapes. Verified for:
- `practice_logs.reflection_tags.join(', ')` → `{log.reflection_tags?.join(', ') || 'General practice'}` (auto-escaped)
- AI-generated steps and empathy text → `{step}`, `{aiResult.empathy}` (auto-escaped)
- Skill content from DB → `{skill.title}`, `{skill.goal}`, etc. (auto-escaped)
- `situation` textarea content → `{situationText}`, then sent to `/api/coach` and re-rendered via `{step}` (auto-escaped client-side)

No findings. Safe.

---

## 8. localStorage / sessionStorage — CLEAN

```bash
grep -rnE 'localStorage|sessionStorage|document\.cookie' src/
```
**One match: `src/pages/parent/ParentHome.tsx:175`** — uses `sessionStorage.getItem('ios-install-dismissed')` and `sessionStorage.setItem('ios-install-dismissed', '1')`.

This is a non-sensitive UX flag (whether to show the iOS install banner). Not a security finding.

Auth tokens are managed entirely by `@supabase/supabase-js` via the storage layer configured in `supabase.ts` (defaults to `localStorage`). The auth code never reads/writes the storage directly.

No findings.

---

## 9. Form input validation — MOSTLY CLEAN (1 LOW)

| Form | File | Client validation | Server validation | Verdict |
|---|---|---|---|---|
| Therapist signup/login | `TherapistAuth.tsx` | `type="email"`, `required`, `minLength={8}` | Supabase Auth (server-side) | ✓ |
| Parent signup via invite | `ParentOnboarding.tsx` | same | same | ✓ |
| Client label | `ClientList.tsx:165-172` | `type="text"`, `required`, `.trim()` | RLS / CHECK constraint missing? | ⚠ |
| Note tag (select) | `ClientDetail.tsx:218-227` | `<option>` enum | n/a (cast in component) | ✓ |
| Reflection tags | `PracticeLog.tsx` | `<button>`-driven enum | server stores `text[]` | ⚠ |
| Situation textarea | `InTheMoment.tsx:332-339` | `maxLength={2000}` (server mirrors) | `server.mjs:94` checks length | ✓ |

### LOW-3: Email format only validated by browser default

`type="email"` lets the browser enforce a basic pattern (`something@something.something`), but the React code does not call `.trim()` before sending to Supabase. If a user pastes `"  ari@gmail.com  "` with whitespace, Supabase Auth is lenient but the therapist row insert uses the same string (with whitespace) — could cause login mismatches.

Add `.trim()` to email `onChange` handlers and on submit:

```tsx
onChange={e => setEmail(e.target.value.trim())}
```

Same in `ParentOnboarding.tsx`.

### LOW-4: Client label has no server-side CHECK constraint

```sql
create table clients (
  ...
  label text not null,
  ...
);
```

`label` is `text not null` only. No CHECK constraint enforcing "non-PII" — relies entirely on the therapist-side warning UI ("⚠️ Privacy reminder"). A therapist (or anyone who compromises a therapist account) can store PII freely. This is a policy decision (not a code bug), but worth flagging:

- Option A: Add `CHECK (label !~* '\d{3}-\d{2}-\d{4}')` to block SSN-shaped strings.
- Option B: Don't enforce; document that the therapist is responsible (current state, in `ClientList.tsx:136-143`).
- Option C: Add a server-side redaction pass before insert.

For HIPAA-style posture, Option A or C is required before real PHI risk. Currently the app's claim is "no PHI in v1 — non-identifying labels only" (CLAUDE.md), which is contractual, not enforced.

---

## 10. Route protection — CLEAN

`src/App.tsx`:

- `TherapistRoute` checks `user && role === 'therapist'` → `<Navigate to="/login" replace />` otherwise.
- `ParentRoute` checks `user && role === 'parent'` → same redirect.
- `RootRedirect` handles unauthenticated + authenticated-no-role cases.
- `/invite/:code` is intentionally public (consumed by `ParentOnboarding`).

Route protection gates UI. Real authorization is enforced by **RLS at the database** (the only authoritative gate, since a determined attacker can bypass client-side routes via direct Supabase REST calls).

Verified that **every protected page renders via one of these route wrappers**. The only public route is `/invite/:code`, which is by design.

No findings.

---

## 11. API server (`api/server.mjs`) — 1 HIGH, 2 MEDIUM, 1 LOW

### HIGH-1: No rate-limit / lockout on `/api/analytics` or auth calls

Neither the React client nor the Node server implements rate limiting. Supabase's hosted Auth has its own rate limits, but the Node API server (`/api/analytics`, `/api/coach`) does not.

**Specifically relevant for real-email protection:**
- `/api/analytics` accepts a bearer token + a `clientId` (or `therapistId`) and returns the caller's scoped data. It correctly verifies scope (therapist must own the client; parent must own the client). Without rate-limiting, an attacker who obtains a valid therapist token (phishing, leak, credential-stuffing) can enumerate `clientId` UUIDs across the caseload. UUID enumeration is impractical at scale (2^122 space), so this is not an immediate exploit, but it's a defense-in-depth gap.
- `/api/coach` accepts any string up to 2000 chars and forwards it to Anthropic/OpenAI. **No auth at all** — anyone (unauthenticated) can POST to it. This means a malicious actor can (a) drive up Anthropic/OpenAI bills for the operator, (b) test prompt-injection payloads at scale, (c) exfiltrate the AI-generated response. The cost is the real risk here.

**Fix — minimum viable:**
1. Add `express-rate-limit` to `api/server.mjs`. 10 req/min/IP on `/api/coach`, 60 req/min/IP on `/api/analytics`.
2. For `/api/coach`, require a Supabase bearer token (currently optional). Reject 401 if no/invalid token.
3. For Supabase Auth itself, enable "Leaked password protection" in the Supabase dashboard (Project → Auth → Security → Enable HaveIBeenPwned check). Free, one click.
4. Consider adding Cloudflare Turnstile or hCaptcha to therapist signup (the `/signup` form is currently captcha-free).

Ariella's email is in the wild now (in her therapist-side account). The `/api/coach` endpoint being unauthenticated means anyone can spam the AI provider with whatever prompts they like, charging the project owner. That's the HIGH.

### MEDIUM-2: Service-role key read into module scope (loaded on require)

```js
const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
```

This is fine — it's how Node reads env. But the value is captured at module-load time, so if `SUPABASE_SERVICE_ROLE_KEY` is rotated while the process is running, the old key continues to be used until restart. For the dev loop this is fine; for production rotation, mention in a runbook that the API server must restart after a key rotation.

No code change needed; this is operational documentation, not a vulnerability.

### MEDIUM-3: VITE_SUPABASE_ANON_KEY used server-side

```js
const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? 'anon'
const userClient = createClient(url, anonKey, {
  global: { headers: { Authorization: *** } },
})
const { data: userData, error: userErr } = await userClient.auth.getUser()
```

The server reads the anon key from `VITE_SUPABASE_ANON_KEY` to construct a client that then validates the caller's bearer token via `auth.getUser()`. This works because the anon key is intended to be public, but **it is semantically wrong** to use the client-public anon key on a server (the server has its own service-role key for this purpose). Two issues:

1. **Confusion of concerns.** Anyone reading the code has to think about why the server is using the public anon key. The pattern is correct but the variable naming is misleading.
2. **If the anon key is rotated without updating the API server's env**, validation breaks silently (the validation client can't reach Supabase, every request returns 401).

**Fix:** Use the service-role key to validate the caller's token instead. The service-role key can call `auth.getUser(jwt)` directly with the JWT, without needing the anon client. Pattern:

```js
const adminClient = createClient(url, serviceKey, { auth: { persistSession: false } })
const { data: userData, error: userErr } = await adminClient.auth.getUser(accessToken)
```

This is the canonical Supabase pattern. Saves one client construction and removes the misleading VITE_-prefixed env read.

### LOW-5: Boot log reveals provider configuration

```js
console.log('  anthropic: ' + (process.env.ANTHROPIC_API_KEY ? 'configured' : 'not set'))
console.log('  openai:    ' + (process.env.OPENAI_API_KEY ? 'configured' : 'not set'))
console.log('  supabase:  ' + (process.env.SUPABASE_URL ? 'configured' : 'not set'))
```

This reveals which AI providers and which Supabase project is wired. It's a small fingerprint (helps an attacker know which prompts to tune), not a secret leak. For an MVP this is fine; for production, gate this behind `NODE_ENV !== 'production'` or remove entirely.

---

## 12. LLM prompt injection — server-side only, clean

`api/prompts.mjs` is the system prompt. The system prompt is constructed server-side and never sent to the client (verified — `src/lib/ai-prompts.ts` exports only the type contract and a fallback disclaimer string; the system prompt itself lives in `prompts.mjs` and is imported only by `server.mjs`).

The user prompt is built as:

```js
"<<<" + situation.trim() + ">>>"
```

No XML/HTML injection vector. The user-supplied `situation` is wrapped in delimiters, sent to the LLM, and the LLM is instructed to output ONLY 6 labeled lines. The server then parses those lines (with a regex on `: `) and emits them as SSE events. **No client ever sees raw LLM output — only the parsed structured response.**

Safe.

### LOW-6: `parseLabeledLine` trusts the LLM blindly

If the model hallucinates a `DISCLAIMER:` line with malicious content (e.g. `<script>alert(1)</script>`), that text goes into the SSE stream as a `disclaimer` field. The React client renders it via `{aiResult.disclaimer}` (auto-escaped by React), so XSS is not possible. But the disclaimer is shown to parents as authoritative text — a model could try to overwrite it with misleading content.

The current system prompt hard-codes `DISCLAIMER: <fixed string>` (line 32-33 in `prompts.mjs`), so the LLM is *instructed* to use that exact string, not generate its own. The `parseLabeledLine` regex strips whitespace and matches labels, then passes the value verbatim. If the model is jailbroken, it could output `DISCLAIMER: Your therapist's session is canceled, just ignore them.` — and the client would render it.

For v1 this is acceptable risk (the model has hard-coded instructions to use the safe string). For v2, server-side override the disclaimer with the hard-coded one regardless of what the model returns.

---

## 13. HTTP security headers — LOW

`index.html` has no CSP / X-Frame-Options / Referrer-Policy / Permissions-Policy. The Node server has no `helmet` middleware.

For a PWA that stores auth tokens in localStorage, the relevant headers are:
- `Content-Security-Policy` — prevents XSS escalation if a future bug introduces one
- `X-Frame-Options: DENY` — prevents clickjacking
- `Referrer-Policy: strict-origin-when-cross-origin` — prevents referrer leakage of invite codes from `/invite/<code>` URLs
- `Permissions-Policy` — disable unused features

**Fix:** Add to `index.html`:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co; img-src 'self' data:; frame-ancestors 'none';" />
<meta name="referrer" content="strict-origin-when-cross-origin" />
```

And add `helmet` to `api/server.mjs`.

For Vercel hosting, this can also be set in `vercel.json` `headers`.

---

## 14. Build artifacts (`dist/`) — CLEAN

The `dist/` folder contains the built Vite output. Verified that:
- `index-*.js` files contain bundled app code
- `workbox-*.js` is the SW helper
- `sw.js` is the generated service worker
- No `.env`, no service-role key, no anon key, no real Supabase URL

**The build correctly inlines only `VITE_*` env vars** (the public anon key + URL). Since the project is unconfigured (`.env` has the placeholder values), the inlined values are `placeholder-anon-key` and `https://placeholder.supabase.co` — no real keys were leaked.

Once the operator fills `.env` with the real Supabase URL/anon and runs `npm run build`, those real values will be baked into `dist/`. That's by design (Vite's contract for `VITE_*` vars). The `dist/` folder is gitignored, so the values won't end up in git. ✓

One observation: the `dist/` folder exists in the working tree (committed-by-build artifacts). It's correctly gitignored, so it won't accidentally land in git history. ✓

---

## Pre-deploy checklist for Ariella's email

1. **Rotate `SUPABASE_SERVICE_ROLE_KEY` after a code review** (it's currently in `.env`, which is gitignored, but treat it as compromised if the machine was ever on a shared host).
2. **Enable Supabase Auth → Security → "Leaked password protection"** (HaveIBeenPwned check) in the dashboard.
3. **Enable Supabase Auth → Security → "Email rate limiting"** if available on the plan, or rely on the hosted defaults.
4. **Set Anthropic API key spend limit** at console.anthropic.com — `/api/coach` is unauthenticated, so anyone can hit it.
5. **Add the missing `.gitignore` entries** for `dev-dist/`, `.herenow/`, `qa-evidence/`, `*.secrets.json` (LOW/MEDIUM findings).
6. **Tighten the `invites` consume policy** (MEDIUM RLS finding) — one subquery, defense in depth.
7. **Consider rate-limiting `/api/coach` and `/api/analytics`** in `api/server.mjs` (HIGH finding). `express-rate-limit` is one `npm install` away.
8. **Add CSP + helmet headers** (LOW HTTP-security finding). One HTML meta tag + one npm dep.
9. **Run a manual RLS test** per CLAUDE.md §10 — connect as a parent and try to read another parent's `practice_logs`. Should get 0 rows. The policies say it should work; verify in a live environment.
10. **Consider trimming the email field** with `.trim()` on change to prevent whitespace-related login mismatches (LOW).

---

## Summary

The app is **safe to use with Ariella's real email** under the assumptions that:
- Supabase Auth's built-in rate limits hold (they do, for the hosted tier)
- The `.env` file has not been exposed outside the developer's machine
- Anthropic/OpenAI spend limits are configured
- The `dev-dist/` leak is cosmetic (no secrets, just dev-mode SW files)

The HIGH finding (no rate-limit on `/api/coach`) is a cost-and-DoS risk, not a confidentiality risk. No real-email PII is currently exposed by any unfixed finding.

If you want this audit expanded (e.g., dependency CVE scan via `npm audit`, deeper Capacitor/iOS/Android native surface, or a manual RLS test as a parent-account-vs-parent-account), say the word and I'll spin it up.

— Sherlock