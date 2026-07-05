# ParentScript Infrastructure (2026-07-05)

## Current State

| Component              | URL                        | Status                                                   |
| ---------------------- | -------------------------- | -------------------------------------------------------- |
| **Frontend**           | `https://parentscript.app` | ✅ Live (Next.js) — serves CoachForm, OAuth, PasskeyAuth |
| **Backend (intended)** | Various                    | ⚠️ Not currently deployed — see below                    |
| **iOS TestFlight**     | TestFlight app             | ✅ v9 VALID (uploaded 2026-07-05)                        |
| **Rate limiter**       | (in code)                  | ✅ Committed but not yet served                          |

## Backend Deployment Story

### Attempted: Vercel Functions (rejected)

We tried to deploy `api/*.mjs` files as Vercel serverless functions:

1. ❌ `'nodejs20.x'` runtime → "Invalid version" error
2. ❌ `'@vercel/node@3.0.0'` runtime → "Invalid version" error
3. ❌ `engines.node: "20.x"` → "Invalid version, use 18.x"
4. ❌ `engines.node: "18.x"` → "Discontinued, use 24.x"
5. ❌ `engines.node: "24.x"` → "Invalid version, use 22.x"
6. ❌ `engines.node: "22.x"` + `@vercel/node@4.0.0` → still pending deployment

**Reality:** Vercel's runtime version requirements in 2026 are unstable. Trying to ship serverless functions on Vercel is not the path of least resistance right now.

### Recommended path: Railway + Docker

The `apps/backend/` directory has a complete Express server with:

- All endpoints (POST /api/coach, POST /api/analytics, POST /api/stripe/*, etc.)
- Rate limiter (`rate_limit.mjs`) wired in
- Dockerfile + railway.toml ready to deploy

Path:

```bash
cd /Users/Ezra/Projects/parentscript/apps/backend
railway up
```

This hits the "Free plan resource provision limit exceeded" error on Dov's account, so we either:

1. Upgrade Railway to Hobby ($5/mo + usage)
2. Use Fly.io (free tier supports 3 shared VMs)
3. Use the Vercel project at parentscript-site that already has one running
4. Use the existing `tono-backend` Railway project as a model and copy config

## iOS TestFlight Status

| Build  | Version | Date             | State                                  |
| ------ | ------- | ---------------- | -------------------------------------- |
| **v9** | 9       | 2026-07-05 07:25 | ✅ VALID — installable on Dov's iPhone |
| v8     | 8       | 2026-07-04 18:25 | VALID                                  |
| v7     | 7       | 2026-07-03 04:27 | VALID                                  |

Dov was added as an internal tester on TestFlight (App Store Connect).
Bundle ID: `com.parentscript.app`
Apple Team: `4938S9TTBM`

## Vercel Projects

| Project               | URL                                           | State                               |
| --------------------- | --------------------------------------------- | ----------------------------------- |
| `parentscript` (main) | `parentscript.vercel.app`, `parentscript.app` | ✅ Production Next.js frontend live |
| `parentscript-site`   | `parentscript-site.vercel.app`                | Stale Vite SPA                      |
| `maze-deploy`         | `maze-deploy-*.vercel.app`                    | Backup of the original PWA          |
| `tono-web`            | `tono-web.vercel.app`                         | Tono Next.js frontend               |

## Anthropic Keys

| Key (first chars)       | Where                      | What                   |
| ----------------------- | -------------------------- | ---------------------- |
| `sk-ant-api03-LKVOY...` | Vercel `parentscript` env  | ParentScript LLM calls |
| (Tono's separate key)   | Railway `tono-backend` env | Tono's LLM calls       |

Two products, two keys, two budgets, two revocation surfaces. ✓

## Stripe Keys

| Key (last 4) | Where                                        |
| ------------ | -------------------------------------------- |
| `vkNl`       | Tono Railway (just wired — Pro tier billing) |

## Rate Limit Env Vars (set on Vercel parentscript)

```
PARENTSCRIPT_RATE_LIMIT_DEFAULT_PER_MIN=60
PARENTSCRIPT_RATE_LIMIT_COACH_PER_MIN=20
PARENTSCRIPT_RATE_LIMIT_REGISTER_PER_MIN=30
PARENTSCRIPT_RATE_LIMIT_AUTH_PER_MIN=10
PARENTSCRIPT_RATE_LIMIT_COUPON_PER_MIN=5
PARENTSCRIPT_RATE_LIMIT_OTP_LOCKOUT=10
PARENTSCRIPT_RATE_LIMIT_OTP_WINDOW_SEC=300
```

## Open Items

1. ❌ Vercel serverless functions not deploying (runtime version mismatch)
2. ❌ Vercel team-gate blocker for main → prod deploys (Dov needs to add GitHub noreply as Vercel team member, OR promote manually per deploy)
3. ❌ ParentScript backend not currently reachable from frontend (no BE URL configured in PWA env)
4. ❌ TonoMessagesExtension provisioning profile (App Groups) — blocks fresh Tono iOS build
5. ✅ Apple + Google + Email OAuth working on both platforms
6. ✅ Passkey + Stripe + Coupon components in Tono production bundle

## Recommended Next Steps

1. Deploy `apps/backend/` to Railway (free tier may need upgrade) or Fly.io
2. Once backend is live, set `VITE_API_BASE_URL` in the PWA env vars
3. Wire `PasskeyAuth` + `UpgradeButton` into ParentScript web (cloned from Tono)
4. For Vercel team-gate: Dov adds GitHub noreply email as Vercel team member (Settings → Members)
