# ParentScript — Bug Report

**Audited:** 2026-06-27  
**Auditor:** Sherlock (subagent)  
**Scope:** `/Users/Ezra/Projects/maze/src/`, `supabase/migrations/`, `api/server.mjs`, config files  
**Build:** `npm run typecheck` → **zero TS errors** (clean). Runtime / logic / RLS / auth issues only.

---

## Critical — Break core user flows

### C1. Missing RLS policy for invite consumption — invite onboarding is completely broken

- **Where:** `supabase/migrations/002_rls_policies.sql` (missing policy) + `src/pages/auth/ParentOnboarding.tsx:77-81`
- **What:** The `invites` table has RLS UPDATE policies only for therapists (`therapist updates own client invites`). When a parent completes onboarding, `ParentOnboarding.tsx` calls:
  ```ts
  await supabase
    .from('invites')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', inviteId);
  ```
  This fails with an RLS 403 because no policy allows an authenticated parent to UPDATE an invite row.
- **Impact:** Every parent invited by a therapist cannot complete onboarding. The consent step throws an error and the invite remains unconsumed.
- **Fix:** Add a parent-facing consume policy to `002_rls_policies.sql` (or a new migration):
  ```sql
  CREATE POLICY "parent can consume active invite"
    ON invites FOR UPDATE
    USING (consumed_at IS NULL AND expires_at > now())
    WITH CHECK (auth.uid() IS NOT NULL);
  ```
  _Note:_ This is intentionally broad; defense-in-depth (tying consumption to the specific user) requires a schema change (e.g., `consumed_by UUID`).

### C2. Self-serve (free-tier) parents cannot view any skill details

- **Where:** `src/pages/parent/SkillDetail.tsx:62` + `src/pages/auth/ParentSignup.tsx:66-71` + schema
- **What:** `SkillDetail.tsx` requires `state?.status === 'unlocked'` to show content. Self-serve parents have `client_id = null`, so they have **zero** `client_skill_state` rows. The query returns `null`, the guard blocks them, and they see "Skill not available" for every skill.
- **Impact:** The free tier promises L1–L2 skills, but free parents can never open a skill detail page. The entire free-tier value proposition is broken.
- **Fix:** In `SkillDetail.tsx`, allow self-serve parents to view published L1–L2 skills even without an unlocked state row. Add a check:
  ```ts
  const isSelfServe = parent?.is_self_serve;
  const canView = state?.status === 'unlocked' || (isSelfServe && skill && skill.level <= 2);
  ```
  _Alternative:_ Create a default `clients` row for self-serve parents and seed `client_skill_state` for L1–L2 skills during `ParentSignup` consent.

### C3. Free-tier daily AI coaching limit is never enforced

- **Where:** `src/hooks/useDailyUsage.ts` (exists but unused) + `src/pages/parent/InTheMoment.tsx` (never imports it)
- **What:** The app ships a fully-built `useDailyUsage` hook that queries `parent_daily_usage` and exposes `canCoach` / `atCoachingLimit`. `InTheMoment.tsx` never imports it. The `/api/coach` endpoint also has no usage check.
- **Impact:** Free-tier parents can send unlimited AI coaching requests, driving up Anthropic/OpenAI costs with no cap.
- **Fix:**
  1. In `InTheMoment.tsx`, import `useDailyUsage` and block the "Get guidance" button when `atCoachingLimit` is true (with an explanatory message).
  2. Add server-side enforcement in `api/server.mjs` `/api/coach`: after `requireAuth`, call the `increment_parent_daily_usage` RPC (or query `parent_daily_usage`) and reject with 429 if `kind = 'coaching'` and count ≥ limit.

---

## High — Security holes, bad UX, or data integrity risks

### H1. ParentOnboarding allows invite consumption by a different authenticated user

- **Where:** `src/pages/auth/ParentOnboarding.tsx:44-46` and `:67-68`
- **What:** The signup step (`handleSignup`) creates a Supabase auth user for email A. The consent step (`handleConsent`) then calls `supabase.auth.getUser()` to get the _current_ user. If the user signs out and signs in as a different account (or switches tabs) between these two steps, the invite is consumed by user B while the therapist invited email A.
- **Impact:** Invite theft / misattribution. A therapist's client link could be bound to the wrong parent account.
- **Fix:** Store `data.user.id` from the signup response in component state (or `sessionStorage`) and verify `user.id === storedId` before consuming the invite.

### H2. `useAuth` `loadUser` never recovers from network errors → infinite spinner

- **Where:** `src/hooks/useAuth.tsx:44-50`
- **What:** `fetchRole` awaits two Supabase queries. If either throws (network timeout, RLS misconfiguration, etc.), the exception propagates to `loadUser`, which never calls `setState({ loading: false })`. The app shows `<Spinner />` forever.
- **Impact:** Any transient network hiccup on auth bootstrap bricks the app for the user until they hard-refresh.
- **Fix:** Wrap `fetchRole` in a try/catch inside `loadUser`:
  ```ts
  try {
    const roleData = await fetchRole(user.id);
    setState({ user, ...roleData, loading: false });
  } catch (err) {
    console.error('[Auth] role fetch failed:', err);
    setState({ user, role: null, therapist: null, parent: null, loading: false });
  }
  ```

### H3. ResetPassword may miss `PASSWORD_RECOVERY` event due to race condition

- **Where:** `src/pages/auth/ResetPassword.tsx:14-29`
- **What:** Supabase processes the reset token in the URL hash and fires `PASSWORD_RECOVERY` via `onAuthStateChange`. If the event fires _before_ the component mounts and attaches its listener (e.g., fast redirect, cached session), the 4-second fallback timer expires and the user sees "Link expired or invalid" even with a valid token.
- **Impact:** Users with valid reset links are told the link is expired.
- **Fix:** Also check `supabase.auth.getSession()` on mount. If a session exists, set status to `ready` immediately. Combine with the event listener for the edge case where the session arrives later.

### H4. Pricing page shows inconsistent prices

- **Where:** `src/pages/Pricing.tsx:124` (comparison table) vs. `PLANS` array (`price: 9`)
- **What:** The plan cards say `$9/mo`, but the comparison table at the bottom says `$19/mo` for Solo, `$39/mo` for Pro, and `$29/seat/mo` for Clinic.
- **Impact:** Users see conflicting pricing and lose trust.
- **Fix:** Sync `COMPARISON_ROWS` with the actual `PLANS` prices. Derive the table from the `PLANS` array instead of hard-coding separate values.

### H5. `Billing.tsx` uses `<a href="/pricing">` causing full page reload

- **Where:** `src/pages/Billing.tsx:59-64`
- **What:** The "View Plans" button is a raw `<a>` tag. In an SPA with `BrowserRouter`, this triggers a full server round-trip instead of client-side navigation.
- **Fix:** Replace with `<Link to="/pricing">` from `react-router-dom`.

---

## Medium — Reliability, missing error handling, or surprising behavior

### M1. `ClientList.tsx` silently fails on load errors → eternal "Loading clients…"

- **Where:** `src/pages/therapist/ClientList.tsx:28-63`
- **What:** `loadClients()` has no try/catch. If the `supabase.from('clients')` query fails (network, RLS bug, etc.), `clientData` is undefined, the function returns early, but `setLoading(false)` is only called at the end of the success path. The spinner never disappears.
- **Fix:** Wrap the query in try/catch and call `setLoading(false)` in a `finally` block.

### M2. `ClientDetail.tsx` `load()` ignores errors from all 5 parallel queries

- **Where:** `src/pages/therapist/ClientDetail.tsx:37-61`
- **What:** Five `supabase` queries run in `Promise.all`. Errors on any of them are silently dropped (only `.data` is read). A therapist could see an empty skill tree or missing practice logs with no indication that something failed.
- **Fix:** Check each result for `.error` and surface a banner: `setMutationError('Could not load client data.')`.

### M3. `useFeatureFlags` does not react to real-time changes

- **Where:** `src/hooks/useFeatureFlags.tsx:84-161`
- **What:** Flags are fetched once on mount. If a therapist toggles a feature off, parents who already have the app open continue to see the feature until they reload. The comment in `TherapistSettings.tsx:96` claims changes are "immediate," which is misleading.
- **Fix:** Add a Supabase realtime subscription on `therapist_feature_flags` and `parent_preferences` (low effort, high UX win).

### M4. Email inputs are not trimmed before submission

- **Where:** `src/pages/auth/TherapistAuth.tsx:111`, `src/pages/auth/ParentOnboarding.tsx:137`, `src/pages/auth/ParentSignup.tsx:120`
- **What:** Pasted emails like `"  ari@gmail.com  "` are sent to Supabase Auth and inserted into `therapists`/`parents` rows with surrounding whitespace. This can cause login mismatches later.
- **Fix:** `onChange={e => setEmail(e.target.value.trim())}` on all email fields.

### M5. `InTheMoment.tsx` streaming step array is fully recreated on every chunk

- **Where:** `src/pages/parent/InTheMoment.tsx:153-178`
- **What:** `updateFromText` calls `setStreamedSteps([...steps])` on every SSE chunk, even for steps that are already complete. React re-renders all three step cards on every network chunk.
- **Impact:** Unnecessary renders; on slower devices this causes jank.
- **Fix:** Only update the step slot that changed (or use a ref + single state update at the end of each parsed line).

### M6. `useLongPress` leaks timer on `touchcancel`

- **Where:** `src/hooks/useLongPress.ts:20-52`
- **What:** The hook handles `touchstart`, `touchend`, `touchmove`, `mousedown`, `mouseup`, `mouseleave`, but not `touchcancel`. If the OS cancels the touch (phone call, notification shade, gesture), the timer keeps running and may fire unexpectedly.
- **Fix:** Add `onTouchCancel: cancel` to the returned handlers.

### M7. API server validates tokens with the anon key instead of the service-role key

- **Where:** `api/server.mjs:52-68`
- **What:** `verifyToken()` constructs a Supabase client using `getAnonKey()` (which reads `VITE_SUPABASE_ANON_KEY`). The server has `SUPABASE_SERVICE_ROLE_KEY` available. Using the public anon key on the server is semantically wrong and breaks silently if the anon key is rotated independently.
- **Fix:** Use `SUPABASE_SERVICE_ROLE_KEY` to validate caller tokens:
  ```js
  const adminClient = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data } = await adminClient.auth.getUser(accessToken);
  ```

### M8. `dev-dist/` is tracked in git

- **Where:** `/Users/Ezra/Projects/maze/dev-dist/`
- **What:** Three VitePWA dev-mode service-worker files are committed. They are auto-rebuilt on every dev server start and pollute diffs. No secrets, but messy.
- **Fix:** Add `dev-dist/` to `.gitignore`.

---

## Low — Polish, accessibility, minor inconsistencies

### L1. Missing Content-Security-Policy in `index.html`

- **Where:** `index.html`
- **What:** No `<meta http-equiv="Content-Security-Policy">`. The app loads scripts/styles from `self` and connects to `*.supabase.co`. A CSP would reduce XSS impact if a future bug introduces inline script injection.
- **Fix:** Add a meta tag (or Vercel headers) with a policy like:
  ```html
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co; img-src 'self' data:; frame-ancestors 'none';"
  />
  ```

### L2. `Footer.tsx` Terms of Service link points to `/security`

- **Where:** `src/components/Footer.tsx:114-117`
- **What:** The "Terms of service" link navigates to `/security` (the Security & HIPAA page) instead of a dedicated terms page. This is probably intentional for an MVP, but should be tracked.
- **Fix:** Create a `/terms` route (or remove the link until the page exists).

### L3. `ToggleRow` `aria-disabled` is not applied to the actual `<input>`

- **Where:** `src/components/ToggleRow.tsx:66,83`
- **What:** The wrapper `<span>` has `aria-disabled={disabled}`, but the real `<input>` does not. Screen readers may not announce the disabled state correctly.
- **Fix:** Add `aria-disabled={disabled}` (or `disabled={disabled}`) to the `<input>` element.

### L4. `SessionPrepCard` error message is misleading when API server is down

- **Where:** `src/pages/therapist/SessionPrepCard.tsx:76`
- **What:** The error message always says "Make sure the API server is running: `npm run dev:api`". In production, this is unhelpful.
- **Fix:** Show a different message in production (gate on `import.meta.env.DEV`).

### L5. `TherapistSettings.tsx` comment about "immediate" parent UI updates is misleading

- **Where:** `src/pages/therapist/TherapistSettings.tsx:95-100`
- **What:** Claims the button "disappears from every parent's home screen immediately." In reality, `useFeatureFlags` does not use realtime subscriptions, so open parent sessions won't see the change until reload.
- **Fix:** Update the copy to "the next time a parent loads the app" (or implement realtime).

---

## Summary Table

| ID  | Severity | File(s)                                                         | Issue                                                             |
| --- | -------- | --------------------------------------------------------------- | ----------------------------------------------------------------- |
| C1  | Critical | `002_rls_policies.sql`, `ParentOnboarding.tsx`                  | Missing RLS UPDATE policy for invite consumption                  |
| C2  | Critical | `SkillDetail.tsx`, `ParentSignup.tsx`                           | Self-serve parents blocked from all skill details                 |
| C3  | Critical | `InTheMoment.tsx`, `useDailyUsage.ts`, `server.mjs`             | Free-tier daily AI limit never enforced                           |
| H1  | High     | `ParentOnboarding.tsx`                                          | Invite can be consumed by wrong authenticated user                |
| H2  | High     | `useAuth.tsx`                                                   | Network error in `fetchRole` → infinite spinner                   |
| H3  | High     | `ResetPassword.tsx`                                             | Race condition with `PASSWORD_RECOVERY` event                     |
| H4  | High     | `Pricing.tsx`                                                   | Comparison table prices ($19/$39/$29) don't match plan cards ($9) |
| H5  | High     | `Billing.tsx`                                                   | `<a href>` causes full page reload                                |
| M1  | Medium   | `ClientList.tsx`                                                | Load errors leave spinner forever                                 |
| M2  | Medium   | `ClientDetail.tsx`                                              | Parallel query errors silently ignored                            |
| M3  | Medium   | `useFeatureFlags.tsx`                                           | No realtime subscription; changes not reflected live              |
| M4  | Medium   | `TherapistAuth.tsx`, `ParentOnboarding.tsx`, `ParentSignup.tsx` | Email inputs not trimmed                                          |
| M5  | Medium   | `InTheMoment.tsx`                                               | Streaming steps re-render all slots on every chunk                |
| M6  | Medium   | `useLongPress.ts`                                               | Missing `touchcancel` handler → timer leak                        |
| M7  | Medium   | `server.mjs`                                                    | Token validation uses anon key instead of service role            |
| M8  | Medium   | `.gitignore`                                                    | `dev-dist/` tracked in git                                        |
| L1  | Low      | `index.html`                                                    | No CSP meta tag                                                   |
| L2  | Low      | `Footer.tsx`                                                    | Terms link points to `/security`                                  |
| L3  | Low      | `ToggleRow.tsx`                                                 | `aria-disabled` not on real input                                 |
| L4  | Low      | `SessionPrepCard.tsx`                                           | Dev-only error copy shown in production                           |
| L5  | Low      | `TherapistSettings.tsx`                                         | Misleading comment about immediate updates                        |

---

## Pre-deploy checklist (must-fix before real users)

1. **C1** — Add invite consume RLS policy (or the invite flow is dead).
2. **C2** — Let self-serve parents view L1–L2 skills (or free tier is dead).
3. **C3** — Wire up `useDailyUsage` in `InTheMoment` and add a server-side usage gate (or AI costs are unbounded).
4. **H2** — Fix infinite spinner on auth load failure (or any network blip bricks the app).
5. **H4** — Fix pricing mismatch (or users see contradictory costs).
6. **M4** — Trim emails on all auth forms (prevents login mismatch support tickets).
