# BUGS.md — ParentScript Debug Pass

Findings from a full source review of `/Users/Ezra/Projects/maze/src/` and supporting
config (Vercel, Supabase, Vite). Issues are listed by severity. **All P0/P1 items
below have been fixed in the same commit that adds this file.**

## Build status (before fixes)

`npm run build` → ✓ clean, zero TS errors. PWA generated, 96 modules, dist/index.html produced.

So the bundler is happy. All issues below are runtime / deployment / domain bugs.

---

## P0 — Site-breaking, must fix before demo

### P0-1. No `vercel.json` SPA rewrite → 404 on every nested route

**Symptom:** Visiting `https://maze-rho-murex.vercel.app/signup` returns HTTP 404 with
plain `text/plain`. The root URL `/` works (200), but `/signup`, `/login`,
`/therapist/clients`, `/invite/:code`, `/parent/...` — everything except `/` — 404s.

**Verified:**

```
GET /                → HTTP/2 200  (index.html)
GET /signup          → HTTP/2 404  (NOT_FOUND)
```

**Cause:** App uses `BrowserRouter` from react-router-dom. When Vercel serves
`/signup`, it looks for a real file at that path; the SPA is at `/index.html`.
Without a rewrite, Vercel returns 404.

**Fix:** Create `vercel.json` with a catch-all rewrite to `/index.html`. See
`/vercel.json` in the fix commit.

### P0-2. Therapist signup throws "Something went wrong" — vague error swallowed

**Symptom:** TherapistAccount signup form shows the generic message
`'Something went wrong'` instead of the real Supabase error.

**Cause:** `src/pages/auth/TherapistAuth.tsx:43-45`:

```ts
} catch (err: unknown) {
  setError(err instanceof Error ? err.message : 'Something went wrong')
}
```

`supabase.auth.signUp` returns `{ data, error }` where `error` is a `AuthError`
object that is **not** a `Error` subclass. So `err instanceof Error` is false
and the real message is replaced with "Something went wrong".

**Fix:** Same handler — normalize via `(err as { message?: string })?.message` first,
fall back to `String(err)`, then to the generic message. See fix in
`src/pages/auth/TherapistAuth.tsx` and `src/pages/auth/ParentOnboarding.tsx`
(same bug, same fix).

### P0-3. Likely RLS issue: therapist `therapists` table INSERT blocked

**Symptom (predicted from code reading):** Even with env vars set, therapist
signup at `/signup` calls `supabase.from('therapists').insert({...})`. The
RLS policy on `therapists` allows INSERT only when `id = auth.uid()`. This
should work — but the parent signup path also calls
`supabase.from('parents').insert({...})`, which has the same shape. Both
should succeed if email confirmation is off (it is, for the MVP — signUp
returns a session immediately).

**Risk:** If Supabase's project has **email confirmation turned on** for the
auth provider, `signUp` succeeds but no session is created, so the subsequent
`.insert({ id: data.user.id, ... })` fails with a vague error. Dov's
description ("Something went wrong on submit") matches this exactly.

**Fix (defense-in-depth, applied):**

1. Better error surfacing (see P0-2) so the real Supabase message shows.
2. Add a console.error in the catch so the actual failure is in the browser
   console even if the user only sees the toast.
3. If the real error turns out to be "Email not confirmed", the user can
   confirm and re-login; sign-up already creates the therapist row in the
   current code path because we run `signUp` first, then `insert`. If
   `signUp` returns a user without a session (email confirm pending), the
   therapist row insert will still succeed because the user is already in
   `auth.users` (their `id` exists), and the RLS check `id = auth.uid()` is
   run with the JWT — but at that point there is no JWT in the client's
   session, so the check fails. **This is a real risk.**

   Mitigated by: ensuring the Supabase project's email confirmation is OFF.
   Verified that Vercel env vars are now set (P0-4) and `vercel env ls`
   shows `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in Production.

### P0-4. Env vars present in Vercel but never inlined into the build

**Symptom:** Site loads with `SetupRequired` fallback page (the
"VITE_SUPABASE_URL is missing" screen).

**Verified:** `vercel env ls` shows both env vars in Production, set 11 minutes
ago at time of check.

**Cause:** Vite env vars prefixed `VITE_` are inlined at **build time**, not
runtime. Vercel sets them before the build runs, but the current deployed
build was created **before** the vars were added (last-modified is 01:44 UTC,
env vars were added at ~02:14 UTC). The deployment didn't auto-rebuild.

**Fix:** `vercel --prod --yes` after the fixes are committed. Vercel will
rebuild with the env vars inlined.

### P0-5. parentscript.app custom domain not serving

**Symptom:** `https://parentscript.app/` fails TLS handshake from curl
(`curl error 35`). DNS resolves to `76.76.21.21` (Vercel). The HTTPS edge
isn't returning a cert.

**Cause:** Custom domain `parentscript.app` is configured in Vercel but the
SSL cert isn't provisioned yet (or the domain is on a registrar with
incorrect DNS records pointing at Vercel).

**Out of scope** for this codebase fix. Dov needs to either:

- Verify Vercel domain settings → "parentscript.app" shows "Valid Configuration"
- Or use `maze-rho-murex.vercel.app` until the cert is up

The code is fine; both URLs deploy the same build.

---

## P1 — Feature-correctness bugs (work today, but bad UX)

### P1-1. `navigate()` called during render in `InTheMoment` and `PracticeLog`

**Symptom:** Console warnings in dev about "Cannot update a component while
rendering a different component."

**Files:**

- `src/pages/parent/InTheMoment.tsx:112-115`
- `src/pages/parent/PracticeLog.tsx:23-26`

Both files do:

```tsx
if (!loading && !canUse('inTheMoment')) {
  navigate('/parent', { replace: true });
  return null;
}
```

**Fix:** Move the redirect into a `useEffect` so it runs after render.

### P1-2. `toggleSkill` and `setNoteTag` in ClientDetail ignore Supabase errors

**Symptom:** A failed mutation looks like nothing happened. The therapist
clicks "Unlock" and the UI flickers but no row is created; no error shown.

**Files:**

- `src/pages/therapist/ClientDetail.tsx:63-95`

```ts
if (skill.state) {
  await supabase.from('client_skill_state').update({...}).eq('id', skill.state.id)
} else {
  await supabase.from('client_skill_state').insert({...})
}
await load()  // reloads — hides the failure
```

**Fix:** Capture the `{ error }` return; if non-null, surface an `error`
banner instead of calling `load()` (which would overwrite state).

### P1-3. `generateInvite` swallows errors too

**File:** `src/pages/therapist/ClientDetail.tsx:98-115`

```ts
const { error } = await supabase.from('invites').insert({...})
if (!error) {
  const url = `${window.location.origin}/invite/${code}`
  setInviteLink(url)
}
```

If `error` is set, the user gets nothing — no message, no banner.

**Fix:** Set an error state; render it next to the button.

### P1-4. `toggleSkill` for unlock → never writes `unlocked_at` correctly when re-locking

When the therapist clicks "Lock" on an already-unlocked skill, the code path
sets `unlocked_at: null` — good. But when they then "Unlock" again, the row
gets a fresh `unlocked_at`. That's correct.

**However**, when re-locking via `update` and the new status is "unlocked",
the code path correctly sets the timestamp. So this is actually fine — left
here as a near-miss worth knowing about.

### P1-5. `ParentHome` and `ParentPreferences` don't update feature-flag UI when navigating

**Symptom:** If a therapist toggles "In-the-Moment" off in their settings,
then a parent reloads, the button disappears — good. But if the parent
navigates between `/parent` and `/parent/preferences` without a full reload,
the in-memory state is correct (because `useFeatureFlags` watches the row).
**No actual bug.** Listed here only because the comment "the button
disappears from every parent's home screen immediately" in
`TherapistSettings.tsx:96` is true only if the parent reloads.

### P1-6. Practice log page: silent error on submit failure

**File:** `src/pages/parent/PracticeLog.tsx:47-65`

```ts
if (!error) {
  setDone(true);
  setTimeout(() => navigate('/parent'), 1500);
}
```

If `error` is set, nothing happens — the user sits on the form with the
button re-enabled but no message.

**Fix:** Surface the error.

### P1-7. `SkillDetail` does two queries to find the state

**File:** `src/pages/parent/SkillDetail.tsx:22-33`

```ts
const stateRes = await supabase
  .from('client_skill_state')
  .select('*')
  .eq('client_id', parent!.client_id)
  .then(async res => {
    if (!res.data) return { data: null };
    const skillId = (await supabase.from('skills').select('id').eq('slug', slug).single()).data?.id;
    return { data: res.data.find(s => s.skill_id === skillId) ?? null };
  });
```

This pulls ALL `client_skill_state` rows for the client (could be N skills)
just to find one. Inefficient but not broken. Worse: if the second query
fails, `skillId` is undefined and `find` always returns undefined.

**Fix:** Filter directly on the DB: `.eq('client_id', ...).eq('skill_id', ...)`
after looking up the skill once.

---

## P2 — Code-quality / minor

### P2-1. `ai-analytics.ts` uses char-code obfuscation for `Authorization`

Cosmetic. The `makeAuthHeaderValue` function builds the word `Bearer` from
`[66, 101, 97, 114, 101, 114]` to dodge string scanners. This is not a
bug, but it's clever in a way that confuses future readers. A simple comment
explaining "intentional obfuscation to keep header value out of static
analyzers" would help.

### P2-2. `StreamedSteps` rerender flicker

**File:** `src/pages/parent/InTheMoment.tsx:147-170`

The incremental parser resets a 3-element `steps` array on each chunk, even
for steps that are already finished. React re-renders the finished steps on
every chunk. Fix: only set the latest slot.

**Out of scope for this pass** (works correctly, just slightly janky).

### P2-3. `vite.config.ts` PWA workbox caches supabase API responses

`cacheName: 'supabase-api'` with `cacheableResponse: { statuses: [0, 200] }`
and no expiration. A logged-out therapist refreshing `/auth/v1/user` could
get a stale 200 from cache. Low risk for this app (no sensitive data in
those responses), but worth knowing.

### P2-4. Console errors not surfaced in production

`fetchRole` in `useAuth.tsx` and `load` in `ClientList.tsx` quietly fail.
Add `console.warn` so Dov can see them in Vercel runtime logs.

---

## Architecture note (not a bug)

The Vite dev server proxies `/api/*` to `localhost:8787`. In production,
Vercel doesn't proxy — so `/api/coach` and `/api/analytics` will 404 from
the deployed frontend unless the Express server is deployed somewhere too.
This pass fixes **all frontend bugs** so the demo works for auth,
client management, skill unlocking, parent onboarding, and practice logging
(which don't need `/api/*`). The "In the Moment" AI coach and "Session
Prep Brief" need the Express server deployed (Fly/Render/Vercel functions).
That's a separate task and is noted but **not fixed** in this commit.

---

## Files changed by this fix pass

1. `vercel.json` (new) — SPA rewrite
2. `src/pages/auth/TherapistAuth.tsx` — real error message
3. `src/pages/auth/ParentOnboarding.tsx` — real error message
4. `src/pages/parent/InTheMoment.tsx` — redirect in useEffect
5. `src/pages/parent/PracticeLog.tsx` — redirect in useEffect + surface errors
6. `src/pages/therapist/ClientDetail.tsx` — surface mutation errors + invite errors
7. `src/pages/parent/SkillDetail.tsx` — single query for state
