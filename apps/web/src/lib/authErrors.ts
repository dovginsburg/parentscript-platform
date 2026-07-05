// ────────────────────────────────────────────────────────────────────
// authErrors.ts — Friendly messages for Supabase auth / PostgREST errors
// ────────────────────────────────────────────────────────────────────
//
// Quinn's QA (2026-07-04, t_ff96d525) flagged that the raw PostgREST
// error `new row violates row-level security policy for table
// "therapists"` was being rendered verbatim to unauthenticated users
// on /app/signup. That's both a UX bug and a small information leak
// (schema names visible to the public).
//
// This module maps known Supabase / PostgREST error shapes to short,
// user-facing strings. The raw error is still logged to console so
// engineers can debug from the browser console / Vercel logs — but
// the UI never sees it.
//
// Adding a new mapping: append a case to AUTH_ERROR_PATTERNS below.
// Order matters — the first match wins.
// ────────────────────────────────────────────────────────────────────

type FriendlyError = { message: string; code?: string };

/** Default fallback when nothing matches. */
const DEFAULT_MESSAGE =
  'Something went wrong. Please try again — if the problem continues, contact support@parentscript.app.';

/**
 * Ordered list of error patterns. Each entry is tested against the
 * error's `.message`, `.code`, and (when present) `.status` from
 * supabase-js. The first match wins.
 *
 * Patterns are case-insensitive substring matches against the message
 * — keep them stable so future Supabase / PostgREST changes still hit.
 */
const AUTH_ERROR_PATTERNS: Array<{
  test: (e: { message?: string; code?: string; status?: number; name?: string }) => boolean;
  message: string;
  code: string;
}> = [
  // RLS / permission errors — the bug t_ff96d525 was about
  {
    test: e =>
      /row-level security|row level security|RLS/i.test(e.message ?? '') || e.code === '42501',
    message: 'Account setup failed. Please try again — if it keeps happening, contact support.',
    code: 'rls_blocked',
  },
  // Email already registered
  {
    test: e =>
      /already registered|already been registered|user already exists/i.test(e.message ?? '') ||
      e.code === 'user_already_exists',
    message: 'An account with that email already exists. Try signing in instead.',
    code: 'email_taken',
  },
  // Invalid email format (server-side check, in case HTML5 is bypassed)
  {
    test: e =>
      /invalid email|email is invalid/i.test(e.message ?? '') || e.code === 'email_address_invalid',
    message: 'That email address looks invalid. Please double-check it.',
    code: 'invalid_email',
  },
  // Weak password (server-side, in case minLength is bypassed)
  {
    test: e =>
      /password.*(short|weak|characters)/i.test(e.message ?? '') || e.code === 'weak_password',
    message: 'Password must be at least 8 characters.',
    code: 'weak_password',
  },
  // Rate limiting
  {
    test: e =>
      /rate limit|too many requests|over_email_send_rate_limit/i.test(e.message ?? '') ||
      e.code === 'over_email_send_rate_limit' ||
      e.status === 429,
    message: 'Too many attempts. Please wait a minute and try again.',
    code: 'rate_limited',
  },
  // Network / unreachable
  {
    test: e =>
      /failed to fetch|networkerror|network request failed/i.test(e.message ?? '') ||
      e.code === 'network_error',
    message: 'Network problem. Check your connection and try again.',
    code: 'network',
  },
  // Auth not configured (defensive — surface clearly during local dev)
  {
    test: e => /placeholder.supabase.co|placeholder-anon-key/i.test(e.message ?? ''),
    message: 'Authentication is not configured for this environment. Please contact support.',
    code: 'auth_not_configured',
  },
  // Email not confirmed — for login attempts on unconfirmed accounts
  {
    test: e => /email not confirmed/i.test(e.message ?? '') || e.code === 'email_not_confirmed',
    message: 'Please confirm your email first — check your inbox for the link we sent.',
    code: 'email_unconfirmed',
  },
];

/**
 * Convert any error thrown during a Supabase auth / database call into
 * a user-facing string. Raw error is logged to console so we never
 * lose debug context.
 *
 * @param err  The thrown value (Error, supabase-js PostgrestError,
 *             AuthError, or anything else).
 * @param ctx  A short tag for console grouping, e.g. 'TherapistAuth.signup'.
 *             Defaults to 'auth'.
 */
export function friendlyAuthError(err: unknown, ctx: string = 'auth'): FriendlyError {
  // Pull the shape supabase-js actually throws. AuthError and
  // PostgrestError both expose `message`, `status`, and often `code`
  // and `name` — we coerce defensively.
  const e = err as { message?: string; code?: string; status?: number; name?: string };

  // Always log the raw error before sanitizing so engineers retain
  // full debug context — we never leak the raw message to the UI.
  console.error(`[${ctx}] raw error:`, err);

  for (const pattern of AUTH_ERROR_PATTERNS) {
    if (pattern.test(e)) {
      return { message: pattern.message, code: pattern.code };
    }
  }

  // No pattern matched. Don't leak the raw text to the UI — surface a
  // generic fallback. Engineers still see the real error in console.
  return { message: DEFAULT_MESSAGE, code: 'unknown' };
}

/** Re-export for tests / devtools. */
export const _AUTH_ERROR_PATTERNS = AUTH_ERROR_PATTERNS;
export const _DEFAULT_AUTH_ERROR_MESSAGE = DEFAULT_MESSAGE;
