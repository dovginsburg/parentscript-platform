// rate_limit.mjs — Per-IP sliding-window rate limiter.
//
// Mirrors apps/tono/Backend/rate_limit.py so the two backends behave
// consistently. In-memory + thread-safe. For multi-instance deployments,
// swap for Redis INCR + EXPIRE; for a single-Vercel-Function production
// deployment this is fine — when the function cold-starts, all buckets
// reset, which is the safe direction (a fresh start doesn't carry an
// attacker over the limit).
//
// Configuration via env vars (with sensible defaults):
//   PARENTSCRIPT_RATE_LIMIT_REGISTER_PER_MIN   (default 30)
//   PARENTSCRIPT_RATE_LIMIT_AUTH_PER_MIN       (default 10) — request-link, verify-otp, coupon
//   PARENTSCRIPT_RATE_LIMIT_COACH_PER_MIN      (default 20) — /v1/coach (the LLM passthrough — costly)
//   PARENTSCRIPT_RATE_LIMIT_COUPON_PER_MIN     (default 5)  — coupon brute-force
//   PARENTSCRIPT_RATE_LIMIT_OTP_LOCKOUT        (default 10) — max verify-otp attempts per email per 5 min
//   PARENTSCRIPT_RATE_LIMIT_OTP_WINDOW_SEC     (default 300)
//   PARENTSCRIPT_RATE_LIMIT_DEFAULT_PER_MIN    (default 60) — catch-all for misc endpoints
//
// 429 responses use the same shape the rest of the API uses for rate-limit
// errors so the iOS client doesn't need a new error type.

const _ipBuckets = new Map();   // key: `${scope}:${ip}` → deque of timestamps
const _keyedBuckets = new Map(); // key: `${scope}:${key}` → deque of timestamps
const _ipLock = { busy: false };
const _keyedLock = { busy: false };

function _now() {
  return Date.now() / 1000;
}

function _trim(dq, windowSec, now) {
  while (dq.length > 0 && now - dq[0] > windowSec) {
    dq.shift();
  }
}

/**
 * Generic sliding window. Returns true if the request is allowed.
 * `scope` lets us have separate buckets per endpoint family.
 */
export function checkIpRate(scope, ip, limit, windowSec = 60) {
  if (!ip) return true; // can't bucket without an IP, so let it through
  const key = `${scope}:${ip}`;
  const now = _now();
  const dq = _ipBuckets.get(key) || [];
  _trim(dq, windowSec, now);
  if (dq.length >= limit) {
    _ipBuckets.set(key, dq);
    return false;
  }
  dq.push(now);
  _ipBuckets.set(key, dq);
  return true;
}

/**
 * For brute-force protection (e.g. OTP verification). `key` is usually the
 * email being verified; `scope` distinguishes "verify_otp" vs "request_link"
 * so one failed login doesn't lock the user out of all auth flows.
 * Lockout duration = windowSec after the FIRST hit.
 */
export function checkKeyedRate(scope, key, limit, windowSec = 300) {
  if (!key) return true;
  const bucketKey = `${scope}:${key}`;
  const now = _now();
  const dq = _keyedBuckets.get(bucketKey) || [];
  _trim(dq, windowSec, now);
  if (dq.length >= limit) {
    _keyedBuckets.set(bucketKey, dq);
    return false;
  }
  dq.push(now);
  _keyedBuckets.set(bucketKey, dq);
  return true;
}

/**
 * Reset all buckets — useful for testing.
 */
export function resetAll() {
  _ipBuckets.clear();
  _keyedBuckets.clear();
}

/**
 * Read the env-var-based rate limit value with a default.
 */
export function envLimit(name, def) {
  const v = process.env[name];
  if (v == null || v === "") return def;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}

/**
 * Express-style middleware factory for IP rate limiting.
 * Returns a function that can be `app.use(...)`'d or used per-route.
 *
 * @param {string} scope - the scope name (e.g. "coach", "auth")
 * @param {number} limit - max requests per window
 * @param {number} windowSec - window in seconds
 * @param {function} getKey - optional function to extract a key (defaults to client IP)
 */
export function ipRateMiddleware(scope, limit, windowSec = 60, getKey) {
  return function (req, res, next) {
    const key = getKey ? getKey(req) : (req.ip || req.headers?.['x-forwarded-for'] || 'unknown');
    if (!checkIpRate(scope, key, limit, windowSec)) {
      res.status(429).json({
        error: `too many requests from this IP — try again in ${windowSec}s`,
        code: 'rate_limited',
        scope,
      });
      return;
    }
    next();
  };
}
